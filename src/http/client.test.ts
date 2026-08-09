import { describe, expect, it, vi } from 'vitest';

import { apiFetch } from '@src/http/client';

describe('apiFetch', () => {
    it('omits body for GET', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            status: 200,
            text: async () => 'ok',
        });
        vi.stubGlobal('fetch', fetchMock);

        await apiFetch('GET', 'http://example.test/x', { Accept: 'application/json' }, 'should-not-send');

        expect(fetchMock).toHaveBeenCalledOnce();
        const init = fetchMock.mock.calls[0][1] as RequestInit;
        expect(init.method).toBe('GET');
        expect(init).not.toHaveProperty('body');

        vi.unstubAllGlobals();
    });

    it('sends body for POST', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            status: 201,
            text: async () => '{}',
        });
        vi.stubGlobal('fetch', fetchMock);

        await apiFetch('POST', 'http://example.test/x', { 'Content-Type': 'application/json' }, '{"a":1}');

        expect(fetchMock).toHaveBeenCalledWith(
            'http://example.test/x',
            expect.objectContaining({
                method: 'POST',
                body: '{"a":1}',
            }),
        );

        vi.unstubAllGlobals();
    });
});
