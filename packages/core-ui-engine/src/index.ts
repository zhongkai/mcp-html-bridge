// ── Public API ──
export { render, renderFromSchema, renderFromData } from './engine.js';
export { sniff, sniffSchema } from './data-sniffer.js';
export { generateThemeCSS } from './theme.js';
export { generateBridgeJS } from './bridge.js';
export { escapeHtml, tag, style, script, document } from './html-builder.js';

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
