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

    const classifications = Object.keys(counts).sort();

    const rows = results
        .map(r => {
            const color = COLORS[r.classification] ?? '#111';
            const snippet =
                r.classification === 'FAIL' || r.classification === 'WARN'
                    ? `<td class="snip">${escapeHtml(r.snippet)}</td>`
                    : '<td class="snip"></td>';
            return `<tr data-class="${escapeHtml(r.classification)}" data-search="${escapeHtml(
                `${r.classification} ${r.status} ${r.method} ${r.name} ${r.url} ${r.snippet}`.toLowerCase(),
            )}">
  <td style="color:${color};font-weight:600">${escapeHtml(r.classification)}</td>
  <td data-num="${escapeHtml(String(r.status))}">${escapeHtml(String(r.status))}</td>
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

    const filterOptions = [
        '<option value="">All classifications</option>',
        ...classifications.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)} (${counts[c]})</option>`),
    ].join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Postman smoke report</title>
<style>
  body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 24px; color: #111; }
  h1 { font-size: 1.25rem; margin: 0 0 8px; }
  .meta { color: #4b5563; margin-bottom: 12px; }
  .toolbar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 16px; }
  .toolbar input[type="search"] { min-width: 16rem; padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 6px; }
  .toolbar select { padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 6px; }
  .toolbar .visible { color: #4b5563; font-size: 0.875rem; }
  table { border-collapse: collapse; width: 100%; font-size: 0.875rem; }
  th, td { border-bottom: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; vertical-align: top; }
  th { background: #f9fafb; position: sticky; top: 0; cursor: pointer; user-select: none; white-space: nowrap; }
  th:hover { background: #f3f4f6; }
  th .arrow { color: #9ca3af; font-size: 0.75rem; margin-left: 4px; }
  th.sorted-asc .arrow, th.sorted-desc .arrow { color: #111; }
  code { font-size: 0.8rem; word-break: break-all; }
  .snip { color: #6b7280; max-width: 28rem; }
  tr.hidden { display: none; }
</style>
</head>
<body>
<h1>Postman smoke results</h1>
<p class="meta">${escapeHtml(countBits)} · TOTAL ${results.length} · generated ${escapeHtml(new Date().toISOString())}</p>
<div class="toolbar">
  <input id="q" type="search" placeholder="Search name, URL, snippet…" aria-label="Search results"/>
  <select id="classFilter" aria-label="Filter by classification">
${filterOptions}
  </select>
  <span class="visible" id="visibleCount"></span>
</div>
<table id="report">
<thead>
<tr>
  <th data-col="0">Class<span class="arrow"></span></th>
  <th data-col="1">Status<span class="arrow"></span></th>
  <th data-col="2">Method<span class="arrow"></span></th>
  <th data-col="3">Name<span class="arrow"></span></th>
  <th data-col="4">URL<span class="arrow"></span></th>
  <th data-col="5">Snippet<span class="arrow"></span></th>
</tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
<script>
(function () {
  var table = document.getElementById('report');
  var tbody = table.tBodies[0];
  var q = document.getElementById('q');
  var classFilter = document.getElementById('classFilter');
  var visibleCount = document.getElementById('visibleCount');
  var sortCol = -1;
  var sortAsc = true;

  function applyFilter() {
    var needle = (q.value || '').trim().toLowerCase();
    var cls = classFilter.value;
    var rows = tbody.querySelectorAll('tr');
    var shown = 0;
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var okClass = !cls || row.getAttribute('data-class') === cls;
      var okSearch = !needle || (row.getAttribute('data-search') || '').indexOf(needle) !== -1;
      var show = okClass && okSearch;
      row.classList.toggle('hidden', !show);
      if (show) shown++;
    }
    visibleCount.textContent = 'Showing ' + shown + ' / ' + rows.length;
  }

  function cellSortValue(row, col) {
    var cell = row.cells[col];
    if (!cell) return '';
    if (col === 1) {
      var n = cell.getAttribute('data-num');
      var num = Number(n);
      return isNaN(num) ? n || '' : num;
    }
    return (cell.textContent || '').trim().toLowerCase();
  }

  function sortBy(col) {
    if (sortCol === col) {
      sortAsc = !sortAsc;
    } else {
      sortCol = col;
      sortAsc = true;
    }
    var headers = table.tHead.rows[0].cells;
    for (var h = 0; h < headers.length; h++) {
      headers[h].classList.remove('sorted-asc', 'sorted-desc');
      var arrow = headers[h].querySelector('.arrow');
      if (arrow) arrow.textContent = '';
    }
    var active = headers[col];
    active.classList.add(sortAsc ? 'sorted-asc' : 'sorted-desc');
    var activeArrow = active.querySelector('.arrow');
    if (activeArrow) activeArrow.textContent = sortAsc ? '▲' : '▼';

    var rows = Array.prototype.slice.call(tbody.querySelectorAll('tr'));
    rows.sort(function (a, b) {
      var va = cellSortValue(a, col);
      var vb = cellSortValue(b, col);
      var cmp = 0;
      if (typeof va === 'number' && typeof vb === 'number') {
        cmp = va - vb;
      } else {
        cmp = String(va).localeCompare(String(vb));
      }
      return sortAsc ? cmp : -cmp;
    });
    for (var i = 0; i < rows.length; i++) {
      tbody.appendChild(rows[i]);
    }
  }

  q.addEventListener('input', applyFilter);
  classFilter.addEventListener('change', applyFilter);
  table.tHead.addEventListener('click', function (e) {
    var th = e.target.closest('th');
    if (!th || !table.tHead.contains(th)) return;
    var col = Number(th.getAttribute('data-col'));
    if (isNaN(col)) return;
    sortBy(col);
  });
  applyFilter();
})();
</script>
</body>
</html>
`;
}

export function writeHtmlReport(results: SmokeResult[], reportHtmlPath: string): void {
    const dir = path.dirname(reportHtmlPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(reportHtmlPath, renderHtmlReport(results), 'utf8');
}
