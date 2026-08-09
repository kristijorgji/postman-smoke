import type { ClassifyRules } from '@src/collection/classify';
import type { Classification, FlattenedRequest } from '@src/collection/types';
import type { apiFetch } from '@src/http/client';
import type { logger as LoggerType } from '@src/logger';

export type SmokeResult = {
    name: string;
    method: string;
    url: string;
    status: number | string;
    classification: Classification;
    snippet: string;
};

export type SmokeContext = {
    config: ResolvedSmokeConfig;
    vars: Record<string, string>;
    subst: (input: string) => string;
    apiFetch: typeof apiFetch;
    logger: typeof LoggerType;
};

export type SmokePlugin = {
    name?: string;
    beforeAll?: (ctx: SmokeContext) => Promise<void> | void;
    afterAll?: (ctx: SmokeContext) => Promise<void> | void;
    beforeRequest?: (req: FlattenedRequest, ctx: SmokeContext) => Promise<void> | void;
    afterRequest?: (
        req: FlattenedRequest,
        result: SmokeResult,
        body: string | null,
        ctx: SmokeContext,
    ) => Promise<void> | void;
    /** Return a classification to override the default classifier; null/undefined keeps default. */
    classify?: (req: FlattenedRequest, result: SmokeResult, ctx: SmokeContext) => Classification | null | undefined;
};

export type SmokeConfigInput = {
    collectionPath: string;
    orderPath: string;
    apiOrigin: string;
    hostHeader: string;
    strict?: boolean;
    envFiles?: string[];
    initialVars?: Record<string, string>;
    lockedVarKeys?: string[];
    userAgent?: string;
    /** Extra default request headers (merged after collection headers, before auth). */
    defaultHeaders?: Record<string, string>;
    plugins?: SmokePlugin[];
    classifyRules?: ClassifyRules;
    /** Skip request when this returns true (e.g. third-party OAuth URLs). */
    skipUrl?: (url: string) => boolean;
    /** Score for requests not listed in order.json; lower runs earlier. */
    leftoverScore?: (req: FlattenedRequest, substUrl: string) => number;
    /** Build Authorization header value, or undefined to omit. */
    resolveAuthorization?: (
        url: string,
        vars: Record<string, string>,
        config: ResolvedSmokeConfig,
    ) => string | undefined;
    extraResults?: (ctx: SmokeContext) => Promise<SmokeResult[]>;
    /** When set, write a self-contained HTML report to this path after the run. */
    reportHtmlPath?: string;
};

export type ResolvedSmokeConfig = Required<
    Pick<SmokeConfigInput, 'collectionPath' | 'orderPath' | 'apiOrigin' | 'hostHeader' | 'strict'>
> & {
    envFiles: string[];
    initialVars: Record<string, string>;
    lockedVarKeys: string[];
    userAgent: string;
    defaultHeaders: Record<string, string>;
    plugins: SmokePlugin[];
    classifyRules: ClassifyRules;
    skipUrl?: (url: string) => boolean;
    leftoverScore?: (req: FlattenedRequest, substUrl: string) => number;
    resolveAuthorization?: (
        url: string,
        vars: Record<string, string>,
        config: ResolvedSmokeConfig,
    ) => string | undefined;
    extraResults?: (ctx: SmokeContext) => Promise<SmokeResult[]>;
    reportHtmlPath?: string;
};

export function defineConfig(config: SmokeConfigInput): SmokeConfigInput {
    return config;
}

export function resolveConfig(
    input: SmokeConfigInput,
    strictFlag: boolean,
    overrides: { reportHtmlPath?: string } = {},
): ResolvedSmokeConfig {
    return {
        collectionPath: input.collectionPath,
        orderPath: input.orderPath,
        apiOrigin: input.apiOrigin.replace(/\/$/, ''),
        hostHeader: input.hostHeader,
        strict: Boolean(input.strict) || strictFlag,
        envFiles: input.envFiles ?? [],
        initialVars: input.initialVars ?? {},
        lockedVarKeys: input.lockedVarKeys ?? [],
        userAgent: input.userAgent ?? 'Mozilla/5.0 (compatible; postman-smoke/1.0)',
        defaultHeaders: input.defaultHeaders ?? {},
        plugins: input.plugins ?? [],
        classifyRules: input.classifyRules ?? {},
        skipUrl: input.skipUrl,
        leftoverScore: input.leftoverScore,
        resolveAuthorization: input.resolveAuthorization,
        extraResults: input.extraResults,
        reportHtmlPath: overrides.reportHtmlPath ?? input.reportHtmlPath,
    };
}
