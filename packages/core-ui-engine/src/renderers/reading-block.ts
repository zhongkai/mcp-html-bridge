// ── Reading Block Renderer: long text/markdown → formatted block ──
import { escapeHtml } from '../html-builder.js';

/** Simple markdown-like formatting (no dependencies) */
function formatText(text: string): string {
  let html = escapeHtml(text);

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="rb-h3">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="rb-h2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="rb-h1">$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="rb-code">$1</code>');

  // Code blocks
  html = html.replace(/```[\s\S]*?```/g, (match) => {
    const code = match.slice(3, -3).replace(/^\w*\n/, '');
    return `<pre class="rb-pre"><code>${code}</code></pre>`;
  });

  // Line breaks → paragraphs
  html = html
    .split(/\n\n+/)
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<h') || trimmed.startsWith('<pre')) return trimmed;
      return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
    })
    .filter(Boolean)
    .join('\n');

  return html;
}

export function renderReadingBlock(
  data: unknown,
  metadata: Record<string, unknown>
): string {
  const textKeys = metadata['textKeys'] as string[] | undefined;

  // Direct string
  if (typeof data === 'string') {
    return `<article class="reading-block card animate-in">${formatText(data)}</article>`;
  }

  // Object with text keys
  if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    const sections: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && (value.length > 100 || (textKeys && textKeys.includes(key)))) {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').replace(/^\w/, (c) => c.toUpperCase()).trim();
        sections.push(`<section class="rb-section">
  <h3 class="rb-section-title">${escapeHtml(label)}</h3>
  <div class="rb-content">${formatText(value)}</div>
</section>`);
      } else {
        // Non-text fields → small metadata row
        sections.push(`<div class="rb-meta-row">
  <span class="rb-meta-key">${escapeHtml(key)}</span>
  <span class="rb-meta-val">${escapeHtml(String(value))}</span>
</div>`);
      }
    }

    return `<article class="reading-block card animate-in">${sections.join('\n')}</article>`;
  }

  // Fallback
  return `<article class="reading-block card animate-in"><pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre></article>`;
}

export function getReadingBlockCSS(): string {
  return `
.reading-block { max-width: 720px; line-height: 1.75; }
.reading-block p { margin-bottom: var(--sp-4); color: var(--text-primary); }
.reading-block strong { font-weight: 700; }

.rb-h1 { font-size: var(--text-2xl); font-weight: 800; margin: var(--sp-6) 0 var(--sp-3); }
.rb-h2 { font-size: var(--text-xl); font-weight: 700; margin: var(--sp-5) 0 var(--sp-2); }
.rb-h3 { font-size: var(--text-lg); font-weight: 600; margin: var(--sp-4) 0 var(--sp-2); }

.rb-code {
  background: var(--bg-tertiary); padding: 2px 6px; border-radius: 4px;
  font-family: var(--font-mono); font-size: 0.9em;
}
.rb-pre {
  background: var(--bg-tertiary); padding: var(--sp-4); border-radius: var(--radius-sm);
  overflow-x: auto; font-family: var(--font-mono); font-size: var(--text-sm);
  margin: var(--sp-4) 0;
}

.rb-section { margin-bottom: var(--sp-6); }
.rb-section-title {
  font-size: var(--text-base); font-weight: 700; color: var(--accent);
  margin-bottom: var(--sp-2); padding-bottom: var(--sp-1); border-bottom: 1px solid var(--border);
}
.rb-content { color: var(--text-primary); }

.rb-meta-row {
  display: flex; gap: var(--sp-3); padding: var(--sp-1) 0;
  font-size: var(--text-sm); border-bottom: 1px solid var(--border);
}
.rb-meta-key { font-weight: 600; color: var(--text-secondary); min-width: 120px; }
.rb-meta-val { color: var(--text-primary); }
`;
}
