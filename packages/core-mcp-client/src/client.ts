// ── MCP Protocol Client: spawn subprocess & extract schemas ──
import { spawn, type ChildProcess } from 'node:child_process';
import type { MCPConnectionOptions, MCPServerCapabilities, MCPToolParam } from './types.js';

/**
 * Lightweight MCP client that connects via stdio transport.
 * Implements the minimum protocol handshake to list tools.
 */
export class MCPClient {
  private process: ChildProcess | null = null;
  private buffer = '';
  private requestId = 0;
  private pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

  async connect(options: MCPConnectionOptions): Promise<void> {
    const [cmd, ...defaultArgs] = options.command.split(/\s+/);
    const args = [...defaultArgs, ...(options.args ?? [])];

    this.process = spawn(cmd, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...options.env },
    });

    this.process.stdout?.on('data', (chunk: Buffer) => {
      this.buffer += chunk.toString();
      this.processBuffer();
    });

    this.process.stderr?.on('data', (chunk: Buffer) => {
      // Log MCP server stderr for debugging
      process.stderr.write(`[mcp-server] ${chunk.toString()}`);
    });

    // Initialize handshake
    await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'mcp-html-bridge', version: '0.1.0' },
    });

    // Send initialized notification
    this.sendNotification('notifications/initialized', {});
  }

  async listTools(): Promise<MCPToolParam[]> {
    const result = await this.sendRequest('tools/list', {}) as { tools: MCPToolParam[] };
    return result.tools ?? [];
  }

  async getServerInfo(): Promise<MCPServerCapabilities> {
    const tools = await this.listTools();
    return {
      name: 'mcp-server',
      version: '0.0.0',
      tools,
    };
  }

  async disconnect(): Promise<void> {
    if (this.process) {
      this.process.stdin?.end();
      this.process.kill();
      this.process = null;
    }
  }

  private sendRequest(method: string, params: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      this.pending.set(id, { resolve, reject });

      const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params });
      this.process?.stdin?.write(`Content-Length: ${Buffer.byteLength(msg)}\r\n\r\n${msg}`);

      // Timeout after 30s
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`Request ${method} timed out`));
        }
      }, 30000);
    });
  }

  private sendNotification(method: string, params: Record<string, unknown>): void {
    const msg = JSON.stringify({ jsonrpc: '2.0', method, params });
    this.process?.stdin?.write(`Content-Length: ${Buffer.byteLength(msg)}\r\n\r\n${msg}`);
  }

  private processBuffer(): void {
    while (true) {
      const headerEnd = this.buffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) break;

      const header = this.buffer.slice(0, headerEnd);
      const match = header.match(/Content-Length:\s*(\d+)/i);
      if (!match) {
        this.buffer = this.buffer.slice(headerEnd + 4);
        continue;
      }

      const contentLength = parseInt(match[1], 10);
      const bodyStart = headerEnd + 4;
      if (this.buffer.length < bodyStart + contentLength) break;

      const body = this.buffer.slice(bodyStart, bodyStart + contentLength);
      this.buffer = this.buffer.slice(bodyStart + contentLength);

      try {
        const msg = JSON.parse(body) as { id?: number; result?: unknown; error?: { message: string } };
        if (msg.id !== undefined && this.pending.has(msg.id)) {
          const handler = this.pending.get(msg.id)!;
          this.pending.delete(msg.id);
          if (msg.error) {
            handler.reject(new Error(msg.error.message));
          } else {
            handler.resolve(msg.result);
          }
        }
      } catch {
        // Ignore malformed messages
      }
    }
  }
}
