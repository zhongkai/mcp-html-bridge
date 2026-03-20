// ── Metrics Card Renderer: KPI/summary → card layout ──
import { escapeHtml } from '../html-builder.js';

function formatMetricValue(value: number, key: string): string {
  // Percentage
  if (/rate|ratio|percent|pct/i.test(key)) {
    return `${(value * (value <= 1 ? 100 : 1)).toFixed(1)}%`;
  }
  // Currency
  if (/price|cost|revenue|amount|total|value/i.test(key)) {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
  }
  // Large numbers
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  // Scientific notation for very small/large
  if (Math.abs(value) < 0.001 && value !== 0) return value.toExponential(2);

  return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2);
}

function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

export function renderMetricsCard(
  data: unknown,
  _metadata: Record<string, unknown>
): string {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return '<div class="card">Invalid metrics data</div>';
  }

  const obj = data as Record<string, unknown>;
  const cards: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'number') {
      const formatted = formatMetricValue(value, key);
      const label = humanizeKey(key);
      cards.push(`<div class="metric-card animate-in">
  <div class="metric-label">${escapeHtml(label)}</div>
  <div class="metric-value">${escapeHtml(formatted)}</div>
</div>`);
    } else if (typeof value === 'string') {
      cards.push(`<div class="metric-card metric-text animate-in">
  <div class="metric-label">${escapeHtml(humanizeKey(key))}</div>
  <div class="metric-text-value">${escapeHtml(value)}</div>
</div>`);
    }
  }

  return `<div class="metrics-grid">${cards.join('\n')}</div>`;
}

export function getMetricsCardCSS(): string {
  return `
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--sp-4);
}

.metric-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--sp-5);
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  transition: box-shadow var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
}
.metric-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.metric-label {
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-tertiary);
}

.metric-value {
  font-size: var(--text-3xl);
  font-weight: 800;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.metric-text-value {
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--text-secondary);
}
`;
}
