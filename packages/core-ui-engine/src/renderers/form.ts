// ── Form Renderer: JSON Schema → interactive form ──
import type { JSONSchema } from '../types.js';
import { escapeHtml } from '../html-builder.js';

function renderField(name: string, schema: JSONSchema, required: boolean): string {
  const label = schema.title ?? name;
  const desc = schema.description ? `<div class="field-desc">${escapeHtml(schema.description)}</div>` : '';
  const requiredAttr = required ? 'required' : '';
  const requiredMark = required ? '<span class="required">*</span>' : '';

  // Enum → capsule select
  if (schema.enum && schema.enum.length > 0) {
    const capsules = schema.enum
      .map((v) => {
        const val = escapeHtml(String(v));
        return `<label class="capsule"><input type="radio" name="${escapeHtml(name)}" value="${val}"><span>${val}</span></label>`;
      })
      .join('\n');
    return `<div class="field animate-in">
  <label class="field-label">${escapeHtml(label)}${requiredMark}</label>
  ${desc}
  <div class="capsule-group">${capsules}</div>
</div>`;
  }

  // Boolean → toggle
  if (schema.type === 'boolean') {
    const checked = schema.default === true ? 'checked' : '';
    return `<div class="field animate-in">
  <label class="toggle-label">
    <input type="checkbox" name="${escapeHtml(name)}" ${checked}>
    <span class="toggle-switch"></span>
    <span>${escapeHtml(label)}${requiredMark}</span>
  </label>
  ${desc}
</div>`;
  }

  // Nested object → collapsible section
  if (schema.type === 'object' && schema.properties) {
    const inner = renderProperties(schema.properties, schema.required ?? []);
    return `<details class="nested-section animate-in" open>
  <summary class="section-title">${escapeHtml(label)}${requiredMark}</summary>
  ${desc}
  <div class="nested-fields">${inner}</div>
</details>`;
  }

  // Array → textarea hint
  if (schema.type === 'array') {
    return `<div class="field animate-in">
  <label class="field-label" for="f-${escapeHtml(name)}">${escapeHtml(label)}${requiredMark}</label>
  ${desc}
  <textarea id="f-${escapeHtml(name)}" name="${escapeHtml(name)}" class="input textarea" placeholder="JSON array..." ${requiredAttr}>${escapeHtml(String(schema.default ?? ''))}</textarea>
</div>`;
  }

  // Number/integer
  if (schema.type === 'number' || schema.type === 'integer') {
    const min = schema.minimum !== undefined ? `min="${schema.minimum}"` : '';
    const max = schema.maximum !== undefined ? `max="${schema.maximum}"` : '';
    const step = schema.type === 'integer' ? 'step="1"' : '';
    const def = schema.default !== undefined ? `value="${escapeHtml(String(schema.default))}"` : '';
    return `<div class="field animate-in">
  <label class="field-label" for="f-${escapeHtml(name)}">${escapeHtml(label)}${requiredMark}</label>
  ${desc}
  <input type="number" id="f-${escapeHtml(name)}" name="${escapeHtml(name)}" class="input" ${min} ${max} ${step} ${def} ${requiredAttr}>
</div>`;
  }

  // String (default)
  const inputType = schema.format === 'email' ? 'email'
    : schema.format === 'uri' ? 'url'
    : schema.format === 'date' ? 'date'
    : schema.format === 'date-time' ? 'datetime-local'
    : schema.format === 'password' ? 'password'
    : 'text';

  const isLong = (schema.maxLength && schema.maxLength > 200) || schema.format === 'textarea';
  const def = schema.default !== undefined ? escapeHtml(String(schema.default)) : '';

  if (isLong) {
    return `<div class="field animate-in">
  <label class="field-label" for="f-${escapeHtml(name)}">${escapeHtml(label)}${requiredMark}</label>
  ${desc}
  <textarea id="f-${escapeHtml(name)}" name="${escapeHtml(name)}" class="input textarea" ${requiredAttr}>${def}</textarea>
</div>`;
  }

  return `<div class="field animate-in">
  <label class="field-label" for="f-${escapeHtml(name)}">${escapeHtml(label)}${requiredMark}</label>
  ${desc}
  <input type="${inputType}" id="f-${escapeHtml(name)}" name="${escapeHtml(name)}" class="input" value="${def}" ${requiredAttr}>
</div>`;
}

