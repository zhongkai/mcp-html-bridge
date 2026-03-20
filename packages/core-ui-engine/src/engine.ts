// ── Engine Orchestrator: JSON → self-contained HTML document ──
import type { EngineInput, RenderOptions, JSONSchema } from './types.js';
import type { LLMConfig } from './llm-renderer.js';
import { document as htmlDocument } from './html-builder.js';
import { generateThemeCSS } from './theme.js';
import { generateBridgeJS } from './bridge.js';
import { renderJSON, getRendererCSS, getRendererJS } from './renderer.js';
import { renderWithLLM } from './llm-renderer.js';
import { renderForm, getFormCSS } from './renderers/form.js';
import { generatePlaygroundHTML, getPlaygroundCSS, getPlaygroundJS } from './playground.js';
import { generateUtilityCSS } from './utilities.js';

/** Options for rendering */
interface DataRenderOptions extends RenderOptions {
  toolName?: string;
  toolDescription?: string;
  /** LLM config for semantic rendering. Omit for structural fallback. */
  llm?: LLMConfig;
}

/** Build the document wrapper around an HTML body fragment */
function buildDocument(body: string, options: DataRenderOptions, extraCSS = '', extraJS = ''): string {
  const cssParts = [generateThemeCSS(), generateUtilityCSS(), extraCSS];
  const jsParts = [generateBridgeJS(), extraJS];

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

/**
 * Render any JSON data as a full HTML document.
 *
 * - If `options.llm` is provided: calls the LLM for semantic rendering (async).
 * - If omitted: uses the structural renderer (sync, returned as resolved Promise).
 */
export async function renderFromData(
  data: unknown,
  options: DataRenderOptions = {}
): Promise<string> {
  if (options.llm) {
    const body = await renderWithLLM(data, options.llm);
    // Always include structural CSS/JS — the LLM fallback path may produce structural HTML
    return buildDocument(body, options, getRendererCSS(), getRendererJS());
  }

  const body = renderJSON(data);
  return buildDocument(body, options, getRendererCSS(), getRendererJS());
}

/**
 * Sync structural rendering (no LLM). Use when you know you don't need LLM.
 */
export function renderFromDataSync(
  data: unknown,
  options: Omit<DataRenderOptions, 'llm'> = {}
): string {
  const body = renderJSON(data);
  return buildDocument(body, options, getRendererCSS(), getRendererJS());
}

/** Render a form from a JSON Schema (for tool input). Always sync. */
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
    generateUtilityCSS(),
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
export async function render(input: EngineInput, options: DataRenderOptions = {}): Promise<string> {
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
