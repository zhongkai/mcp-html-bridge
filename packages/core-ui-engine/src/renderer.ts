/**
 * Universal JSON → HTML renderer.
 *
 * No hardcoded business logic. No status badges, no price formatting,
 * no regex-based field type guessing. Just clean structural rendering
 * that handles any JSON shape gracefully:
 *
 *   Array<Object>  → sortable <table> (union of all keys)
 *   Object         → <dl> key-value pairs (recursive for nesting)
 *   Array<mixed>   → <ul> list with recursive items
 *   string         → text (auto-links URLs)
 *   number         → number
 *   boolean        → true/false
 *   null           → placeholder
 *   empty          → explicit empty indicator
 *
 * All formatting decisions are the caller's responsibility (LLM or user).
 */
import { escapeHtml } from './html-builder.js';

// ── Constants ──

const MAX_DEPTH = 30;
const MAX_TABLE_ROWS = 500;
const MAX_LIST_ITEMS = 200;
const URL_REGEX = /^https?:\/\/[^\s<>"{}|\\^`[\]]+$/;
const IMAGE_EXT_REGEX = /\.(png|jpe?g|gif|webp|svg|ico|bmp)(\?[^\s]*)?$/i;

// ── Structural detection ──

function isArrayOfObjects(data: unknown): data is Record<string, unknown>[] {
  if (!Array.isArray(data) || data.length === 0) return false;
  // At least 80% must be non-null objects (tolerates a few nulls in the array)
  let objCount = 0;
  for (const item of data) {
    if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
      objCount++;
    }
  }
  return objCount / data.length >= 0.8 && objCount >= 1;
}

function isFlatObject(data: unknown): data is Record<string, unknown> {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) return false;
  const values = Object.values(data as Record<string, unknown>);
  if (values.length === 0) return true;
  return values.every(v => v === null || typeof v !== 'object');
}

function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
    .trim();
}

function isUrl(value: string): boolean {
  return URL_REGEX.test(value);
}

function isImageUrl(value: string): boolean {
  return IMAGE_EXT_REGEX.test(value);
}

// ── Render primitives ──

function renderValue(value: unknown, depth: number): string {
  if (value === null || value === undefined) {
    return '<span class="mcp-null">\u2014</span>';
  }
  if (typeof value === 'boolean') {
    return `<span class="mcp-bool mcp-bool-${value}">${value}</span>`;
  }
  if (typeof value === 'number') {
    return `<span class="mcp-num">${value}</span>`;
  }
  if (typeof value === 'string') {
    if (value.length === 0) {
      return '<span class="mcp-null">(empty)</span>';
    }
    // Auto-link URLs
    if (isUrl(value)) {
      const escaped = escapeHtml(value);
      if (isImageUrl(value)) {
        return `<a href="${escaped}" target="_blank" rel="noopener"><img class="mcp-img" src="${escaped}" alt="" loading="lazy"></a>`;
      }
      return `<a class="mcp-link" href="${escaped}" target="_blank" rel="noopener">${escaped}</a>`;
    }
    if (value.length > 300) {
      return `<div class="mcp-text">${escapeHtml(value)}</div>`;
    }
    return escapeHtml(value);
  }
  // Recurse into objects/arrays
  return renderAny(value, depth + 1);
}

// ── Core recursive renderer ──

/** Collect union of all keys across an array of objects, preserving order */
function collectColumns(rows: Record<string, unknown>[]): string[] {
  const seen = new Set<string>();
  const columns: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key);
        columns.push(key);
      }
    }
  }
  return columns;
}

