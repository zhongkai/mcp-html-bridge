/**
 * Configuration management for MCP-HTML-Bridge.
 *
 * Config file: ~/.mcp-html-bridge/config.json
 * Env vars:    MCP_HTML_LLM_API_URL, MCP_HTML_LLM_API_KEY, MCP_HTML_LLM_MODEL
 * CLI flags:   --api-url, --api-key, --model (highest priority)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const CONFIG_DIR = join(homedir(), '.mcp-html-bridge');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export interface BridgeConfig {
  llm?: {
    apiUrl: string;
    apiKey?: string;
    model: string;
  };
}

/** Read config from ~/.mcp-html-bridge/config.json */
export function loadConfig(): BridgeConfig {
  try {
    if (existsSync(CONFIG_FILE)) {
      const raw = readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(raw) as BridgeConfig;
    }
  } catch {
    // Corrupt config, ignore
  }
  return {};
}

/** Write config to ~/.mcp-html-bridge/config.json */
export function saveConfig(config: BridgeConfig): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

/** Get config file path */
export function getConfigPath(): string {
  return CONFIG_FILE;
}

/**
 * Resolve LLM config from all sources.
 * Priority: CLI flags > env vars > config file
 */
export function resolveLLMConfig(cliFlags: {
  apiUrl?: string;
  apiKey?: string;
  model?: string;
}): { apiUrl: string; apiKey?: string; model: string } | undefined {
  const file = loadConfig();

  const apiUrl = cliFlags.apiUrl
    ?? process.env['MCP_HTML_LLM_API_URL']
    ?? file.llm?.apiUrl;

  const model = cliFlags.model
    ?? process.env['MCP_HTML_LLM_MODEL']
    ?? file.llm?.model;

  if (!apiUrl || !model) return undefined;

  const apiKey = cliFlags.apiKey
    ?? process.env['MCP_HTML_LLM_API_KEY']
    ?? file.llm?.apiKey;

  return { apiUrl, apiKey, model };
}
