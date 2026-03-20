// ── Engine Orchestrator: JSON → self-contained HTML document ──
import type { EngineInput, RenderOptions, JSONSchema } from './types.js';
import { document as htmlDocument } from './html-builder.js';
import { generateThemeCSS } from './theme.js';
import { generateBridgeJS } from './bridge.js';
import { renderJSON, getRendererCSS, getRendererJS } from './renderer.js';
import { renderForm, getFormCSS } from './renderers/form.js';
import { generatePlaygroundHTML, getPlaygroundCSS, getPlaygroundJS } from './playground.js';

/** Options for rendering */
interface DataRenderOptions extends RenderOptions {
  toolName?: string;
  toolDescription?: string;
}

/** Render any JSON data as a full HTML document. Pure structural rendering. */
export function renderFromData(
  data: unknown,
  options: DataRenderOptions = {}
): string {
  const body = renderJSON(data);
  const cssParts = [generateThemeCSS(), getRendererCSS()];
  const jsParts = [generateBridgeJS(), getRendererJS()];

  if (options.debug) {
    cssParts.push(getPlaygroundCSS());
    jsParts.push(getPlaygroundJS());
  }

  const playgroundHTML = options.debug ? generatePlaygroundHTML() : '';

  return htmlDocument({
    title: options.title ?? options.toolName ?? 'MCP Result',
    css: cssParts.join('\n'),
    body: body + playgroundHTML,
    js: jsParts.join('\n'),
  });
}

/** Render a form from a JSON Schema (for tool input) */
export function renderFromSchema(
  schema: JSONSchema,
  options: DataRenderOptions = {}
): string {
  const body = renderForm(schema, {
    toolName: options.toolName,
    toolDescription: options.toolDescription,
  });

  const playground = options.debug ? generatePlaygroundHTML() : '';

  const css = [
    generateThemeCSS(),
    getFormCSS(),
    options.debug ? getPlaygroundCSS() : '',
  ].join('\n');

  const js = [
    generateBridgeJS(),
    options.debug ? getPlaygroundJS() : '',
  ].join('\n');

  return htmlDocument({
    title: options.title ?? options.toolName ?? 'MCP Tool',
    css,
    body: body + playground,
    js,
  });
}

/** Unified API */
export function render(input: EngineInput, options: DataRenderOptions = {}): string {
  if (input.mode === 'schema') {
    return renderFromSchema(input.schema, {
      ...options,
      toolName: input.toolName,
      toolDescription: input.toolDescription,
    });
  }
  return renderFromData(input.data, {
    ...options,
    toolName: input.toolName,
    toolDescription: input.toolDescription,
  });
}
