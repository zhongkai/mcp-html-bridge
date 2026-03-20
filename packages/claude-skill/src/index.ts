#!/usr/bin/env node
/**
 * @mcp-html-bridge/claude-skill
 *
 * CLI tool for Claude Code integration:
 *   mcp-html-skill install   — install /mcp-render command into Claude Code
 *   mcp-html-skill render    — render JSON schema/data to HTML file
 */
import { Command } from 'commander';
import { install } from './install.js';
import { render } from './render.js';

const program = new Command();

program
  .name('mcp-html-skill')
  .description('Claude Code skill for MCP-HTML-Bridge')
  .version('0.1.0');

program
  .command('install')
  .description('Install /mcp-render command into Claude Code (~/.claude/commands/)')
  .option('--global', 'Install to global ~/.claude/commands/ (default)', true)
  .option('--project', 'Install to current project .claude/commands/')
  .action(install);

program
  .command('render')
  .description('Render MCP tool schema or result data as HTML')
  .option('--schema <file>', 'JSON Schema file (renders input form)')
  .option('--data <file>', 'JSON data file (renders result view)')
  .option('--json <string>', 'Inline JSON string')
  .option('--mode <mode>', 'Force render mode: schema | data (auto-detected if omitted)')
  .option('--title <title>', 'Page title')
  .option('--tool-name <name>', 'Tool name for bridge protocol')
  .option('--tool-desc <desc>', 'Tool description')
  .option('--debug', 'Enable debug playground panel')
  .option('--output <dir>', 'Output directory', '/tmp/mcp-html-bridge')
  .option('--open', 'Open in browser after rendering')
  .option('--stdout', 'Print raw HTML to stdout instead of writing to file')
  .action(render);

program.parse();
