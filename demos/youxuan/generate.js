/**
 * 百度优选电商搜索 Demo — HTML 生成脚本
 *
 * 使用 @mcp-html-bridge/ui-engine 将百度优选 MCP Skill 的
 * 工具 schema 和模拟返回数据渲染为自包含 HTML 页面。
 *
 * 用法: node generate.js
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderFromData, renderFromSchema, escapeHtml } from '@mcp-html-bridge/ui-engine';
import {
  searchProducts,
  compareProducts,
  getRecommendation,
} from './tool-schemas.js';
import {
  searchResult,
  compareResult,
  recommendResult,
  dashboardData,
} from './mock-data.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, 'output');
mkdirSync(outDir, { recursive: true });

function write(name, html) {
  const p = join(outDir, name);
  writeFileSync(p, html);
  console.log(`  ✓ ${name}`);
}

console.log('\n  百度优选电商搜索 Demo — generating HTML\n');

// ── 1. 商品搜索表单 ──
write(
  'search-form.html',
  renderFromSchema(searchProducts.inputSchema, {
    title: '百度优选 — 商品搜索',
    toolName: searchProducts.name,
    toolDescription: searchProducts.description,
    debug: true,
  })
);

// ── 2. 商品对比表单 ──
write(
  'compare-form.html',
  renderFromSchema(compareProducts.inputSchema, {
    title: '百度优选 — 商品对比',
    toolName: compareProducts.name,
    toolDescription: compareProducts.description,
  })
);

// ── 3. 购买决策表单 ──
write(
  'recommend-form.html',
  renderFromSchema(getRecommendation.inputSchema, {
    title: '百度优选 — 购买决策',
    toolName: getRecommendation.name,
    toolDescription: getRecommendation.description,
  })
);

// ── 4. 搜索结果（商品列表） ──
write(
  'search-result.html',
  renderFromData(searchResult, {
    title: '搜索结果 — 轻薄笔记本',
    toolName: 'baidu_youxuan_search',
    debug: true,
  })
);

// ── 5. 商品对比结果 ──
write(
  'compare-result.html',
  renderFromData(compareResult.comparison, {
    title: '商品参数对比',
    toolName: 'baidu_youxuan_compare',
  })
);

// ── 6. 购买决策推荐 ──
write(
  'recommend-result.html',
  renderFromData(recommendResult, {
    title: '购买决策 — 大学生轻薄本推荐',
    toolName: 'baidu_youxuan_recommend',
  })
);

// ── 7. 平台看板 ──
write(
  'dashboard.html',
  renderFromData(dashboardData, {
    title: '百度优选 — 平台看板',
    toolName: 'baidu_youxuan_dashboard',
  })
);

// ── 8. 首页 (index.html) — 聚合导航 ──
const pages = [
  ['search-form.html', '商品搜索表单', 'Schema → Form', '体验 CPS 检索工具的输入表单'],
  ['compare-form.html', '商品对比表单', 'Schema → Form', '选择多个商品进行参数对比'],
  ['recommend-form.html', '购买决策表单', 'Schema → Form', '描述需求获取智能推荐'],
  ['search-result.html', '搜索结果', 'Data → Grid + Composite', '8款轻薄笔记本商品列表'],
  ['compare-result.html', '商品对比', 'Data → Grid', '4款笔记本核心参数对比表'],
  ['recommend-result.html', '购买决策', 'Data → Composite', '基于需求的智能推荐方案'],
  ['dashboard.html', '平台看板', 'Data → Metrics + Composite', '百度优选平台数据概览'],
];

const indexHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>百度优选电商搜索 — MCP-HTML-Bridge Demo</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #ffffff; --bg2: #f8f9fb; --text: #1a1d23; --text2: #5f6672;
    --accent: #2b6cb0; --accent-light: #ebf4ff; --border: #e2e5ea;
    --shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0f1117; --bg2: #161922; --text: #e8eaed; --text2: #9aa0ab;
      --accent: #63b3ed; --accent-light: #1c2d44; --border: #2a2d38;
      --shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg); color: var(--text);
    max-width: 960px; margin: 0 auto; padding: 48px 24px;
  }
  .hero { text-align: center; margin-bottom: 48px; }
  .hero h1 { font-size: 2rem; font-weight: 800; margin-bottom: 8px; }
  .hero .sub { color: var(--text2); font-size: 1rem; line-height: 1.6; }
  .hero .badge {
    display: inline-block; margin-top: 12px; padding: 4px 12px;
    background: var(--accent-light); color: var(--accent);
    border-radius: 999px; font-size: 0.8rem; font-weight: 600;
  }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
  .card {
    background: var(--bg2); border: 1px solid var(--border); border-radius: 12px;
    padding: 24px; text-decoration: none; color: inherit;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    display: flex; flex-direction: column; gap: 8px;
  }
  .card:hover { transform: translateY(-3px); box-shadow: var(--shadow); }
  .card h3 { font-size: 1.05rem; font-weight: 700; }
  .card .tag {
    display: inline-block; padding: 2px 8px; border-radius: 4px;
    font-size: 0.7rem; font-weight: 600; background: var(--accent-light); color: var(--accent);
    width: fit-content;
  }
  .card p { font-size: 0.85rem; color: var(--text2); line-height: 1.5; }
  .footer {
    text-align: center; margin-top: 48px; padding-top: 24px;
    border-top: 1px solid var(--border); color: var(--text2); font-size: 0.8rem;
  }
  .footer a { color: var(--accent); text-decoration: none; }
</style>
</head>
<body>
  <div class="hero">
    <h1>百度优选电商搜索</h1>
    <div class="sub">
      基于 MCP-HTML-Bridge 渲染的百度优选 Skill Demo<br>
      CPS 检索 · 参数对比 · 决策支持
    </div>
    <span class="badge">MCP-HTML-Bridge v0.1.0</span>
  </div>
  <div class="grid">
${pages
  .map(
    ([href, title, tag, desc]) =>
      `    <a class="card" href="${href}">
      <span class="tag">${tag}</span>
      <h3>${title}</h3>
      <p>${desc}</p>
    </a>`
  )
  .join('\n')}
  </div>
  <div class="footer">
    Powered by <a href="https://github.com/zhongkai/mcp-html-bridge">MCP-HTML-Bridge</a>
    · 数据来源 <a href="https://openai.baidu.com/">百度优选开放平台</a>（模拟数据）
  </div>
</body>
</html>`;

write('index.html', indexHtml);

console.log(`\n  ${pages.length + 1} files → ${outDir}/`);
console.log('  open output/index.html to preview\n');