function renderProperties(
  properties: Record<string, JSONSchema>,
  required: string[]
): string {
  const reqSet = new Set(required);
  return Object.entries(properties)
    .map(([name, schema]) => renderField(name, schema, reqSet.has(name)))
    .join('\n');
}

export function renderForm(
  schema: JSONSchema,
  metadata: Record<string, unknown>
): string {
  const toolName = metadata['toolName'] as string | undefined;
  const toolDesc = metadata['toolDescription'] as string | undefined;

  const header = toolName
    ? `<div class="form-header"><h2>${escapeHtml(toolName)}</h2>${toolDesc ? `<p class="form-desc">${escapeHtml(toolDesc)}</p>` : ''}</div>`
    : '';

  const fields = schema.properties
    ? renderProperties(schema.properties, schema.required ?? [])
    : '<p class="text-secondary">No input parameters required.</p>';

  return `${header}
<form id="mcp-form" class="mcp-form card" onsubmit="return __mcpSubmit(event)">
${fields}
<div class="form-actions">
  <button type="submit" class="btn btn-primary">Execute Tool</button>
  <button type="reset" class="btn btn-ghost">Reset</button>
</div>
</form>`;
}

export function getFormCSS(): string {
  return `
.mcp-form { display: flex; flex-direction: column; gap: var(--sp-5); max-width: 640px; }
.form-header h2 { font-size: var(--text-2xl); font-weight: 700; }
.form-desc { color: var(--text-secondary); margin-top: var(--sp-1); }

.field { display: flex; flex-direction: column; gap: var(--sp-1); }
.field-label { font-weight: 600; font-size: var(--text-sm); color: var(--text-primary); }
.field-desc { font-size: var(--text-xs); color: var(--text-tertiary); }
.required { color: var(--danger); margin-left: 2px; }

.input {
  padding: var(--sp-2) var(--sp-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-family: var(--font-sans);
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: border-color var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
}
.input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-subtle); }
.textarea { min-height: 80px; resize: vertical; }

.capsule-group { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
.capsule input { display: none; }
.capsule span {
  display: inline-block;
  padding: var(--sp-1) var(--sp-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}
.capsule input:checked + span { background: var(--accent); color: var(--accent-text); border-color: var(--accent); }
.capsule span:hover { border-color: var(--accent); }

.toggle-label { display: flex; align-items: center; gap: var(--sp-2); cursor: pointer; font-weight: 600; font-size: var(--text-sm); }
.toggle-label input { display: none; }
.toggle-switch {
  width: 36px; height: 20px; background: var(--border-strong); border-radius: 10px;
  position: relative; transition: background var(--duration-fast) var(--ease-out);
}
.toggle-switch::after {
  content: ''; position: absolute; top: 2px; left: 2px;
  width: 16px; height: 16px; background: white; border-radius: 50%;
  transition: transform var(--duration-fast) var(--ease-out);
}
.toggle-label input:checked + .toggle-switch { background: var(--accent); }
.toggle-label input:checked + .toggle-switch::after { transform: translateX(16px); }

.nested-section { border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--sp-4); }
.nested-section summary { cursor: pointer; user-select: none; }
.nested-fields { margin-top: var(--sp-4); display: flex; flex-direction: column; gap: var(--sp-4); }

.form-actions { display: flex; gap: var(--sp-3); margin-top: var(--sp-2); }
.btn {
  padding: var(--sp-2) var(--sp-5); border-radius: var(--radius-sm);
  font-weight: 600; font-size: var(--text-sm); cursor: pointer; border: none;
  transition: all var(--duration-fast) var(--ease-out);
}
.btn-primary { background: var(--accent); color: var(--accent-text); }
.btn-primary:hover { background: var(--accent-hover); }
.btn-ghost { background: transparent; color: var(--text-secondary); border: 1px solid var(--border); }
.btn-ghost:hover { background: var(--bg-tertiary); }
`;
}
