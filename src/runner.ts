import fs from 'fs';

import { classify } from '@src/collection/classify';
import { defaultLeftoverScore, orderRequests } from '@src/collection/order';
import type { CollectionItem, FlattenedRequest } from '@src/collection/types';
import { flattenCollection } from '@src/collection/types';
import type { ResolvedSmokeConfig, SmokeContext, SmokeResult } from '@src/config';
import { apiFetch } from '@src/http/client';
import { logger } from '@src/logger';
import { writeHtmlReport } from '@src/report/html';

export async function runSmoke(config: ResolvedSmokeConfig): Promise<number> {
    for (const envPath of config.envFiles) {
        if (fs.existsSync(envPath)) {
            const dotenv = await import('dotenv');
            dotenv.default.config({ path: envPath, override: true });
        }
    }

    const vars: Record<string, string> = { ...config.initialVars };
    const subst = (input: string): string =>
        input.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => vars[key] ?? `{{${key}}}`);

    const ctx: SmokeContext = {
        config,
        vars,
        subst,
        apiFetch,
        logger,
    };

    for (const plugin of config.plugins) {
        await plugin.beforeAll?.(ctx);
    }

    const collection = JSON.parse(fs.readFileSync(config.collectionPath, 'utf8')) as {
        item: CollectionItem[];
        variable?: Array<{ key: string; value?: string }>;
    };

    const locked = new Set(config.lockedVarKeys);
    for (const v of collection.variable ?? []) {
        if (v.key === 'basePath' || v.value === undefined) {
            continue;
        }
        if (locked.has(v.key)) {
            continue;
        }
        if (vars[v.key] !== undefined && vars[v.key] !== '') {
            continue;
        }
        vars[v.key] = v.value;
    }

    const explicitKeys = JSON.parse(fs.readFileSync(config.orderPath, 'utf8')) as string[];
    const leftoverScore = config.leftoverScore ?? defaultLeftoverScore;
    const flat = orderRequests(flattenCollection(collection.item), explicitKeys, subst, leftoverScore);
    const results: SmokeResult[] = [];

    for (const req of flat) {
        for (const plugin of config.plugins) {
            await plugin.beforeRequest?.(req, ctx);
        }

        const { result, body } = await executeOne(req, ctx);
        for (const plugin of config.plugins) {
            const override = plugin.classify?.(req, result, ctx);
            if (override) {
                result.classification = override;
            }
        }
        results.push(result);

        for (const plugin of config.plugins) {
            await plugin.afterRequest?.(req, result, body, ctx);
        }
    }

    if (config.extraResults) {
        results.push(...(await config.extraResults(ctx)));
    }

    for (const plugin of config.plugins) {
        await plugin.afterAll?.(ctx);
    }

    printReport(results);

    if (config.reportHtmlPath !== undefined && config.reportHtmlPath !== '') {
        writeHtmlReport(results, config.reportHtmlPath);
        logger.info('Wrote HTML report to %s', config.reportHtmlPath);
    }

    const fails = results.filter(r => r.classification === 'FAIL');
    const warns = results.filter(r => r.classification === 'WARN');
    if (fails.length > 0) {
        return 1;
    }
    if (config.strict && warns.length > 0) {
        return 1;
    }
    return 0;
}

function defaultResolveAuthorization(url: string, vars: Record<string, string>): string | undefined {
    void url;
    if (vars.accessToken !== undefined && vars.accessToken !== '') {
        return `Bearer ${vars.accessToken}`;
    }
    return undefined;
}

async function executeOne(
    req: FlattenedRequest,
    ctx: SmokeContext,
): Promise<{ result: SmokeResult; body: string | null }> {
    const { config, vars, subst } = ctx;
    const url = subst(req.rawUrl);

    const skip = config.skipUrl?.(url) === true || (!url.startsWith('http') && !url.startsWith('/'));
    if (skip) {
        const result: SmokeResult = {
            name: req.key,
            method: req.method,
            url,
            status: 'SKIP',
            classification: 'SKIP',
            snippet: 'skipped',
        };
        return { result, body: null };
    }

    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) {
        headers[k] = subst(v);
    }
    for (const [k, v] of Object.entries(config.defaultHeaders)) {
        headers[k] = subst(v);
    }
    headers.Host = config.hostHeader;
    headers.Accept = headers.Accept ?? 'application/json';
    headers['User-Agent'] = headers['User-Agent'] ?? config.userAgent;
    if (headers['X-Request-ID'] === undefined && headers['X-Request-Id'] === undefined) {
        headers['X-Request-ID'] = `smoke-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    const resolveAuth = config.resolveAuthorization ?? defaultResolveAuthorization;
    const authorization = resolveAuth(url, vars, config);
    if (authorization !== undefined) {
        headers.Authorization = authorization;
    }

    const clientKey = vars.apiKey !== undefined && vars.apiKey !== '' ? vars.apiKey : (vars.sapiKey ?? '');
    if (clientKey !== '') {
        for (const [hk, hv] of Object.entries(headers)) {
            if (hk.toLowerCase() === 'x-api-key' && (hv.includes('{{') || hv === '')) {
                headers[hk] = clientKey;
            }
        }
    }

    const body = req.body !== null && req.method !== 'GET' && req.method !== 'HEAD' ? subst(req.body) : null;

    let status: number | string;
    let snippet: string;
    let responseText: string | null = null;
    const fullUrl = url.startsWith('http') ? url : `${config.apiOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
    try {
        const res = await apiFetch(req.method, fullUrl, headers, body);
        status = res.status;
        responseText = res.text;
        snippet = res.text.replace(/\s+/g, ' ').slice(0, 140);
    } catch (e) {
        status = 'ERR';
        snippet = (e as Error).message.slice(0, 140);
    }

    const result: SmokeResult = {
        name: req.key,
        method: req.method,
        url: fullUrl,
        status,
        classification: classify(req.key, fullUrl, status, snippet, config.classifyRules),
        snippet,
    };
    return { result, body: responseText };
}

function printReport(results: SmokeResult[]): void {
    const counts: Record<string, number> = {};
    for (const r of results) {
        counts[r.classification] = (counts[r.classification] ?? 0) + 1;
    }

    logger.info('=== Postman smoke results ===');
    for (const r of results) {
        const st = String(r.status).padStart(4);
        logger.info('%s %s %s %s  %s', r.classification.padEnd(13), st, r.method.padEnd(6), r.name, r.url);
        if (r.classification === 'FAIL' || r.classification === 'WARN') {
            logger.info('              %s', r.snippet);
        }
    }
    logger.info('COUNTS %s', JSON.stringify(counts));
    logger.info('TOTAL %d', results.length);
}
