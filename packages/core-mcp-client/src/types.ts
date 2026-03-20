// ── MCP Client types ──
export interface MCPToolParam {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

export interface MCPConnectionOptions {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface MCPServerCapabilities {
  name: string;
  version: string;
  tools: MCPToolParam[];
}
