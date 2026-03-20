#!/usr/bin/env node
// ── Proxy adapter entry point ──
import { MCPProxyServer } from './proxy-server.js';

const targetCommand = process.argv[2];
if (!targetCommand) {
  console.error('Usage: mcp-proxy <target-server-command> [args...]');
  console.error('Example: mcp-proxy "npx -y @modelcontextprotocol/server-filesystem /tmp"');
  process.exit(1);
}

const targetArgs = process.argv.slice(3);
const proxy = new MCPProxyServer(targetCommand, targetArgs);
proxy.start();
