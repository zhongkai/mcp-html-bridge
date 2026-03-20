/**
 * Render MCP tool schema or data as a self-contained HTML page.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { renderFromSchema, renderFromData } from '@mcp-html-bridge/ui-engine';
import type { RenderIntent } from '@mcp-html-bridge/ui-engine';

const VALID_RENDERERS = ['data-grid', 'metrics-card', 'json-tree', 'reading-block', 'composite', 'auto'];

interface RenderOptions {
  schema?: string;
  data?: string;
  json?: string;
  mode?: 'schema' | 'data';
  renderer?: string;
  title?: string;
  toolName?: string;
  toolDesc?: string;
  debug?: boolean;
  output?: string;
  open?: boolean;
  stdout?: boolean;
}

function loadJSON(options: RenderOptions): { json: unknown; detectedMode: 'schema' | 'data' } {
  let raw: string;

  if (options.schema) {
    raw = readFileSync(options.schema, 'utf-8');
    return { json: JSON.parse(raw), detectedMode: 'schema' };
  }

  if (options.data) {
    raw = readFileSync(options.data, 'utf-8');
    return { json: JSON.parse(raw), detectedMode: 'data' };
  }

  if (options.json) {
    const parsed = JSON.parse(options.json);
    const isSchema = parsed && typeof parsed === 'object' &&
      parsed.type === 'object' && parsed.properties;
    return { json: parsed, detectedMode: isSchema ? 'schema' : 'data' };
  }

  // Try reading from stdin if piped
  try {
    raw = readFileSync('/dev/stdin', 'utf-8');
    if (raw.trim()) {
      const parsed = JSON.parse(raw);
      const isSchema = parsed && typeof parsed === 'object' &&
        parsed.type === 'object' && parsed.properties;
      return { json: parsed, detectedMode: isSchema ? 'schema' : 'data' };
    }
  } catch {
    // Not piped, ignore
  }

  console.error('  Error: No input provided.');
  console.error('  Use --schema <file>, --data <file>, --json <string>, or pipe via stdin.');
  process.exit(1);
}

function buildHTML(json: unknown, mode: string, options: RenderOptions): string {
  const rendererChoice = options.renderer && options.renderer !== 'auto'
    ? options.renderer as RenderIntent
    : undefined;

  if (mode === 'schema') {
    return renderFromSchema(json as Record<string, unknown>, {
      title: options.title ?? options.toolName ?? 'MCP Tool Input',
      toolName: options.toolName,
      toolDescription: options.toolDesc,
      debug: options.debug ?? true,
    });
  }

  return renderFromData(json, {
    title: options.title ?? options.toolName ?? 'MCP Tool Result',
    toolName: options.toolName,
    toolDescription: options.toolDesc,
    debug: options.debug,
    renderer: rendererChoice,
  });
}

export function render(options: RenderOptions): void {
  // Validate renderer choice
  if (options.renderer && !VALID_RENDERERS.includes(options.renderer)) {
    console.error(`  Error: Unknown renderer "${options.renderer}".`);
    console.error(`  Available: ${VALID_RENDERERS.join(', ')}`);
    process.exit(1);
  }

  const { json, detectedMode } = loadJSON(options);
  const mode = options.mode ?? detectedMode;
  const html = buildHTML(json, mode, options);

  // --stdout: print raw HTML to stdout (for embedding in response streams)
  if (options.stdout) {
    process.stdout.write(html);
    return;
  }

  const outDir = options.output ?? '/tmp/mcp-html-bridge';
  mkdirSync(outDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const toolSlug = (options.toolName ?? 'mcp-tool').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${toolSlug}_${timestamp}.html`;
  const outPath = join(outDir, fileName);

  writeFileSync(outPath, html, 'utf-8');
  console.log(outPath);

  if (options.open) {
    try {
      const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
      execSync(`${cmd} "${outPath}"`, { stdio: 'ignore' });
    } catch {
      // Silently fail if can't open browser
    }
  }
}
