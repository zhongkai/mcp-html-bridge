// ── MCP Proxy Server: intercepts tool results and enhances with HTML ──
import { spawn, type ChildProcess } from 'node:child_process';
import { renderFromData } from '@mcp-html-bridge/ui-engine';

/**
 * MCP Proxy that sits between a client and a target MCP server.
 * It forwards all traffic transparently, but enhances tool call results
 * with rendered HTML blocks.
 */
export class MCPProxyServer {
  private targetProcess: ChildProcess | null = null;
  private clientBuffer = '';
  private serverBuffer = '';

  constructor(
    private targetCommand: string,
    private targetArgs: string[] = []
  ) {}

  /**
   * Start the proxy. Reads from stdin, writes to stdout.
   * Spawns the target MCP server as a subprocess.
   */
  start(): void {
    // Spawn target MCP server
    const [cmd, ...defaultArgs] = this.targetCommand.split(/\s+/);
    this.targetProcess = spawn(cmd, [...defaultArgs, ...this.targetArgs], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Forward stderr from target
    this.targetProcess.stderr?.on('data', (chunk: Buffer) => {
      process.stderr.write(chunk);
    });

    // Client → Target (forward requests transparently)
    process.stdin.on('data', (chunk: Buffer) => {
      this.targetProcess?.stdin?.write(chunk);
    });

    // Target → Client (intercept and enhance responses)
    this.targetProcess.stdout?.on('data', (chunk: Buffer) => {
      this.serverBuffer += chunk.toString();
      this.processServerBuffer();
    });

    this.targetProcess.on('exit', (code) => {
      process.stderr.write(`[proxy] Target server exited with code ${code}\n`);
      process.exit(code ?? 1);
    });

    process.stdin.on('end', () => {
      this.targetProcess?.stdin?.end();
    });

    process.stderr.write('[proxy] MCP Proxy started\n');
  }

  private processServerBuffer(): void {
    while (true) {
      const headerEnd = this.serverBuffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) break;

      const header = this.serverBuffer.slice(0, headerEnd);
      const match = header.match(/Content-Length:\s*(\d+)/i);
      if (!match) {
        // Forward non-JSON-RPC content as-is
        const chunk = this.serverBuffer.slice(0, headerEnd + 4);
        process.stdout.write(chunk);
        this.serverBuffer = this.serverBuffer.slice(headerEnd + 4);
        continue;
      }

      const contentLength = parseInt(match[1], 10);
      const bodyStart = headerEnd + 4;
      if (this.serverBuffer.length < bodyStart + contentLength) break;

      const body = this.serverBuffer.slice(bodyStart, bodyStart + contentLength);
      this.serverBuffer = this.serverBuffer.slice(bodyStart + contentLength);

      const enhanced = this.enhanceResponse(body);
      const newHeader = `Content-Length: ${Buffer.byteLength(enhanced)}\r\n\r\n`;
      process.stdout.write(newHeader + enhanced);
    }
  }

  private enhanceResponse(body: string): string {
    try {
      const msg = JSON.parse(body) as {
        id?: number;
        result?: { content?: Array<{ type: string; text?: string }> };
        method?: string;
      };

      // Only enhance tool call results
      if (msg.id === undefined || !msg.result?.content) return body;

      // Check if this looks like a tools/call response
      const textContent = msg.result.content.find(
        (c) => c.type === 'text' && c.text
      );
      if (!textContent?.text) return body;

      // Try to parse the text content as JSON for rendering
      let data: unknown;
      try {
        data = JSON.parse(textContent.text);
      } catch {
        // Not JSON — try rendering as reading block
        data = textContent.text;
      }

      // Generate HTML
      const html = renderFromData(data, { title: 'MCP Result' });

      // Append HTML block to the response content
      msg.result.content.push({
        type: 'text',
        text: `\n\`\`\`mcp-html\n${html}\n\`\`\``,
      });

      return JSON.stringify(msg);
    } catch {
      return body;
    }
  }
}
