import type { Classification } from '@src/collection/types';

/**
 * Project-specific classification hooks. The core defaults are API-agnostic:
 * 2xx → OK, common 4xx → EXPECTED_4XX, 429/5xx → FAIL unless a rule says otherwise.
 */
export type ClassifyRules = {
    /** Treat this 429 as EXPECTED_4XX (e.g. intentional abuse-throttle probes). */
    expected429?: (name: string, url: string) => boolean;
    /** Extra 4xx cases to treat as EXPECTED_4XX (beyond the default status list). */
    expected4xx?: (name: string, url: string, status: number) => boolean;
    /** Treat this 5xx as WARN instead of FAIL (fixture/CMS/upstream noise). */
    warn5xx?: (name: string, url: string, status: number, snippet: string) => boolean;
};

const DEFAULT_EXPECTED_4XX = new Set([400, 401, 403, 404, 405, 422]);

export function classify(
    name: string,
    url: string,
    status: number | string,
    snippet: string,
    rules: ClassifyRules = {},
): Classification {
    if (status === 'SKIP') {
        return 'SKIP';
    }
    if (typeof status !== 'number') {
        return 'FAIL';
    }

    if (status === 429) {
        if (rules.expected429?.(name, url)) {
            return 'EXPECTED_4XX';
        }
        return 'FAIL';
    }

    if (status < 500) {
        if (DEFAULT_EXPECTED_4XX.has(status) || rules.expected4xx?.(name, url, status) === true) {
            return 'EXPECTED_4XX';
        }
        return 'OK';
    }

    if (rules.warn5xx?.(name, url, status, snippet)) {
        return 'WARN';
    }
    return 'FAIL';
}
