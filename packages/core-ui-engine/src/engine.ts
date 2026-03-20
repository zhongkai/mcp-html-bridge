// ── Engine Orchestrator: main entry point ──
import type { EngineInput, RenderOptions, JSONSchema } from './types.js';
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

/** Render a form from a JSON Schema (for tool input) */
export function renderFromSchema(
  schema: JSONSchema,
  options: RenderOptions & { toolName?: string; toolDescription?: string } = {}
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

/** Render HTML from tool result data */
export function renderFromData(
  data: unknown,
  options: RenderOptions & { toolName?: string; toolDescription?: string } = {}
): string {
  const results = sniff(data);
  const best = results[0];

  let body: string;
  const cssParts = [generateThemeCSS()];
  const jsParts = [generateBridgeJS()];

  switch (best.intent) {
    case 'data-grid':
      body = renderDataGrid(data, best.metadata);
      cssParts.push(getDataGridCSS());
      jsParts.push(getDataGridJS());
      break;
    case 'metrics-card':
      body = renderMetricsCard(data, best.metadata);
      cssParts.push(getMetricsCardCSS());
      break;
    case 'reading-block':
      body = renderReadingBlock(data, best.metadata);
      cssParts.push(getReadingBlockCSS());
      break;
    case 'json-tree':
      body = renderJsonTree(data, best.metadata);
      cssParts.push(getJsonTreeCSS());
      jsParts.push(getJsonTreeJS());
      // Inject tree data for copy-all
      jsParts.push(`__mcpTreeData = ${JSON.stringify(data)};`);
      break;
    case 'composite':
      body = renderComposite(data, best.metadata);
      // Composite may use all renderers, include all CSS/JS
      cssParts.push(getDataGridCSS(), getMetricsCardCSS(), getReadingBlockCSS(), getJsonTreeCSS(), getCompositeCSS());
      jsParts.push(getDataGridJS(), getJsonTreeJS());
      break;
    default:
      body = renderJsonTree(data, best.metadata);
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

/** Unified API */
export function render(input: EngineInput, options: RenderOptions = {}): string {
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
