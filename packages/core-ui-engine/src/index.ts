// ── Public API ──
export {
  render,
  renderFromSchema,
  renderFromData,
} from './engine.js';

// Universal JSON → HTML renderer (the core)
export { renderJSON, getRendererCSS, getRendererJS } from './renderer.js';

// Building blocks (for custom composition)
export { generateThemeCSS } from './theme.js';
export { generateBridgeJS } from './bridge.js';
export { escapeHtml, tag, style, script, document } from './html-builder.js';

// Form renderer (JSON Schema → form UI)
export { renderForm, getFormCSS } from './renderers/form.js';

// Re-export types
export type {
  RenderOptions,
  EngineInput,
  SchemaInput,
  DataInput,
  JSONSchema,
  MCPToolDefinition,
  MCPServerInfo,
} from './types.js';
