// ── Data Grid Renderer: Array of objects → sortable table ──
import { escapeHtml } from '../html-builder.js';

const STATUS_MAP: Record<string, string> = {
  active: 'badge-success',
  enabled: 'badge-success',
  available: 'badge-success',
  in_stock: 'badge-success',
  completed: 'badge-success',
  inactive: 'badge-danger',
  disabled: 'badge-danger',
  out_of_stock: 'badge-danger',
  backorder: 'badge-warning',
  pending: 'badge-warning',
  processing: 'badge-warning',
  low_stock: 'badge-warning',
  info: 'badge-info',
  draft: 'badge-info',
};

function formatCell(value: unknown, key: string): string {
  if (value === null || value === undefined) return '<span class="null">—</span>';

  const strVal = String(value);

  // Status badge detection
  const normalized = strVal.toLowerCase().replace(/[\s-]+/g, '_');
  if (STATUS_MAP[normalized]) {
    return `<span class="badge ${STATUS_MAP[normalized]}">${escapeHtml(strVal)}</span>`;
  }

  // Price formatting detection
  if (typeof value === 'number' && /price|cost|amount|total|revenue/i.test(key)) {
    return `<span class="price">$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`;
  }

  // Number formatting
  if (typeof value === 'number') {
    return `<span class="num">${value.toLocaleString()}</span>`;
  }

  // Boolean
  if (typeof value === 'boolean') {
    return value ? '<span class="bool-true">✓</span>' : '<span class="bool-false">✗</span>';
  }

  // Nested object/array → compact JSON
  if (typeof value === 'object') {
    return `<code class="cell-json">${escapeHtml(JSON.stringify(value))}</code>`;
  }

  return escapeHtml(strVal);
}

function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

export function renderDataGrid(
  data: unknown,
  metadata: Record<string, unknown>
): string {
  const rows = data as Record<string, unknown>[];
  const columns = (metadata['columns'] as string[]) ?? Object.keys(rows[0] ?? {});

  const headerCells = columns
    .map(
      (col, i) =>
        `<th onclick="__mcpSort(${i})" class="sortable">${escapeHtml(humanizeKey(col))}<span class="sort-icon">⇅</span></th>`
    )
    .join('');

  const bodyRows = rows
    .map(
      (row, ri) =>
        `<tr class="animate-in" style="animation-delay:${Math.min(ri * 20, 300)}ms">${columns.map((col) => `<td>${formatCell(row[col], col)}</td>`).join('')}</tr>`
    )
    .join('\n');

  const rowCount = rows.length;
  const colCount = columns.length;

  return `<div class="grid-container card">
  <div class="grid-header">
    <span class="grid-meta">${rowCount} rows × ${colCount} columns</span>
  </div>
  <div class="table-wrap">
    <table class="data-table" id="mcp-grid">
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
  </div>
</div>`;
}

export function getDataGridCSS(): string {
  return `
.grid-container { overflow: hidden; }
.grid-header {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: var(--sp-3); margin-bottom: var(--sp-3); border-bottom: 1px solid var(--border);
}
.grid-meta { font-size: var(--text-xs); color: var(--text-tertiary); }
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
.data-table th {
  text-align: left; padding: var(--sp-2) var(--sp-3);
  font-weight: 600; color: var(--text-secondary); font-size: var(--text-xs);
  text-transform: uppercase; letter-spacing: 0.05em;
  border-bottom: 2px solid var(--border);
  white-space: nowrap; user-select: none;
}
.sortable { cursor: pointer; }
.sortable:hover { color: var(--accent); }
.sort-icon { margin-left: 4px; opacity: 0.3; font-size: 10px; }
.data-table td {
  padding: var(--sp-2) var(--sp-3); border-bottom: 1px solid var(--border);
  vertical-align: middle;
}
.data-table tbody tr:hover { background: var(--accent-subtle); }
.data-table tbody tr:nth-child(even) { background: var(--bg-secondary); }
.data-table tbody tr:nth-child(even):hover { background: var(--accent-subtle); }

.null { color: var(--text-tertiary); }
.price { font-weight: 600; font-variant-numeric: tabular-nums; }
.num { font-variant-numeric: tabular-nums; }
.bool-true { color: var(--success); font-weight: 700; }
.bool-false { color: var(--danger); font-weight: 700; }
.cell-json { font-size: var(--text-xs); max-width: 200px; overflow: hidden; text-overflow: ellipsis; display: inline-block; }
`;
}

export function getDataGridJS(): string {
  return `
function __mcpSort(colIdx) {
  var table = document.getElementById('mcp-grid');
  if (!table) return;
  var tbody = table.tBodies[0];
  var rows = Array.from(tbody.rows);
  var dir = table.dataset.sortDir === 'asc' ? 'desc' : 'asc';
  table.dataset.sortDir = dir;
  table.dataset.sortCol = colIdx;

  rows.sort(function(a, b) {
    var av = a.cells[colIdx].textContent.trim();
    var bv = b.cells[colIdx].textContent.trim();
    var an = parseFloat(av.replace(/[^\\d.-]/g, ''));
    var bn = parseFloat(bv.replace(/[^\\d.-]/g, ''));
    if (!isNaN(an) && !isNaN(bn)) return dir === 'asc' ? an - bn : bn - an;
    return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  rows.forEach(function(row) { tbody.appendChild(row); });
}`;
}
