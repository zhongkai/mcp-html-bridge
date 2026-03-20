/**
 * `mcp-html-skill config` subcommand.
 */
import { loadConfig, saveConfig, getConfigPath } from './config.js';
import type { BridgeConfig } from './config.js';

interface ConfigOptions {
  apiUrl?: string;
  apiKey?: string;
  model?: string;
  show?: boolean;
  clear?: boolean;
}

export function config(options: ConfigOptions): void {
  if (options.show) {
    const cfg = loadConfig();
    const path = getConfigPath();
    if (cfg.llm) {
      console.log(`Config: ${path}`);
      console.log(`  API URL: ${cfg.llm.apiUrl}`);
      console.log(`  API Key: ${cfg.llm.apiKey ? cfg.llm.apiKey.slice(0, 8) + '...' : '(not set)'}`);
      console.log(`  Model:   ${cfg.llm.model}`);
    } else {
      console.log(`No LLM configured. Config path: ${path}`);
      console.log('Run: mcp-html-skill config --api-url <url> --model <model>');
    }
    return;
  }

  if (options.clear) {
    saveConfig({});
    console.log('Config cleared.');
    return;
  }

  if (!options.apiUrl && !options.model && !options.apiKey) {
    console.error('Usage:');
    console.error('  mcp-html-skill config --api-url <url> --model <model> [--api-key <key>]');
    console.error('  mcp-html-skill config --show');
    console.error('  mcp-html-skill config --clear');
    console.error('');
    console.error('Examples:');
    console.error('  mcp-html-skill config --api-url http://localhost:11434/v1 --model qwen2');
    console.error('  mcp-html-skill config --api-url https://api.deepseek.com/v1 --api-key sk-xxx --model deepseek-chat');
    process.exit(1);
  }

  const existing = loadConfig();
  const llm = existing.llm ?? { apiUrl: '', model: '' };

  if (options.apiUrl) llm.apiUrl = options.apiUrl;
  if (options.apiKey) llm.apiKey = options.apiKey;
  if (options.model) llm.model = options.model;

  if (!llm.apiUrl || !llm.model) {
    console.error('Both --api-url and --model are required.');
    process.exit(1);
  }

  saveConfig({ ...existing, llm });
  console.log(`Saved to ${getConfigPath()}`);
  console.log(`  API URL: ${llm.apiUrl}`);
  console.log(`  Model:   ${llm.model}`);
  console.log(`  API Key: ${llm.apiKey ? llm.apiKey.slice(0, 8) + '...' : '(not set)'}`);
}
