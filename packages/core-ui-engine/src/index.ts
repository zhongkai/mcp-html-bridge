// ── Public API ──
export {
  render,
  renderFromSchema,
  renderFromData,
  renderers,
  availableRenderers,
} from './engine.js';

// Heuristic sniffer (fallback when no LLM is available)
export { sniff, sniffSchema } from './data-sniffer.js';

// Building blocks (for custom composition)
export { generateThemeCSS } from './theme.js';
export { generateBridgeJS } from './bridge.js';
export { escapeHtml, tag, style, script, document } from './html-builder.js';

// Individual renderers (for direct LLM-driven usage)
export { renderDataGrid, getDataGridCSS, getDataGridJS } from './renderers/data-grid.js';
export { renderMetricsCard, getMetricsCardCSS } from './renderers/metrics-card.js';
export { renderJsonTree, getJsonTreeCSS, getJsonTreeJS } from './renderers/json-tree.js';
export { renderReadingBlock, getReadingBlockCSS } from './renderers/reading-block.js';
export { renderComposite, getCompositeCSS } from './renderers/composite.js';
export { renderForm, getFormCSS } from './renderers/form.js';

// Re-export types
export type {
  RenderIntent,
  SniffResult,
  RenderOptions,
  EngineInput,
  SchemaInput,
  DataInput,
  JSONSchema,
  Renderer,
  MCPToolDefinition,
  MCPServerInfo,
} from './types.js';
