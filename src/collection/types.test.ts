import { describe, expect, it } from 'vitest';

import { flattenCollection, pathKey } from '@src/collection/types';

describe('pathKey', () => {
    it('joins folder and name', () => {
        expect(pathKey('Auth', 'login')).toBe('Auth/login');
        expect(pathKey('', 'base')).toBe('base');
    });
});

describe('flattenCollection', () => {
    it('builds nested keys and extracts method/url/body', () => {
        const flat = flattenCollection([
            {
                name: 'Auth',
                item: [
                    {
                        name: 'login',
                        request: {
                            method: 'POST',
                            url: '{{basePath}}/auth',
                            header: [
                                { key: 'Content-Type', value: 'application/json' },
                                { key: 'X-Skip', value: '1', disabled: true },
                                { key: undefined, value: 'x' },
                            ],
                            body: { mode: 'raw', raw: '{"a":1}' },
                        },
                    },
                    {
                        name: 'form',
                        request: {
                            method: 'POST',
                            url: { raw: '{{basePath}}/form' },
                            body: {
                                mode: 'urlencoded',
                                urlencoded: [
                                    { key: 'a', value: '1' },
                                    { key: 'b', value: '2' },
                                ],
                            },
                        },
                    },
                    {
                        name: 'empty',
                        request: {
                            method: 'GET',
                        },
                    },
                ],
            },
            {
                name: 'skip-folder',
            },
        ]);
        expect(flat).toHaveLength(3);
        expect(flat[0].key).toBe('Auth/login');
        expect(flat[0].method).toBe('POST');
        expect(flat[0].rawUrl).toBe('{{basePath}}/auth');
        expect(flat[0].body).toBe('{"a":1}');
        expect(flat[0].headers['X-Skip']).toBeUndefined();
        expect(flat[1].body).toBe('a=1&b=2');
        expect(flat[1].headers['Content-Type']).toBe('application/x-www-form-urlencoded');
        expect(flat[2].rawUrl).toBe('');
        expect(flat[2].method).toBe('GET');
    });
});
