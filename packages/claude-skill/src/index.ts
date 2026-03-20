#!/usr/bin/env node
/**
 * @mcp-html-bridge/claude-skill
 *
 * CLI for MCP-HTML-Bridge:
 *   mcp-html-skill config     — configure LLM provider
 *   mcp-html-skill render     — render JSON to HTML
 *   mcp-html-skill install    — install /mcp-render into Claude Code
 */
import { Command } from 'commander';
import { install } from './install.js';
import { render } from './render.js';
import { config } from './config-cmd.js';

const program = new Command();

program
  .name('mcp-html-skill')
  .description('MCP-HTML-Bridge — render any JSON as self-contained HTML')
  .version('0.5.0');

program
  .command('config')
  .description('Configure LLM provider (saved to ~/.mcp-html-bridge/config.json)')
  .option('--api-url <url>', 'LLM API base URL')
  .option('--api-key <key>', 'LLM API key')
  .option('--model <model>', 'LLM model name')
  .option('--show', 'Show current config')
  .option('--clear', 'Clear saved config')
  .action(config);

program
  .command('render')
  .description('Render MCP tool schema or result data as HTML')
  .option('--schema <file>', 'JSON Schema file (renders input form)')
  .option('--data <file>', 'JSON data file (renders result view)')
  .option('--json <string>', 'Inline JSON string')
  .option('--mode <mode>', 'Force render mode: schema | data')
  .option('--title <title>', 'Page title')
  .option('--tool-name <name>', 'Tool name')
  .option('--tool-desc <desc>', 'Tool description')
  .option('--debug', 'Enable debug playground panel')
  .option('--output <dir>', 'Output directory', '/tmp/mcp-html-bridge')
  .option('--open', 'Open in browser after rendering')
  .option('--stdout', 'Print raw HTML to stdout')
  .option('--api-url <url>', 'LLM API URL (overrides config)')
  .option('--api-key <key>', 'LLM API key (overrides config)')
  .option('--model <model>', 'LLM model (overrides config)')
  .option('--no-llm', 'Force structural rendering, skip LLM')
  .action(render);

program
  .command('install')
  .description('Install /mcp-render command into Claude Code')
  .option('--global', 'Install to global ~/.claude/commands/ (default)', true)
  .option('--project', 'Install to current project .claude/commands/')
  .action(install);

program.parse();
