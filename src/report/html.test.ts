import { describe, expect, it } from 'vitest';

import type { SmokeResult } from '@src/config';
import { renderHtmlReport } from '@src/report/html';

describe('renderHtmlReport', () => {
    it('includes classification, url, and escapes HTML', () => {
        const results: SmokeResult[] = [
            {
                name: 'Auth/login',
                method: 'POST',
                url: 'http://127.0.0.1/api/auth?x=<script>',
                status: 200,
                classification: 'OK',
                snippet: '',
            },
            {
                name: 'x',
                method: 'GET',
                url: 'http://127.0.0.1/api/x',
                status: 500,
                classification: 'FAIL',
                snippet: 'boom <b>',
            },
        ];
        const html = renderHtmlReport(results);
        expect(html).toContain('Auth/login');
        expect(html).toContain('http://127.0.0.1/api/auth?x=&lt;script&gt;');
        expect(html).toContain('boom &lt;b&gt;');
        expect(html).toContain('FAIL');
        expect(html).toContain('OK=1');
    });
});
