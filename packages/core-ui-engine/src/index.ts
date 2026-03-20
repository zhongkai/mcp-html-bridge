// ── Public API ──
export {
  render,
  renderFromSchema,
  renderFromData,
  renderFromDataSync,
} from './engine.js';

// Universal JSON → HTML renderer (structural fallback)
export { renderJSON, getRendererCSS, getRendererJS } from './renderer.js';

// LLM-powered semantic renderer
export { renderWithLLM, RENDERING_PROMPT } from './llm-renderer.js';
export type { LLMConfig } from './llm-renderer.js';

// Building blocks (for custom composition)
export { generateThemeCSS } from './theme.js';
export { generateUtilityCSS } from './utilities.js';
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
