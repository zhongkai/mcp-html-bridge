// ── Engine Orchestrator: main entry point ──
import type { EngineInput, RenderIntent, RenderOptions, JSONSchema } from './types.js';
import { document as htmlDocument } from './html-builder.js';
import { generateThemeCSS } from './theme.js';
import { generateBridgeJS } from './bridge.js';
import { sniff, sniffSchema } from './data-sniffer.js';
import { renderForm, getFormCSS } from './renderers/form.js';
import { renderDataGrid, getDataGridCSS, getDataGridJS } from './renderers/data-grid.js';
import { renderJsonTree, getJsonTreeCSS, getJsonTreeJS } from './renderers/json-tree.js';
import { renderReadingBlock, getReadingBlockCSS } from './renderers/reading-block.js';
import { renderMetricsCard, getMetricsCardCSS } from './renderers/metrics-card.js';
import { renderComposite, getCompositeCSS } from './renderers/composite.js';
import { generatePlaygroundHTML, getPlaygroundCSS, getPlaygroundJS } from './playground.js';

/** Extended options that allow explicit renderer selection */
interface DataRenderOptions extends RenderOptions {
  toolName?: string;
  toolDescription?: string;
  /** Explicitly choose a renderer. Skips auto-detection when set. */
  renderer?: RenderIntent;
}

/** Assemble a full HTML document from a chosen renderer's output */
function assembleDocument(
  intent: RenderIntent,
  data: unknown,
  metadata: Record<string, unknown>,
  options: DataRenderOptions
): string {
  let body: string;
  const cssParts = [generateThemeCSS()];
  const jsParts = [generateBridgeJS()];

  switch (intent) {
    case 'data-grid':
      body = renderDataGrid(data, metadata);
      cssParts.push(getDataGridCSS());
      jsParts.push(getDataGridJS());
      break;
    case 'metrics-card':
      body = renderMetricsCard(data, metadata);
      cssParts.push(getMetricsCardCSS());
      break;
    case 'reading-block':
      body = renderReadingBlock(data, metadata);
      cssParts.push(getReadingBlockCSS());
      break;
    case 'json-tree':
      body = renderJsonTree(data, metadata);
      cssParts.push(getJsonTreeCSS());
      jsParts.push(getJsonTreeJS());
      jsParts.push(`__mcpTreeData = ${JSON.stringify(data)};`);
      break;
    case 'composite':
      body = renderComposite(data, metadata);
      cssParts.push(getDataGridCSS(), getMetricsCardCSS(), getReadingBlockCSS(), getJsonTreeCSS(), getCompositeCSS());
      jsParts.push(getDataGridJS(), getJsonTreeJS());
      break;
    default:
      body = renderJsonTree(data, metadata);
      cssParts.push(getJsonTreeCSS());
      jsParts.push(getJsonTreeJS());
      jsParts.push(`__mcpTreeData = ${JSON.stringify(data)};`);
  }

  if (options.debug) {
    body += generatePlaygroundHTML();
    cssParts.push(getPlaygroundCSS());
    jsParts.push(getPlaygroundJS());
  }

  return htmlDocument({
    title: options.title ?? options.toolName ?? 'MCP Result',
    css: cssParts.join('\n'),
    body,
    js: jsParts.join('\n'),
  });
}

/** Render a form from a JSON Schema (for tool input) */
export function renderFromSchema(
  schema: JSONSchema,
  options: DataRenderOptions = {}
): string {
  const sniffResult = sniffSchema(schema as Record<string, unknown>);

  const body = renderForm(schema, {
    ...sniffResult.metadata,
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

/**
 * Render HTML from tool result data.
 *
 * When `options.renderer` is set, that renderer is used directly —
 * the heuristic sniffer is bypassed entirely. This is the recommended
 * path when an LLM (e.g. Claude in Claude Code) has already decided
 * the best visualization strategy.
 *
 * When `options.renderer` is omitted, falls back to the built-in
 * confidence-scored heuristic sniffer for auto-detection.
 */
export function renderFromData(
  data: unknown,
  options: DataRenderOptions = {}
): string {
  if (options.renderer) {
    // LLM-driven path: explicit renderer, no heuristic
    return assembleDocument(options.renderer, data, {}, options);
  }

  // Fallback: heuristic auto-detection
  const results = sniff(data);
  return assembleDocument(results[0].intent, data, results[0].metadata, options);
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

/**
 * Available renderers — exported for programmatic use.
 * Each renderer takes raw data and returns an HTML fragment (not a full document).
 * Use renderFromData() with `renderer` option for full document output.
 */
export const renderers = {
  'data-grid': renderDataGrid,
  'metrics-card': renderMetricsCard,
  'json-tree': renderJsonTree,
  'reading-block': renderReadingBlock,
  'composite': renderComposite,
  'form': renderForm,
} as const;

/** List of available renderer names */
export const availableRenderers: readonly RenderIntent[] = [
  'data-grid', 'metrics-card', 'json-tree', 'reading-block', 'composite', 'form',
];
