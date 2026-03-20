/**
 * Universal JSON → HTML renderer.
 *
 * No hardcoded business logic. No status badges, no price formatting,
 * no regex-based field type guessing. Just clean structural rendering:
 *
 *   Array<Object>  → sortable <table>
 *   Object         → <dl> key-value pairs (recursive for nesting)
 *   Array<scalar>  → <ul> list
 *   string         → text
 *   number         → number
 *   boolean        → true/false
 *   null           → placeholder
 *
 * All formatting decisions are the caller's responsibility (LLM or user).
 */
import { escapeHtml } from './html-builder.js';

// ── Structural detection ──

function isArrayOfObjects(data: unknown): data is Record<string, unknown>[] {
  return Array.isArray(data) && data.length > 0 &&
    data.every(item => item !== null && typeof item === 'object' && !Array.isArray(item));
}

function isFlatObject(data: unknown): data is Record<string, unknown> {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) return false;
  return Object.values(data as Record<string, unknown>).every(
    v => v === null || typeof v !== 'object'
  );
}

function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
    .trim();
}

// ── Render primitives ──

function renderValue(value: unknown, depth: number): string {
  if (value === null || value === undefined) {
    return '<span class="mcp-null">—</span>';
  }
  if (typeof value === 'boolean') {
    return `<span class="mcp-bool">${value}</span>`;
  }
  if (typeof value === 'number') {
    return `<span class="mcp-num">${value}</span>`;
  }
  if (typeof value === 'string') {
    if (value.length > 300) {
      return `<div class="mcp-text">${escapeHtml(value)}</div>`;
    }
    return escapeHtml(value);
  }
  // Recurse into objects/arrays
  return renderAny(value, depth + 1);
}

// ── Core recursive renderer ──

function renderTable(rows: Record<string, unknown>[]): string {
  const columns = Object.keys(rows[0]);
  const headerCells = columns
    .map((col, i) =>
      `<th onclick="__mcpSort(${i})" class="mcp-sortable">${escapeHtml(humanizeKey(col))}<span class="mcp-sort-icon">⇅</span></th>`)
    .join('');

  const bodyRows = rows
    .map(row =>
      `<tr>${columns.map(col => `<td>${renderValue(row[col], 0)}</td>`).join('')}</tr>`)
    .join('\n');

  return `<div class="mcp-table-wrap">
  <div class="mcp-table-meta">${rows.length} rows × ${columns.length} columns</div>
  <div class="mcp-table-scroll">
    <table class="mcp-table" id="mcp-grid">
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
  </div>
</div>`;
}

function renderKeyValue(obj: Record<string, unknown>, depth: number): string {
  const entries = Object.entries(obj);
  const items = entries.map(([key, val]) => {
    const rendered = renderValue(val, depth);
    return `<div class="mcp-kv">
      <dt class="mcp-key">${escapeHtml(humanizeKey(key))}</dt>
      <dd class="mcp-val">${rendered}</dd>
    </div>`;
  }).join('\n');

  return `<dl class="mcp-dl">${items}</dl>`;
}

function renderList(arr: unknown[], depth: number): string {
  const items = arr.map(item =>
    `<li>${renderValue(item, depth)}</li>`
  ).join('\n');
  return `<ul class="mcp-list">${items}</ul>`;
}

function renderCollapsible(label: string, content: string, open = true): string {
  return `<details class="mcp-details" ${open ? 'open' : ''}>
  <summary class="mcp-summary">${escapeHtml(label)}</summary>
  <div class="mcp-details-body">${content}</div>
</details>`;
}

function renderAny(data: unknown, depth: number): string {
  // Primitive
  if (data === null || data === undefined || typeof data !== 'object') {
    return renderValue(data, depth);
  }

  // Array of objects → table
  if (isArrayOfObjects(data)) {
    const content = renderTable(data);
    return depth > 0 ? renderCollapsible(`Array (${data.length} items)`, content) : content;
  }

  // Generic array → list or collapsible
  if (Array.isArray(data)) {
    const content = renderList(data, depth);
    return depth > 0 ? renderCollapsible(`Array (${data.length})`, content) : content;
  }

  // Flat object → key-value pairs
  const obj = data as Record<string, unknown>;
  if (isFlatObject(obj)) {
    return renderKeyValue(obj, depth);
  }

  // Nested object → grouped sections
  const entries = Object.entries(obj);
  const sections = entries.map(([key, val]) => {
    if (val !== null && typeof val === 'object') {
      return renderCollapsible(humanizeKey(key), renderAny(val, depth + 1), depth < 2);
    }
    return `<div class="mcp-kv">
      <dt class="mcp-key">${escapeHtml(humanizeKey(key))}</dt>
      <dd class="mcp-val">${renderValue(val, depth)}</dd>
    </div>`;
  });

  // If all entries are primitives at this level, use dl
  const allPrimitive = entries.every(([, v]) => v === null || typeof v !== 'object');
  if (allPrimitive) {
    return renderKeyValue(obj, depth);
  }

  return `<div class="mcp-section">${sections.join('\n')}</div>`;
}

