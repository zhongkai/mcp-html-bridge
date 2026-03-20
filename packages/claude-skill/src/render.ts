/**
 * Render MCP tool schema or data as a self-contained HTML page.
 *
 * LLM config resolution order:
 *   CLI flags > env vars > ~/.mcp-html-bridge/config.json > no LLM (structural)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { renderFromSchema, renderFromData, renderFromDataSync } from '@mcp-html-bridge/ui-engine';
import { resolveLLMConfig } from './config.js';

interface RenderOptions {
  schema?: string;
  data?: string;
  json?: string;
  mode?: 'schema' | 'data';
  title?: string;
  toolName?: string;
  toolDesc?: string;
  debug?: boolean;
  output?: string;
  open?: boolean;
  stdout?: boolean;
  apiUrl?: string;
  apiKey?: string;
  model?: string;
  llm?: boolean; // --no-llm sets this to false
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

  try {
    raw = readFileSync('/dev/stdin', 'utf-8');
    if (raw.trim()) {
      const parsed = JSON.parse(raw);
      const isSchema = parsed && typeof parsed === 'object' &&
        parsed.type === 'object' && parsed.properties;
      return { json: parsed, detectedMode: isSchema ? 'schema' : 'data' };
    }
  } catch {
    // Not piped
  }

  console.error('Error: No input. Use --schema, --data, --json, or pipe via stdin.');
  process.exit(1);
}

function writeAndOpen(html: string, options: RenderOptions): void {
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
      // Can't open browser
    }
  }
}

export async function render(options: RenderOptions): Promise<void> {
  const { json, detectedMode } = loadJSON(options);
  const mode = options.mode ?? detectedMode;

  if (mode === 'schema') {
    const html = renderFromSchema(json as Record<string, unknown>, {
      title: options.title ?? options.toolName ?? 'MCP Tool Input',
      toolName: options.toolName,
      toolDescription: options.toolDesc,
      debug: options.debug ?? true,
    });
    writeAndOpen(html, options);
    return;
  }

  // Resolve LLM config (CLI flags > env vars > config file)
  // --no-llm forces structural rendering
  const llm = options.llm === false
    ? undefined
    : resolveLLMConfig({
        apiUrl: options.apiUrl,
        apiKey: options.apiKey,
        model: options.model,
      });

  if (llm) {
    console.error(`  LLM: ${llm.model} @ ${llm.apiUrl}`);
    const html = await renderFromData(json, {
      title: options.title ?? options.toolName ?? 'MCP Tool Result',
      toolName: options.toolName,
      toolDescription: options.toolDesc,
      debug: options.debug,
      llm,
    });
    writeAndOpen(html, options);
  } else {
    const html = renderFromDataSync(json, {
      title: options.title ?? options.toolName ?? 'MCP Tool Result',
      toolName: options.toolName,
      toolDescription: options.toolDesc,
      debug: options.debug,
    });
    writeAndOpen(html, options);
  }
}
