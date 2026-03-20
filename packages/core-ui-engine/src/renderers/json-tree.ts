// ── JSON Tree Renderer: recursive collapsible tree ──
import { escapeHtml } from '../html-builder.js';

function typeClass(val: unknown): string {
  if (val === null) return 'jt-null';
  if (typeof val === 'string') return 'jt-string';
  if (typeof val === 'number') return 'jt-number';
  if (typeof val === 'boolean') return 'jt-boolean';
  return '';
}

function formatValue(val: unknown): string {
  if (val === null) return '<span class="jt-null">null</span>';
  if (typeof val === 'string') return `<span class="jt-string">"${escapeHtml(val)}"</span>`;
  if (typeof val === 'number') return `<span class="jt-number">${val}</span>`;
  if (typeof val === 'boolean') return `<span class="jt-boolean">${val}</span>`;
  return escapeHtml(String(val));
}

function renderNode(key: string | null, val: unknown, depth: number): string {
  const keyHtml = key !== null ? `<span class="jt-key">${escapeHtml(key)}</span><span class="jt-colon">: </span>` : '';
  const indent = depth * 16;
  const nodeId = `jt-${Math.random().toString(36).slice(2, 8)}`;

  if (val === null || typeof val !== 'object') {
    return `<div class="jt-line" style="padding-left:${indent}px">
  ${keyHtml}${formatValue(val)}
  <button class="jt-copy" onclick="__mcpCopy(this)" data-val="${escapeHtml(JSON.stringify(val))}" title="Copy">⎘</button>
</div>`;
  }

  const isArray = Array.isArray(val);
  const entries = isArray
    ? (val as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(val as Record<string, unknown>);

  const bracket = isArray ? ['[', ']'] : ['{', '}'];
  const count = entries.length;
  const preview = count === 0 ? (isArray ? '[]' : '{}') : '';

  if (count === 0) {
    return `<div class="jt-line" style="padding-left:${indent}px">${keyHtml}<span class="jt-bracket">${preview}</span></div>`;
  }

  const children = entries.map(([k, v]) => renderNode(isArray ? null : k, v, depth + 1)).join('\n');

  return `<div class="jt-node" style="padding-left:${indent}px">
  <div class="jt-toggle" onclick="__mcpToggle('${nodeId}')">
    <span class="jt-arrow" id="${nodeId}-arrow">▼</span>
    ${keyHtml}<span class="jt-bracket">${bracket[0]}</span>
    <span class="jt-count">${count} ${isArray ? 'items' : 'keys'}</span>
    <button class="jt-copy" onclick="event.stopPropagation();__mcpCopy(this)" data-val="${escapeHtml(JSON.stringify(val))}" title="Copy">⎘</button>
  </div>
  <div class="jt-children" id="${nodeId}">${children}</div>
  <div style="padding-left:0"><span class="jt-bracket">${bracket[1]}</span></div>
</div>`;
}

export function renderJsonTree(
  data: unknown,
  _metadata: Record<string, unknown>
): string {
  return `<div class="json-tree card">
  <div class="jt-toolbar">
    <button class="btn btn-ghost btn-sm" onclick="__mcpExpandAll()">Expand All</button>
    <button class="btn btn-ghost btn-sm" onclick="__mcpCollapseAll()">Collapse All</button>
    <button class="btn btn-ghost btn-sm" onclick="__mcpCopyAll()">Copy JSON</button>
  </div>
  <div class="jt-root">${renderNode(null, data, 0)}</div>
</div>`;
}

export function getJsonTreeCSS(): string {
  return `
.json-tree { font-family: var(--font-mono); font-size: var(--text-sm); overflow-x: auto; }
.jt-toolbar { display: flex; gap: var(--sp-2); margin-bottom: var(--sp-3); padding-bottom: var(--sp-3); border-bottom: 1px solid var(--border); }
.btn-sm { padding: var(--sp-1) var(--sp-2); font-size: var(--text-xs); }

.jt-line, .jt-node > .jt-toggle { padding: 2px 0; display: flex; align-items: center; gap: 4px; }
.jt-toggle { cursor: pointer; user-select: none; }
.jt-toggle:hover { background: var(--accent-subtle); border-radius: var(--radius-sm); }
.jt-arrow { font-size: 10px; width: 14px; text-align: center; transition: transform var(--duration-fast) var(--ease-out); display: inline-block; }
.jt-arrow.collapsed { transform: rotate(-90deg); }

.jt-key { color: var(--accent); font-weight: 600; }
.jt-colon { color: var(--text-tertiary); }
.jt-string { color: #22863a; }
.jt-number { color: #005cc5; }
.jt-boolean { color: #d73a49; }
.jt-null { color: var(--text-tertiary); font-style: italic; }
.jt-bracket { color: var(--text-tertiary); font-weight: 700; }
.jt-count { color: var(--text-tertiary); font-size: var(--text-xs); margin-left: var(--sp-1); }

@media (prefers-color-scheme: dark) {
  .jt-string { color: #7ee787; }
  .jt-number { color: #79c0ff; }
  .jt-boolean { color: #ff7b72; }
}

.jt-children { overflow: hidden; }
.jt-children.hidden { display: none; }
.jt-copy {
  opacity: 0; border: none; background: none; cursor: pointer;
  color: var(--text-tertiary); font-size: 14px; padding: 0 4px;
  transition: opacity var(--duration-fast) var(--ease-out);
}
.jt-line:hover .jt-copy, .jt-toggle:hover .jt-copy { opacity: 1; }
.jt-copy:hover { color: var(--accent); }
`;
}

export function getJsonTreeJS(): string {
  return `
var __mcpTreeData;
function __mcpToggle(id) {
  var el = document.getElementById(id);
  var arrow = document.getElementById(id + '-arrow');
  if (!el) return;
  el.classList.toggle('hidden');
  if (arrow) arrow.classList.toggle('collapsed');
}
function __mcpExpandAll() {
  document.querySelectorAll('.jt-children').forEach(function(el) { el.classList.remove('hidden'); });
  document.querySelectorAll('.jt-arrow').forEach(function(el) { el.classList.remove('collapsed'); });
}
function __mcpCollapseAll() {
  document.querySelectorAll('.jt-children').forEach(function(el) { el.classList.add('hidden'); });
  document.querySelectorAll('.jt-arrow').forEach(function(el) { el.classList.add('collapsed'); });
}
function __mcpCopy(btn) {
  var val = btn.getAttribute('data-val');
  navigator.clipboard.writeText(val).then(function() {
    var orig = btn.textContent;
    btn.textContent = '✓';
    setTimeout(function() { btn.textContent = orig; }, 1000);
  });
}
function __mcpCopyAll() {
  if (__mcpTreeData) navigator.clipboard.writeText(JSON.stringify(__mcpTreeData, null, 2));
}`;
}
