/**
 * LLM-powered semantic renderer.
 *
 * The structural renderer (renderer.ts) maps JSON shapes to HTML mechanically.
 * This module sends JSON to an LLM with a rendering prompt,
 * letting the model understand semantics and produce the best HTML.
 *
 * Supports any OpenAI-compatible API.
 */

/** Configuration for the LLM endpoint */
export interface LLMConfig {
  /** API base URL (e.g. "http://localhost:11434/v1") */
  apiUrl: string;
  /** API key (optional for local models) */
  apiKey?: string;
  /** Model name */
  model: string;
}

/**
 * The rendering prompt.
 *
 * This is intentionally short and non-prescriptive. We tell the model
 * WHAT to do (produce the best HTML for this data), not HOW to do it
 * (don't enumerate SVG, markdown, etc.). The model should figure out
 * the semantics on its own.
 */
const SYSTEM_PROMPT = `You are a JSON-to-HTML renderer. You receive JSON data and produce an HTML fragment that visualizes it in the best way possible.

Rules:
1. Output ONLY an HTML fragment. No <html>, <head>, <body> wrappers — those exist already.
2. Understand what the data MEANS, not just its shape. Render content in its native form — if something is meant to be seen, show it; if it's meant to be read, format it; if it's structured, organize it.
3. Use these CSS variables for theming (light/dark mode is handled automatically):
   Colors: --bg-primary, --bg-secondary, --bg-tertiary, --bg-elevated, --text-primary, --text-secondary, --text-tertiary, --accent, --accent-subtle, --success, --warning, --danger, --info (each has a -subtle variant), --border, --border-strong
   Typography: --font-sans, --font-mono, --text-xs to --text-3xl
   Spacing: --sp-1 (4px) to --sp-12 (48px)
   Radius: --radius-sm, --radius-md, --radius-lg, --radius-full
   Shadows: --shadow-sm, --shadow-md, --shadow-lg
   Utility classes: .card, .badge, .badge-success, .badge-warning, .badge-danger, .badge-info, .section-title
4. Tailwind-compatible utility classes are available. Use them freely: flex, grid, gap-*, p-*, m-*, text-*, bg-*, border, rounded-*, shadow-*, font-*, items-*, justify-*, w-full, h-full, overflow-*, relative/absolute, etc. Responsive prefixes sm: and md: work too.
5. Do not invent data. Do not add commentary. Just the HTML.
6. Do not wrap output in markdown code fences.`;

/**
 * Call an OpenAI-compatible chat completions API.
 */
async function callLLM(
  data: unknown,
  config: LLMConfig
): Promise<string> {
  const url = config.apiUrl.replace(/\/+$/, '') + '/chat/completions';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  const body = {
    model: config.model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify(data, null, 2) },
    ],
    temperature: 0.2,
    max_tokens: 16384,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LLM API ${response.status}: ${text.slice(0, 300)}`);
  }

  const result = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = result.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('LLM returned empty response');
  }

  return stripCodeFences(content);
}

/** Remove markdown code fences if the LLM wrapped its output */
function stripCodeFences(html: string): string {
  const trimmed = html.trim();
  const fenceMatch = trimmed.match(/^```(?:html)?\s*\n([\s\S]*?)\n\s*```$/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }
  return trimmed;
}

/**
 * Render JSON data using an LLM for semantic understanding.
 * Returns an HTML fragment (not a full document).
 * Falls back to structural renderer on failure.
 */
export async function renderWithLLM(
  data: unknown,
  config: LLMConfig
): Promise<string> {
  try {
    const html = await callLLM(data, config);
    return `<div class="mcp-root">${html}</div>`;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`  LLM rendering failed: ${message}`);
    console.error('  Falling back to structural renderer.');

    const { renderJSON } = await import('./renderer.js');
    const fallbackHTML = renderJSON(data);
    const errorBanner = `<div style="padding:var(--sp-3);margin-bottom:var(--sp-4);background:var(--warning-subtle);border:1px solid var(--warning);border-radius:var(--radius-sm);font-size:var(--text-sm);color:var(--text-primary)">LLM rendering failed: ${message.replace(/</g, '&lt;')}. Showing structural fallback.</div>`;
    return `<div class="mcp-root">${errorBanner}${fallbackHTML}</div>`;
  }
}

/** Export the system prompt for inspection/customization */
export { SYSTEM_PROMPT as RENDERING_PROMPT };
