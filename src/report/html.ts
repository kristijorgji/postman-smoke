import fs from 'fs';
import path from 'path';

import type { SmokeResult } from '@src/config';

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const COLORS: Record<string, string> = {
    OK: '#0a7a32',
    EXPECTED_4XX: '#6b7280',
    WARN: '#b45309',
    FAIL: '#b91c1c',
    SKIP: '#4b5563',
};

export function renderHtmlReport(results: SmokeResult[]): string {
    const counts: Record<string, number> = {};
    for (const r of results) {
        counts[r.classification] = (counts[r.classification] ?? 0) + 1;
    }

    const rows = results
        .map(r => {
            const color = COLORS[r.classification] ?? '#111';
            const snippet =
                r.classification === 'FAIL' || r.classification === 'WARN'
                    ? `<td class="snip">${escapeHtml(r.snippet)}</td>`
                    : '<td class="snip"></td>';
            return `<tr>
  <td style="color:${color};font-weight:600">${escapeHtml(r.classification)}</td>
  <td>${escapeHtml(String(r.status))}</td>
  <td>${escapeHtml(r.method)}</td>
  <td>${escapeHtml(r.name)}</td>
  <td class="url"><code>${escapeHtml(r.url)}</code></td>
  ${snippet}
</tr>`;
        })
        .join('\n');

    const countBits = Object.entries(counts)
        .map(([k, v]) => `${k}=${v}`)
        .join(' · ');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Postman smoke report</title>
<style>
  body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 24px; color: #111; }
  h1 { font-size: 1.25rem; margin: 0 0 8px; }
  .meta { color: #4b5563; margin-bottom: 16px; }
  table { border-collapse: collapse; width: 100%; font-size: 0.875rem; }
  th, td { border-bottom: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; vertical-align: top; }
  th { background: #f9fafb; position: sticky; top: 0; }
  code { font-size: 0.8rem; word-break: break-all; }
  .snip { color: #6b7280; max-width: 28rem; }
</style>
</head>
<body>
<h1>Postman smoke results</h1>
<p class="meta">${escapeHtml(countBits)} · TOTAL ${results.length} · generated ${escapeHtml(new Date().toISOString())}</p>
<table>
<thead>
<tr><th>Class</th><th>Status</th><th>Method</th><th>Name</th><th>URL</th><th>Snippet</th></tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
</body>
</html>
`;
}

export function writeHtmlReport(results: SmokeResult[], reportHtmlPath: string): void {
    const dir = path.dirname(reportHtmlPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(reportHtmlPath, renderHtmlReport(results), 'utf8');
}
