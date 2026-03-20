// ── Render Options ──
export interface RenderOptions {
  darkMode?: boolean;
  debug?: boolean;
  title?: string;
}

// ── Engine Input (discriminated union) ──
export interface SchemaInput {
  mode: 'schema';
  schema: JSONSchema;
  toolName?: string;
  toolDescription?: string;
}

export interface DataInput {
  mode: 'data';
  data: unknown;
  toolName?: string;
  toolDescription?: string;
}

export type EngineInput = SchemaInput | DataInput;

// ── JSON Schema subset (sufficient for MCP tool schemas) ──
export interface JSONSchema {
  type?: string | string[];
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  enum?: unknown[];
  description?: string;
  default?: unknown;
  title?: string;
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  oneOf?: JSONSchema[];
  anyOf?: JSONSchema[];
  allOf?: JSONSchema[];
  $ref?: string;
  additionalProperties?: boolean | JSONSchema;
}

// ── MCP Tool definition (from protocol) ──
export interface MCPToolDefinition {
  name: string;
  description?: string;
  inputSchema: JSONSchema;
}

// ── MCP Client types ──
export interface MCPServerInfo {
  name: string;
  version: string;
  tools: MCPToolDefinition[];
}