function renderTable(rows: Record<string, unknown>[], tableId: string): string {
  const columns = collectColumns(rows);
  const truncated = rows.length > MAX_TABLE_ROWS;
  const displayRows = truncated ? rows.slice(0, MAX_TABLE_ROWS) : rows;

  const headerCells = columns
    .map((col, i) =>
      `<th onclick="__mcpSort('${escapeHtml(tableId)}',${i})" class="mcp-sortable">${escapeHtml(humanizeKey(col))}<span class="mcp-sort-icon">\u21C5</span></th>`)
    .join('');

  const bodyRows = displayRows
    .map(row => {
      const cells = columns.map(col => {
        const val = Object.prototype.hasOwnProperty.call(row, col) ? row[col] : undefined;
        return `<td>${renderValue(val, 1)}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    })
    .join('\n');

  const meta = truncated
    ? `${rows.length} rows \u00D7 ${columns.length} columns (showing first ${MAX_TABLE_ROWS})`
    : `${rows.length} rows \u00D7 ${columns.length} columns`;

  return `<div class="mcp-table-wrap">
  <div class="mcp-table-meta">${meta}</div>
  <div class="mcp-table-scroll">
    <table class="mcp-table" id="${escapeHtml(tableId)}">
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
  </div>
</div>`;
}

function renderKeyValue(obj: Record<string, unknown>, depth: number): string {
  const entries = Object.entries(obj);
  if (entries.length === 0) {
    return '<div class="mcp-empty">(empty object)</div>';
  }
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
  if (arr.length === 0) {
    return '<div class="mcp-empty">(empty array)</div>';
  }
  const truncated = arr.length > MAX_LIST_ITEMS;
  const displayItems = truncated ? arr.slice(0, MAX_LIST_ITEMS) : arr;

  const items = displayItems.map(item =>
    `<li>${renderValue(item, depth)}</li>`
  ).join('\n');

  const suffix = truncated
    ? `<li class="mcp-truncated">\u2026 and ${arr.length - MAX_LIST_ITEMS} more items</li>`
    : '';

  return `<ul class="mcp-list">${items}\n${suffix}</ul>`;
}

function renderCollapsible(label: string, content: string, open = true): string {
  return `<details class="mcp-details" ${open ? 'open' : ''}>
  <summary class="mcp-summary">${escapeHtml(label)}</summary>
  <div class="mcp-details-body">${content}</div>
</details>`;
}

// Global table counter for unique IDs
let tableCounter = 0;

function renderAny(data: unknown, depth: number): string {
  // Depth guard
  if (depth > MAX_DEPTH) {
    return '<span class="mcp-null">(max depth reached)</span>';
  }

  // Primitive
  if (data === null || data === undefined || typeof data !== 'object') {
    return renderValue(data, depth);
  }

  // Array of objects → table
  if (isArrayOfObjects(data)) {
    // Filter to only objects for the table, skip non-objects
    const objectRows = (data as unknown[]).filter(
      (item): item is Record<string, unknown> =>
        item !== null && typeof item === 'object' && !Array.isArray(item)
    );
    const tableId = `mcp-grid-${tableCounter++}`;
    const content = renderTable(objectRows, tableId);
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
  if (entries.length === 0) {
    return '<div class="mcp-empty">(empty object)</div>';
  }

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
  tableCounter = 0; // Reset per render call
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
  position: sticky; top: 0; background: var(--bg-primary); z-index: 1;
}
.mcp-sortable { cursor: pointer; }
.mcp-sortable:hover { color: var(--accent); }
.mcp-sort-icon { margin-left: 4px; opacity: 0.3; font-size: 10px; }
.mcp-table td {
  padding: var(--sp-2) var(--sp-3); border-bottom: 1px solid var(--border);
  vertical-align: top; max-width: 400px;
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
.mcp-bool-true { color: var(--success); }
.mcp-bool-false { color: var(--danger); }
.mcp-num { font-variant-numeric: tabular-nums; }
.mcp-text { white-space: pre-wrap; line-height: 1.6; }
.mcp-empty { color: var(--text-tertiary); font-style: italic; padding: var(--sp-2) 0; }
.mcp-truncated { color: var(--text-tertiary); font-style: italic; }

/* Links & images */
.mcp-link { color: var(--accent); text-decoration: none; word-break: break-all; }
.mcp-link:hover { text-decoration: underline; }
.mcp-img { max-width: 200px; max-height: 150px; border-radius: var(--radius-sm); border: 1px solid var(--border); }

/* Nested table styling */
.mcp-details .mcp-table-wrap { margin: 0; }
.mcp-details .mcp-table th { position: static; }
`;
}

/** Get the JS for table sorting (supports multiple tables) */
export function getRendererJS(): string {
  return `
function __mcpSort(tableId, colIdx) {
  var table = document.getElementById(tableId);
  if (!table) return;
  var tbody = table.tBodies[0];
  var rows = Array.from(tbody.rows);
  var key = tableId + '_' + colIdx;
  var dir = table.dataset.sortKey === key && table.dataset.sortDir === 'asc' ? 'desc' : 'asc';
  table.dataset.sortDir = dir;
  table.dataset.sortKey = key;

  rows.sort(function(a, b) {
    var ac = a.cells[colIdx], bc = b.cells[colIdx];
    if (!ac || !bc) return 0;
    var av = ac.textContent.trim();
    var bv = bc.textContent.trim();
    var an = parseFloat(av.replace(/[^\\d.-]/g, ''));
    var bn = parseFloat(bv.replace(/[^\\d.-]/g, ''));
    if (!isNaN(an) && !isNaN(bn)) return dir === 'asc' ? an - bn : bn - an;
    return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  rows.forEach(function(row) { tbody.appendChild(row); });
}`;
}