// ── Public API ──

/** Render any JSON data as an HTML fragment. No business logic, pure structure. */
export function renderJSON(data: unknown): string {
  return `<div class="mcp-root">${renderAny(data, 0)}</div>`;
}

/** Get the CSS for the universal renderer */
export function getRendererCSS(): string {
  return `
.mcp-root { max-width: 960px; margin: 0 auto; }

/* Table */
.mcp-table-wrap { overflow: hidden; }
.mcp-table-meta {
  font-size: var(--text-xs); color: var(--text-tertiary);
  padding-bottom: var(--sp-2); margin-bottom: var(--sp-2);
  border-bottom: 1px solid var(--border);
}
.mcp-table-scroll { overflow-x: auto; }
.mcp-table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
.mcp-table th {
  text-align: left; padding: var(--sp-2) var(--sp-3);
  font-weight: 600; color: var(--text-secondary); font-size: var(--text-xs);
  text-transform: uppercase; letter-spacing: 0.05em;
  border-bottom: 2px solid var(--border);
  white-space: nowrap; user-select: none;
}
.mcp-sortable { cursor: pointer; }
.mcp-sortable:hover { color: var(--accent); }
.mcp-sort-icon { margin-left: 4px; opacity: 0.3; font-size: 10px; }
.mcp-table td {
  padding: var(--sp-2) var(--sp-3); border-bottom: 1px solid var(--border);
  vertical-align: top;
}
.mcp-table tbody tr:hover { background: var(--accent-subtle); }

/* Key-Value */
.mcp-dl { display: grid; grid-template-columns: 1fr; gap: 0; }
.mcp-kv {
  display: grid; grid-template-columns: minmax(120px, auto) 1fr;
  gap: var(--sp-3); padding: var(--sp-2) 0;
  border-bottom: 1px solid var(--border);
}
.mcp-kv:last-child { border-bottom: none; }
.mcp-key {
  font-weight: 600; font-size: var(--text-sm); color: var(--text-secondary);
  word-break: break-word;
}
.mcp-val { font-size: var(--text-sm); word-break: break-word; }

/* List */
.mcp-list {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-direction: column; gap: var(--sp-1);
}
.mcp-list li {
  padding: var(--sp-1) var(--sp-2); font-size: var(--text-sm);
  border-left: 2px solid var(--border); margin-left: var(--sp-2);
}

/* Collapsible sections */
.mcp-details {
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  margin-bottom: var(--sp-2);
}
.mcp-summary {
  padding: var(--sp-2) var(--sp-3); font-weight: 600; font-size: var(--text-sm);
  cursor: pointer; user-select: none;
}
.mcp-summary:hover { color: var(--accent); }
.mcp-details-body { padding: var(--sp-3); border-top: 1px solid var(--border); }

/* Sections */
.mcp-section { display: flex; flex-direction: column; gap: var(--sp-3); }

/* Primitives */
.mcp-null { color: var(--text-tertiary); font-style: italic; }
.mcp-bool { font-weight: 600; }
.mcp-num { font-variant-numeric: tabular-nums; }
.mcp-text { white-space: pre-wrap; line-height: 1.6; }
`;
}

/** Get the JS for table sorting (the only interactive behavior) */
export function getRendererJS(): string {
  return `
function __mcpSort(colIdx) {
  var table = document.getElementById('mcp-grid');
  if (!table) return;
  var tbody = table.tBodies[0];
  var rows = Array.from(tbody.rows);
  var dir = table.dataset.sortDir === 'asc' ? 'desc' : 'asc';
  table.dataset.sortDir = dir;

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
