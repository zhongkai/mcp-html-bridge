// ── Data Sniffer: confidence-scored heuristic engine ──
import type { SniffResult, RenderIntent } from './types.js';

/** Measure maximum nesting depth of a value */
function measureDepth(val: unknown, current = 0): number {
  if (current > 20) return current; // guard
  if (Array.isArray(val)) {
    return val.reduce<number>((max, item) => Math.max(max, measureDepth(item, current + 1)), current);
  }
  if (val !== null && typeof val === 'object') {
    return Object.values(val as Record<string, unknown>).reduce<number>(
      (max, v) => Math.max(max, measureDepth(v, current + 1)),
      current
    );
  }
  return current;
}

/** Check if an array of objects has consistent keys */
function keyConsistency(arr: Record<string, unknown>[]): number {
  if (arr.length === 0) return 0;
  const firstKeys = new Set(Object.keys(arr[0]));
  let matchCount = 0;
  for (let i = 1; i < arr.length; i++) {
    const keys = Object.keys(arr[i]);
    const overlap = keys.filter((k) => firstKeys.has(k)).length;
    matchCount += overlap / Math.max(firstKeys.size, keys.length);
  }
  return matchCount / (arr.length - 1);
}

const READING_KEYS = new Set([
  'description', 'content', 'body', 'text', 'message',
  'summary', 'readme', 'notes', 'details', 'markdown',
]);

/** Detect data-grid intent */
function detectDataGrid(data: unknown): SniffResult | null {
  if (!Array.isArray(data) || data.length === 0) return null;
  const objects = data.filter(
    (item): item is Record<string, unknown> =>
      item !== null && typeof item === 'object' && !Array.isArray(item)
  );
  if (objects.length < 2) return null;

  const consistency = keyConsistency(objects);
  if (consistency < 0.5) return null;

  const confidence = Math.min(0.95, 0.5 + consistency * 0.3 + Math.min(objects.length / 20, 0.15));
  return {
    intent: 'data-grid',
    confidence,
    metadata: {
      rowCount: objects.length,
      columns: Object.keys(objects[0]),
      keyConsistency: consistency,
    },
  };
}

/** Detect metrics-card intent */
function detectMetricsCard(data: unknown): SniffResult | null {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) return null;
  const entries = Object.entries(data as Record<string, unknown>);
  if (entries.length === 0 || entries.length > 12) return null;

  const numericCount = entries.filter(([, v]) => typeof v === 'number').length;
  const ratio = numericCount / entries.length;

  if (numericCount < 1 || ratio < 0.3) return null;

  const confidence = Math.min(0.9, 0.4 + ratio * 0.4 + (entries.length <= 6 ? 0.1 : 0));
  return {
    intent: 'metrics-card',
    confidence,
    metadata: {
      numericKeys: entries.filter(([, v]) => typeof v === 'number').map(([k]) => k),
      totalKeys: entries.length,
    },
  };
}

/** Detect json-tree intent */
function detectJsonTree(data: unknown): SniffResult | null {
  const depth = measureDepth(data);
  if (depth < 3) return null;

  const confidence = Math.min(0.85, 0.3 + (depth - 2) * 0.1);
  return {
    intent: 'json-tree',
    confidence,
    metadata: { depth },
  };
}

/** Detect reading-block intent */
function detectReadingBlock(data: unknown): SniffResult | null {
  if (typeof data === 'string' && data.length > 200) {
    return {
      intent: 'reading-block',
      confidence: 0.85,
      metadata: { length: data.length },
    };
  }
  if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
    const entries = Object.entries(data as Record<string, unknown>);
    const longTextEntries = entries.filter(
      ([k, v]) =>
        (typeof v === 'string' && v.length > 200) || READING_KEYS.has(k.toLowerCase())
    );
    if (longTextEntries.length > 0) {
      const confidence = Math.min(0.8, 0.4 + longTextEntries.length * 0.15);
      return {
        intent: 'reading-block',
        confidence,
        metadata: { textKeys: longTextEntries.map(([k]) => k) },
      };
    }
  }
  return null;
}

/** Main sniff function: returns ranked intents */
export function sniff(data: unknown): SniffResult[] {
  const results: SniffResult[] = [];

  const grid = detectDataGrid(data);
  if (grid) results.push(grid);

  const metrics = detectMetricsCard(data);
  if (metrics) results.push(metrics);

  const tree = detectJsonTree(data);
  if (tree) results.push(tree);

  const reading = detectReadingBlock(data);
  if (reading) results.push(reading);

  // If multiple intents detected with similar confidence, suggest composite
  if (results.length > 1) {
    const topConfidence = Math.max(...results.map((r) => r.confidence));
    const close = results.filter((r) => topConfidence - r.confidence < 0.2);
    if (close.length > 1) {
      results.push({
        intent: 'composite',
        confidence: topConfidence * 0.9,
        metadata: { subIntents: close.map((r) => r.intent) },
      });
    }
  }

  // Fallback: if nothing detected, default to json-tree
  if (results.length === 0) {
    results.push({
      intent: 'json-tree',
      confidence: 0.3,
      metadata: { fallback: true },
    });
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}

/** Detect intent from JSON Schema (for form rendering) */
export function sniffSchema(schema: Record<string, unknown>): SniffResult {
  const props = schema['properties'] as Record<string, unknown> | undefined;
  const propCount = props ? Object.keys(props).length : 0;

  return {
    intent: 'form',
    confidence: 0.95,
    metadata: {
      propertyCount: propCount,
      required: schema['required'] ?? [],
    },
  };
}
