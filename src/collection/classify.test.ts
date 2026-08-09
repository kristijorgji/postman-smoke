import { describe, expect, it } from 'vitest';

import { classify } from '@src/collection/classify';

describe('classify', () => {
    it('marks SKIP and non-numeric status', () => {
        expect(classify('x', 'http://x', 'SKIP', '')).toBe('SKIP');
        expect(classify('x', 'http://x', 'ERR', 'boom')).toBe('FAIL');
    });

    it('marks global 429 as FAIL unless expected429 rule matches', () => {
        expect(classify('Ads/get', 'http://127.0.0.1/api/anns', 429, 'Too Many')).toBe('FAIL');
        expect(
            classify('phone', 'http://127.0.0.1/api/user/phone', 429, 'Too Many', {
                expected429: (_n, url) => /\/phone/.test(url),
            }),
        ).toBe('EXPECTED_4XX');
    });

    it('marks validation 4xx as EXPECTED_4XX and 2xx as OK', () => {
        expect(classify('x', 'http://127.0.0.1/api/x', 400, '')).toBe('EXPECTED_4XX');
        expect(classify('x', 'http://127.0.0.1/api/x', 422, '')).toBe('EXPECTED_4XX');
        expect(classify('x', 'http://127.0.0.1/api/x', 200, '')).toBe('OK');
    });

    it('marks unknown 5xx as FAIL unless warn5xx matches', () => {
        expect(classify('x', 'http://127.0.0.1/api/x', 500, 'TypeError')).toBe('FAIL');
        expect(
            classify('x', 'http://127.0.0.1/api/x', 500, 'CMS down', {
                warn5xx: (_n, _u, _s, snippet) => /CMS/.test(snippet),
            }),
        ).toBe('WARN');
    });
});
