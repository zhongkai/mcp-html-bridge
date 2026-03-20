#!/usr/bin/env node
// ── CLI Entry: mcp-bridge command ──
import { Command } from 'commander';
import { testMock } from './test-mock.js';
import { compile } from './compile.js';

const program = new Command();

program
  .name('mcp-bridge')
  .description('MCP-HTML-Bridge — render MCP schemas/data as self-contained HTML')
  .version('0.1.0');

program
  .command('compile <server-command>')
  .description('Connect to an MCP server, extract tool schemas, and generate a SKILL.md file')
  .option('-o, --output <path>', 'Output file path', 'SKILL.md')
  .action(async (serverCommand: string, opts: { output: string }) => {
    try {
      console.log('\n  mcp-bridge compile\n');
      await compile(serverCommand, opts.output);
    } catch (err) {
      console.error('Error:', (err as Error).message);
      process.exit(1);
    }
  });

program
  .command('test-mock')
  .description('Generate HTML from built-in mock datasets for browser testing')
  .option('-o, --output <dir>', 'Output directory', './mcp-html-output')
  .option('-d, --debug', 'Enable debug playground panel', false)
  .action((opts: { output: string; debug: boolean }) => {
    console.log('\n  mcp-bridge test-mock\n');
    testMock(opts.output, opts.debug);
  });

program.parse();
