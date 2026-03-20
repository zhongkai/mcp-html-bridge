// ── test-mock subcommand: render mock data to HTML files ──
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { renderFromData, renderFromSchema } from '@mcp-html-bridge/ui-engine';
import { ecommerceData, physicsData, sampleToolSchema } from './mock-data.js';

export function testMock(outputDir: string, debug: boolean): void {
  mkdirSync(outputDir, { recursive: true });

  const opts = { debug };

  // 1. E-commerce data (composite: metrics + grid)
  const ecommerceHtml = renderFromData(ecommerceData, {
    ...opts,
    title: 'E-Commerce Dashboard — TechMart',
    toolName: 'get_inventory',
  });
  const ecomPath = join(outputDir, 'ecommerce.html');
  writeFileSync(ecomPath, ecommerceHtml);
  console.log(`  ✓ ${ecomPath}`);

  // 2. E-commerce products only (data grid)
  const gridHtml = renderFromData(ecommerceData.products, {
    ...opts,
    title: 'Product Grid',
    toolName: 'list_products',
  });
  const gridPath = join(outputDir, 'data-grid.html');
  writeFileSync(gridPath, gridHtml);
  console.log(`  ✓ ${gridPath}`);

  // 3. Physics data (composite: reading block + metrics + grid)
  const physicsHtml = renderFromData(physicsData, {
    ...opts,
    title: 'LHC Collision Analysis',
    toolName: 'analyze_collisions',
  });
  const physicsPath = join(outputDir, 'physics.html');
  writeFileSync(physicsPath, physicsHtml);
  console.log(`  ✓ ${physicsPath}`);

  // 4. Physics results only (metrics cards)
  const metricsHtml = renderFromData(physicsData.results, {
    ...opts,
    title: 'Collision Metrics',
    toolName: 'get_results',
  });
  const metricsPath = join(outputDir, 'metrics.html');
  writeFileSync(metricsPath, metricsHtml);
  console.log(`  ✓ ${metricsPath}`);

  // 5. Tool schema (form)
  const formHtml = renderFromSchema(sampleToolSchema.inputSchema, {
    ...opts,
    title: 'Search Products',
    toolName: sampleToolSchema.name,
    toolDescription: sampleToolSchema.description,
  });
  const formPath = join(outputDir, 'form.html');
  writeFileSync(formPath, formHtml);
  console.log(`  ✓ ${formPath}`);

  // 6. Deep JSON (json-tree)
  const treeHtml = renderFromData(physicsData, {
    ...opts,
    title: 'Raw JSON Tree',
  });
  const treePath = join(outputDir, 'json-tree.html');
  writeFileSync(treePath, treeHtml);
  console.log(`  ✓ ${treePath}`);

  console.log(`\n  ${6} HTML files written to ${outputDir}`);
  console.log('  Open them in a browser to verify rendering.');
}
