/**
 * Install the /mcp-render command into Claude Code.
 */
import { existsSync, mkdirSync, copyFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface InstallOptions {
  global?: boolean;
  project?: boolean;
}

export function install(options: InstallOptions): void {
  const targetDir = options.project
    ? join(process.cwd(), '.claude', 'commands')
    : join(homedir(), '.claude', 'commands');

  mkdirSync(targetDir, { recursive: true });

  // The commands/ dir is at package root, one level up from dist/
  const commandSrc = join(__dirname, '..', 'commands', 'mcp-render.md');

  // Fallback: if running from src/ during development, try two levels up
  const altSrc = join(__dirname, '..', '..', 'commands', 'mcp-render.md');
  const srcFile = existsSync(commandSrc) ? commandSrc : altSrc;

  if (!existsSync(srcFile)) {
    console.error('  Error: command file not found at', commandSrc);
    console.error('  Make sure the package is installed correctly.');
    process.exit(1);
  }

  const dest = join(targetDir, 'mcp-render.md');
  copyFileSync(srcFile, dest);

  const scope = options.project ? 'project' : 'global';
  console.log(`\n  MCP-HTML-Bridge skill installed!\n`);
  console.log(`  Command file: ${dest}`);
  console.log(`  Scope: ${scope}\n`);
  console.log(`  Usage in Claude Code:`);
  console.log(`    /mcp-render              — interactive mode`);
  console.log(`    /mcp-render schema.json  — render a schema file`);
  console.log(`    /mcp-render data.json    — render a data file\n`);
}
