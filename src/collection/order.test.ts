import { describe, expect, it } from 'vitest';

import { defaultLeftoverScore, orderRequests } from '@src/collection/order';
import type { FlattenedRequest } from '@src/collection/types';

function req(
    partial: Partial<FlattenedRequest> & Pick<FlattenedRequest, 'key' | 'method' | 'rawUrl'>,
): FlattenedRequest {
    return {
        name: partial.key,
        headers: {},
        body: null,
        ...partial,
    };
}

describe('orderRequests', () => {
    it('places explicit keys first in listed order', () => {
        const requests = [
            req({ key: 'Users/delete', method: 'POST', rawUrl: '{{basePath}}/user/delete' }),
            req({ key: 'Auth/login', method: 'POST', rawUrl: '{{basePath}}/auth' }),
            req({ key: 'base', method: 'GET', rawUrl: '{{basePath}}/' }),
        ];
        const ordered = orderRequests(requests, ['Auth/login', 'base'], raw =>
            raw.replace('{{basePath}}', 'http://127.0.0.1/api'),
        );
        expect(ordered.map(r => r.key)).toEqual(['Auth/login', 'base', 'Users/delete']);
    });

    it('appends unknown keys via leftover score (GET before POST by default)', () => {
        const requests = [
            req({ key: 'Users/delete', method: 'POST', rawUrl: 'http://127.0.0.1/api/user/delete' }),
            req({ key: 'Ads/get', method: 'GET', rawUrl: 'http://127.0.0.1/api/anns' }),
        ];
        const ordered = orderRequests(requests, [], u => u);
        expect(ordered.map(r => r.key)).toEqual(['Ads/get', 'Users/delete']);
        expect(defaultLeftoverScore(requests[0], requests[0].rawUrl)).toBeGreaterThan(
            defaultLeftoverScore(requests[1], requests[1].rawUrl),
        );
    });

    it('skips missing explicit keys', () => {
        const requests = [req({ key: 'base', method: 'GET', rawUrl: 'http://127.0.0.1/api/' })];
        const ordered = orderRequests(requests, ['missing', 'base'], u => u);
        expect(ordered.map(r => r.key)).toEqual(['base']);
    });

    it('accepts a custom leftoverScore', () => {
        const requests = [
            req({ key: 'a', method: 'GET', rawUrl: 'http://x/a' }),
            req({ key: 'b', method: 'GET', rawUrl: 'http://x/b' }),
        ];
        const ordered = orderRequests(
            requests,
            [],
            u => u,
            r => (r.key === 'b' ? 1 : 99),
        );
        expect(ordered.map(r => r.key)).toEqual(['b', 'a']);
    });
});
