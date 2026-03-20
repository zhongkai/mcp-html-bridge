# MCP-HTML-Bridge Usage Guide

> [中文版](#中文版)

---

## Table of Contents

- [Installation](#installation)
- [Core Concepts](#core-concepts)
- [Rendering Data](#rendering-data)
- [Rendering Forms from Schema](#rendering-forms-from-schema)
- [Unified API](#unified-api)
- [Data Sniffer — How Detection Works](#data-sniffer--how-detection-works)
- [Bridge Protocol — Bidirectional Communication](#bridge-protocol--bidirectional-communication)
- [Debug Playground](#debug-playground)
- [CLI Usage](#cli-usage)
- [Proxy Mode](#proxy-mode)
- [MCP Client — Connecting to Servers](#mcp-client--connecting-to-servers)
- [Theming & Dark Mode](#theming--dark-mode)
- [HTML Builder Utilities](#html-builder-utilities)
- [Recipes](#recipes)

---

## Installation

```bash
# Core engine (most users only need this)
npm install @mcp-html-bridge/ui-engine

# CLI tool
npm install -g @mcp-html-bridge/cli

# MCP client (for programmatic server connection)
npm install @mcp-html-bridge/mcp-client

# Proxy server
npm install @mcp-html-bridge/proxy
```

---

## Core Concepts

MCP-HTML-Bridge converts data into self-contained HTML strings. No framework, no CDN, no runtime dependency — just a single HTML string you can:

- Write to a `.html` file and open in a browser
- Embed in an `<iframe>` with `srcdoc`
- Attach to an MCP tool response as a code block
- Serve from any HTTP endpoint

The engine has two input modes:

| Mode | Input | Output |
|------|-------|--------|
| **Data** | Any JSON value (object, array, string, number) | Auto-detected layout (grid, cards, tree, etc.) |
| **Schema** | JSON Schema (from MCP tool `inputSchema`) | Interactive form with smart widgets |

---

## Rendering Data

```typescript
import { renderFromData } from '@mcp-html-bridge/ui-engine';

// Pass any data — the engine auto-detects the best layout
const html = renderFromData(myApiResponse, {
  title: 'API Results',       // <title> tag
  toolName: 'get_users',      // shown in header
  debug: false,               // toggle playground panel
});

// Write to file
import { writeFileSync } from 'fs';
writeFileSync('output.html', html);
```

### What gets rendered?

The engine inspects your data and picks the best renderer:

```typescript
// Array of objects → sortable data grid
renderFromData([
  { name: 'Alice', role: 'admin', active: true },
  { name: 'Bob', role: 'user', active: false },
]);

// Flat object with numbers → KPI metric cards
renderFromData({
  totalUsers: 14283,
  revenue: 284750.00,
  conversionRate: 0.034,
});

// Deeply nested object → collapsible JSON tree
renderFromData({
  config: {
    database: {
      primary: { host: 'db1', port: 5432 },
      replica: { host: 'db2', port: 5432 },
    },
  },
});

// Long text → reading block with basic markdown
renderFromData({
  title: 'Release Notes',
  body: 'A very long markdown string with **bold** and `code`...',
});

// Mixed data → composite layout (sections stacked vertically)
renderFromData({
  summary: { totalSKUs: 8, revenue: 284750 },
  products: [
    { sku: 'A1', name: 'Widget', price: 29.99 },
    { sku: 'A2', name: 'Gadget', price: 49.99 },
  ],
  notes: 'Quarterly inventory snapshot...',
});
```

---

## Rendering Forms from Schema

```typescript
import { renderFromSchema } from '@mcp-html-bridge/ui-engine';

const html = renderFromSchema(
  {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      category: {
        type: 'string',
        enum: ['Books', 'Electronics', 'Clothing'],
      },
      maxPrice: { type: 'number', minimum: 0 },
      inStock: { type: 'boolean', default: true },
    },
    required: ['query'],
  },
  {
    toolName: 'search_products',
    toolDescription: 'Search the product catalog with filters.',
  }
);
```

### Form widget mapping

| Schema type | Widget |
|---|---|
| `string` | Text input |
| `string` + `enum` | Capsule radio group |
| `string` + `format: "email"` | Email input |
| `string` + `format: "date"` | Date picker |
| `string` + `maxLength > 200` | Textarea |
| `number` / `integer` | Number input with min/max |
| `boolean` | Toggle switch |
| `object` with `properties` | Collapsible nested section |
| `array` | Textarea (JSON input) |

---

## Unified API

If you need to handle both schema and data modes dynamically:

```typescript
import { render } from '@mcp-html-bridge/ui-engine';
import type { EngineInput } from '@mcp-html-bridge/ui-engine';

// Schema mode
const input1: EngineInput = {
  mode: 'schema',
  schema: toolDefinition.inputSchema,
  toolName: 'my_tool',
};

// Data mode
const input2: EngineInput = {
  mode: 'data',
  data: toolResult,
  toolName: 'my_tool',
};

const html = render(input1, { title: 'My Tool' });
```

---

## Data Sniffer — How Detection Works

You can use the sniffer directly to inspect what the engine would do:

```typescript
import { sniff } from '@mcp-html-bridge/ui-engine';

const results = sniff(myData);
// Returns: SniffResult[] sorted by confidence (highest first)
// [
//   { intent: 'data-grid', confidence: 0.88, metadata: { rowCount: 50, columns: [...] } },
//   { intent: 'composite', confidence: 0.79, metadata: { subIntents: [...] } },
// ]
```

### Detection rules

| Intent | Trigger condition | Confidence factors |
|---|---|---|
| `data-grid` | Array of 2+ objects with >50% key overlap | Array length, key consistency |
| `metrics-card` | Object with 1-12 keys, ≥30% numeric values | Numeric ratio, key count |
| `json-tree` | Nesting depth ≥ 3 | Depth level |
| `reading-block` | String > 200 chars, or keys named `description`/`content`/`body` | Text length, key name match |
| `composite` | Multiple intents with close confidence scores | Top confidence × 0.9 |
| `form` | (Schema mode only) Always returned for schema input | Fixed 0.95 |

---

## Bridge Protocol — Bidirectional Communication

Every generated HTML page includes an inline bridge script. This enables communication when the HTML is embedded in an iframe.

### From inside the HTML (auto-included)

```javascript
// The global __mcpBridge object is available in every rendered page

// Send a tool call to the parent frame
__mcpBridge.callTool('search_products', { query: 'laptop', maxPrice: 1000 });

// Listen for results
__mcpBridge.onResult(function(data) {
  console.log('Got result:', data);
});
```

### From the parent frame (your app)

```javascript
const iframe = document.getElementById('mcp-frame');

// Listen for tool calls from the iframe
window.addEventListener('message', (evt) => {
  if (evt.data?.type === 'MCP_TOOL_CALL') {
    const { toolName, arguments: args } = evt.data;
    // Execute the tool call, then send result back:
    iframe.contentWindow.postMessage({
      type: 'MCP_RESULT',
      data: result,
    }, '*');
  }
});

// Listen for auto-resize
window.addEventListener('message', (evt) => {
  if (evt.data?.type === 'MCP_RESIZE') {
    iframe.style.height = evt.data.height + 'px';
  }
});
```

### Form submission

Forms automatically serialize and dispatch via the bridge:

```javascript
// When a user clicks "Execute Tool", the form serializes to JSON
// and fires: __mcpBridge.callTool(toolName, serializedFormData)
// The parent frame receives a MCP_TOOL_CALL message.
```

---

## Debug Playground

Enable with `debug: true` to get a floating panel in the rendered HTML:

```typescript
const html = renderFromData(data, { debug: true });
```

The panel includes:

- **Configuration** — API Base URL, API Key, Model, System Prompt (saved to localStorage)
- **Console** — Timestamped log of all bridge events (tool calls, results, errors)
- **Raw JSON Injection** — Paste JSON and click "Inject & Re-render" to test different data

When configured, form submissions are automatically forwarded to the LLM API endpoint as chat completions.

---

## CLI Usage

### `test-mock` — Generate demo HTML

```bash
# Basic output
mcp-bridge test-mock

# Custom output directory + debug panel
mcp-bridge test-mock -o ./demo -d
```

Generates 6 HTML files from built-in datasets:

| File | Content | Renderer |
|---|---|---|
| `ecommerce.html` | Full e-commerce dashboard | Composite |
| `data-grid.html` | Product table (8 SKUs) | Data Grid |
| `physics.html` | LHC collision analysis | Composite |
| `metrics.html` | Collision statistics | Metrics Cards |
| `form.html` | Product search form | Form |
| `json-tree.html` | Raw physics data | JSON Tree |

### `compile` — Connect to MCP server and generate SKILL.md

```bash
# Connect to a local MCP server
mcp-bridge compile "node my-server.js"

# Connect to an npx-based server
mcp-bridge compile "npx -y @modelcontextprotocol/server-filesystem /tmp"

# Custom output path
mcp-bridge compile "node my-server.js" -o ./docs/TOOLS.md
```

The generated markdown file contains each tool's rendered HTML form inside `mcp-html` code blocks.

---

## Proxy Mode

The proxy sits between an MCP client and server, transparently forwarding all messages while appending rendered HTML to tool results.

```bash
# Start the proxy (reads stdin, writes stdout, spawns target as subprocess)
npx @mcp-html-bridge/proxy "npx -y @modelcontextprotocol/server-filesystem /tmp"
```

In your MCP client configuration, replace the server command with the proxy command:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y", "@mcp-html-bridge/proxy",
        "npx -y @modelcontextprotocol/server-filesystem /tmp"
      ]
    }
  }
}
```

Tool results will include an additional `mcp-html` code block containing the rendered HTML.

---

## MCP Client — Connecting to Servers

For programmatic access to any MCP server:

```typescript
import { MCPClient } from '@mcp-html-bridge/mcp-client';
import { renderFromSchema } from '@mcp-html-bridge/ui-engine';

const client = new MCPClient();

// Connect via stdio transport
await client.connect({
  command: 'npx -y @modelcontextprotocol/server-filesystem /tmp',
});

// List available tools
const tools = await client.listTools();

for (const tool of tools) {
  console.log(`${tool.name}: ${tool.description}`);

  // Generate a form for each tool
  const html = renderFromSchema(tool.inputSchema, {
    toolName: tool.name,
    toolDescription: tool.description,
  });
}

// Clean up
await client.disconnect();
```

---

## Theming & Dark Mode

Dark mode activates automatically via `prefers-color-scheme: dark`. No configuration needed.

To use the theme CSS independently:

```typescript
import { generateThemeCSS } from '@mcp-html-bridge/ui-engine';

const css = generateThemeCSS();
// Returns a CSS string with:
// - CSS variables for colors, spacing, typography, shadows
// - Light and dark mode palettes
// - .glass, .card, .badge utility classes
// - Fade-in animation
```

### Key CSS variables

```css
/* Surface colors */
--bg-primary    --bg-secondary    --bg-tertiary    --bg-elevated

/* Text colors */
--text-primary  --text-secondary  --text-tertiary

/* Accent */
--accent        --accent-hover    --accent-subtle

/* Semantic */
--success  --warning  --danger  --info

/* Spacing scale: --sp-1 (4px) through --sp-12 (48px) */
/* Typography: --text-xs through --text-3xl */
/* Radius: --radius-sm, --radius-md, --radius-lg, --radius-full */
```

---

## HTML Builder Utilities

Low-level helpers for building custom HTML strings safely:

```typescript
import { escapeHtml, tag, style, script, document } from '@mcp-html-bridge/ui-engine';

// XSS-safe escaping (mandatory for user input)
escapeHtml('<script>alert("xss")</script>');
// → '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'

// Build tags
tag('div', { class: 'card', id: 'main' });
// → '<div class="card" id="main">'

tag('input', { type: 'text', required: true }, true);
// → '<input type="text" required />'

// Wrap in style/script tags
style('body { margin: 0 }');
script('console.log("hello")');

// Full HTML document
document({
  title: 'My Page',
  css: 'body { font-family: sans-serif }',
  body: '<h1>Hello</h1>',
  js: 'console.log("loaded")',
});
```

---

## Recipes

### Embed in a React app

```tsx
function MCPViewer({ data }: { data: unknown }) {
  const html = useMemo(() => renderFromData(data), [data]);

  return (
    <iframe
      srcDoc={html}
      sandbox="allow-scripts"
      style={{ width: '100%', border: 'none' }}
      onLoad={(e) => {
        // Auto-resize
        window.addEventListener('message', (evt) => {
          if (evt.data?.type === 'MCP_RESIZE') {
            (e.target as HTMLIFrameElement).style.height = evt.data.height + 'px';
          }
        });
      }}
    />
  );
}
```

### Save MCP server tools as static HTML pages

```typescript
import { MCPClient } from '@mcp-html-bridge/mcp-client';
import { renderFromSchema } from '@mcp-html-bridge/ui-engine';
import { writeFileSync, mkdirSync } from 'fs';

async function exportTools(serverCmd: string, outDir: string) {
  mkdirSync(outDir, { recursive: true });
  const client = new MCPClient();
  await client.connect({ command: serverCmd });

  for (const tool of await client.listTools()) {
    const html = renderFromSchema(tool.inputSchema, {
      toolName: tool.name,
      toolDescription: tool.description,
      debug: true,
    });
    writeFileSync(`${outDir}/${tool.name}.html`, html);
  }

  await client.disconnect();
}
```

### Custom rendering pipeline

```typescript
import { sniff, renderFromData, generateThemeCSS } from '@mcp-html-bridge/ui-engine';

function customRender(data: unknown) {
  // Step 1: Inspect what the engine would do
  const intents = sniff(data);
  console.log('Detected:', intents[0].intent, `(${intents[0].confidence})`);

  // Step 2: Override if needed
  if (intents[0].intent === 'json-tree' && Array.isArray(data)) {
    // Force data-grid for arrays even if sniffer chose json-tree
    // (just re-structure your data to help the sniffer)
  }

  // Step 3: Render
  return renderFromData(data, { title: 'Custom Pipeline' });
}
```

---

<a id="中文版"></a>

# MCP-HTML-Bridge 使用指南（中文版）

## 目录

- [安装](#安装)
- [核心概念](#核心概念)
- [渲染数据](#渲染数据)
- [从 Schema 渲染表单](#从-schema-渲染表单)
- [统一 API](#统一-api)
- [数据嗅探器 — 检测原理](#数据嗅探器--检测原理)
- [Bridge 协议 — 双向通信](#bridge-协议--双向通信)
- [调试面板](#调试面板)
- [CLI 使用](#cli-使用)
- [代理模式](#代理模式)
- [MCP 客户端 — 连接服务器](#mcp-客户端--连接服务器)
- [主题与暗色模式](#主题与暗色模式)
- [HTML 构建工具](#html-构建工具)
- [实战示例](#实战示例)

---

## 安装

```bash
# 核心引擎（大多数用户只需要这个）
npm install @mcp-html-bridge/ui-engine

# CLI 工具
npm install -g @mcp-html-bridge/cli

# MCP 客户端（程序化连接服务器）
npm install @mcp-html-bridge/mcp-client

# 代理服务器
npm install @mcp-html-bridge/proxy
```

---

## 核心概念

MCP-HTML-Bridge 将数据转换为自包含的 HTML 字符串。无框架依赖、无 CDN、无运行时依赖 — 只是一个 HTML 字符串，你可以：

- 写入 `.html` 文件在浏览器中打开
- 用 `srcdoc` 嵌入 `<iframe>`
- 作为代码块附加到 MCP 工具响应中
- 从任何 HTTP 端点提供服务

引擎有两种输入模式：

| 模式 | 输入 | 输出 |
|------|------|------|
| **数据模式** | 任意 JSON 值 | 自动检测布局（表格、卡片、树等） |
| **Schema 模式** | JSON Schema（来自 MCP 工具的 `inputSchema`） | 带智能控件的交互式表单 |

---

## 渲染数据

```typescript
import { renderFromData } from '@mcp-html-bridge/ui-engine';

// 传入任意数据 — 引擎自动检测最佳布局
const html = renderFromData(myApiResponse, {
  title: 'API 结果',
  toolName: 'get_users',
  debug: false,
});
```

### 自动检测示例

```typescript
// 对象数组 → 可排序数据表格
renderFromData([
  { name: 'Alice', role: 'admin', active: true },
  { name: 'Bob', role: 'user', active: false },
]);

// 包含数值的扁平对象 → KPI 指标卡片
renderFromData({
  totalUsers: 14283,
  revenue: 284750.00,
  conversionRate: 0.034,
});

// 深层嵌套对象 → 可折叠 JSON 树
renderFromData({
  config: {
    database: {
      primary: { host: 'db1', port: 5432 },
      replica: { host: 'db2', port: 5432 },
    },
  },
});

// 长文本 → 格式化阅读块
renderFromData({
  title: '发布说明',
  body: '一段很长的 markdown 文本，包含 **粗体** 和 `代码`...',
});

// 混合数据 → 复合布局（多个区域垂直堆叠）
renderFromData({
  summary: { totalSKUs: 8, revenue: 284750 },
  products: [
    { sku: 'A1', name: '部件', price: 29.99 },
  ],
});
```

---

## 从 Schema 渲染表单

```typescript
import { renderFromSchema } from '@mcp-html-bridge/ui-engine';

const html = renderFromSchema(
  {
    type: 'object',
    properties: {
      query: { type: 'string', description: '搜索关键词' },
      category: {
        type: 'string',
        enum: ['图书', '电子产品', '服装'],
      },
      maxPrice: { type: 'number', minimum: 0 },
      inStock: { type: 'boolean', default: true },
    },
    required: ['query'],
  },
  {
    toolName: 'search_products',
    toolDescription: '按条件搜索商品目录',
  }
);
```

### 表单控件映射

| Schema 类型 | 控件 |
|---|---|
| `string` | 文本输入框 |
| `string` + `enum` | 胶囊单选组 |
| `string` + `format: "email"` | 邮箱输入框 |
| `string` + `format: "date"` | 日期选择器 |
| `string` + `maxLength > 200` | 多行文本框 |
| `number` / `integer` | 数字输入框（带 min/max） |
| `boolean` | 开关切换 |
| `object` + `properties` | 可折叠嵌套区域 |
| `array` | 文本框（JSON 输入） |

---

## 统一 API

动态处理 schema 和 data 两种模式：

```typescript
import { render } from '@mcp-html-bridge/ui-engine';
import type { EngineInput } from '@mcp-html-bridge/ui-engine';

const input: EngineInput = {
  mode: 'data',  // 或 'schema'
  data: myData,
  toolName: 'my_tool',
};

const html = render(input, { title: '我的工具' });
```

---

## 数据嗅探器 — 检测原理

直接使用嗅探器查看引擎会如何处理你的数据：

```typescript
import { sniff } from '@mcp-html-bridge/ui-engine';

const results = sniff(myData);
// 返回: SniffResult[]，按置信度降序排列
// [
//   { intent: 'data-grid', confidence: 0.88, metadata: { rowCount: 50 } },
//   { intent: 'composite', confidence: 0.79, metadata: { ... } },
// ]
```

### 检测规则

| 意图 | 触发条件 | 置信度因素 |
|---|---|---|
| `data-grid` | 2+ 个对象的数组，键重叠率 > 50% | 数组长度、键一致性 |
| `metrics-card` | 1-12 个键的对象，≥30% 为数值 | 数值比例、键数量 |
| `json-tree` | 嵌套深度 ≥ 3 | 深度等级 |
| `reading-block` | 字符串 > 200 字符，或键名为 `description`/`content`/`body` | 文本长度 |
| `composite` | 多个意图置信度接近 | 最高置信度 × 0.9 |
| `form` | （仅 Schema 模式）Schema 输入时固定返回 | 固定 0.95 |

---

## Bridge 协议 — 双向通信

每个生成的 HTML 页面都内置了 bridge 脚本，用于 iframe 嵌入时的通信。

### HTML 内部（自动包含）

```javascript
// 向父窗口发送工具调用
__mcpBridge.callTool('search_products', { query: 'laptop' });

// 监听结果
__mcpBridge.onResult(function(data) {
  console.log('收到结果:', data);
});
```

### 父窗口（你的应用）

```javascript
const iframe = document.getElementById('mcp-frame');

window.addEventListener('message', (evt) => {
  if (evt.data?.type === 'MCP_TOOL_CALL') {
    // 处理工具调用，然后发回结果
    iframe.contentWindow.postMessage({
      type: 'MCP_RESULT',
      data: result,
    }, '*');
  }
});
```

---

## 调试面板

启用 `debug: true` 后，渲染的 HTML 右下角会出现浮动调试按钮：

```typescript
const html = renderFromData(data, { debug: true });
```

面板功能：
- **配置区** — API 地址、Key、模型、System Prompt（保存到 localStorage）
- **控制台** — 带时间戳的事件日志
- **JSON 注入** — 粘贴 JSON 数据点击重新渲染

---

## CLI 使用

### `test-mock` — 生成演示 HTML

```bash
mcp-bridge test-mock -o ./demo -d
```

生成 6 个 HTML 文件：`ecommerce.html`、`data-grid.html`、`physics.html`、`metrics.html`、`form.html`、`json-tree.html`

### `compile` — 连接 MCP 服务器生成文档

```bash
mcp-bridge compile "node my-server.js" -o SKILL.md
```

---

## 代理模式

代理透明转发所有 MCP 消息，同时在工具结果中附加渲染后的 HTML：

```bash
npx @mcp-html-bridge/proxy "npx -y @modelcontextprotocol/server-filesystem /tmp"
```

在 MCP 客户端配置中替换服务器命令即可：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@mcp-html-bridge/proxy", "npx -y @modelcontextprotocol/server-filesystem /tmp"]
    }
  }
}
```

---

## MCP 客户端 — 连接服务器

```typescript
import { MCPClient } from '@mcp-html-bridge/mcp-client';

const client = new MCPClient();
await client.connect({ command: 'node my-server.js' });

const tools = await client.listTools();
for (const tool of tools) {
  console.log(`${tool.name}: ${tool.description}`);
}

await client.disconnect();
```

---

## 主题与暗色模式

暗色模式通过 `prefers-color-scheme: dark` 自动激活，无需配置。

单独使用主题 CSS：

```typescript
import { generateThemeCSS } from '@mcp-html-bridge/ui-engine';
const css = generateThemeCSS();
```

### 常用 CSS 变量

```css
--bg-primary / --bg-secondary / --bg-tertiary   /* 背景色 */
--text-primary / --text-secondary                /* 文字色 */
--accent / --accent-hover                        /* 强调色 */
--success / --warning / --danger / --info        /* 语义色 */
--sp-1 (4px) ~ --sp-12 (48px)                   /* 间距 */
--text-xs ~ --text-3xl                           /* 字号 */
--radius-sm / --radius-md / --radius-lg          /* 圆角 */
```

---

## HTML 构建工具

安全地构建 HTML 字符串：

```typescript
import { escapeHtml, tag, style, script, document } from '@mcp-html-bridge/ui-engine';

escapeHtml('<script>alert("xss")</script>');
// → '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'

tag('div', { class: 'card' });        // → '<div class="card">'
style('body { margin: 0 }');          // → '<style>...</style>'
document({ title: '页面', css: '...', body: '<h1>你好</h1>', js: '...' });
```

---

## 实战示例

### 在 React 中嵌入

```tsx
function MCPViewer({ data }: { data: unknown }) {
  const html = useMemo(() => renderFromData(data), [data]);
  return <iframe srcDoc={html} sandbox="allow-scripts" style={{ width: '100%', border: 'none' }} />;
}
```

### 导出 MCP 服务器所有工具为静态 HTML

```typescript
import { MCPClient } from '@mcp-html-bridge/mcp-client';
import { renderFromSchema } from '@mcp-html-bridge/ui-engine';
import { writeFileSync, mkdirSync } from 'fs';

async function exportTools(cmd: string, dir: string) {
  mkdirSync(dir, { recursive: true });
  const client = new MCPClient();
  await client.connect({ command: cmd });
  for (const tool of await client.listTools()) {
    writeFileSync(`${dir}/${tool.name}.html`, renderFromSchema(tool.inputSchema, {
      toolName: tool.name,
      toolDescription: tool.description,
    }));
  }
  await client.disconnect();
}
```
