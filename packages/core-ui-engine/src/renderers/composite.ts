// ── Composite Renderer: orchestrates multiple renderers for mixed data ──
import { escapeHtml } from '../html-builder.js';
import { sniff } from '../data-sniffer.js';
import { renderDataGrid } from './data-grid.js';
import { renderJsonTree } from './json-tree.js';
import { renderReadingBlock } from './reading-block.js';
import { renderMetricsCard } from './metrics-card.js';
import type { RenderIntent } from '../types.js';

function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

function renderByIntent(intent: RenderIntent, data: unknown, metadata: Record<string, unknown>): string {
  switch (intent) {
    case 'data-grid':
      return renderDataGrid(data, metadata);
    case 'metrics-card':
      return renderMetricsCard(data, metadata);
    case 'reading-block':
      return renderReadingBlock(data, metadata);
    case 'json-tree':
      return renderJsonTree(data, metadata);
    default:
      return renderJsonTree(data, metadata);
  }
}

export function renderComposite(
  data: unknown,
  _metadata: Record<string, unknown>
): string {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    // For arrays or primitives, just sniff and render directly
    const results = sniff(data);
    const best = results[0];
    return renderByIntent(best.intent, data, best.metadata);
  }

  const obj = data as Record<string, unknown>;
  const sections: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const results = sniff(value);
    const best = results[0];
    const label = humanizeKey(key);

    sections.push(`<section class="composite-section animate-in">
  <h3 class="section-title">${escapeHtml(label)}</h3>
  ${renderByIntent(best.intent, value, best.metadata)}
</section>`);
  }

  return `<div class="composite-layout">${sections.join('\n')}</div>`;
}

export function getCompositeCSS(): string {
  return `
.composite-layout {
  display: flex;
  flex-direction: column;
  gap: var(--sp-8);
}

.composite-section {
  /* Each section self-contained */
}
`;
}
