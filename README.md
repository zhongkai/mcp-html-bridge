# MCP-HTML-Bridge

> Generic MCP GUI wrapper — render any MCP tool's JSON data as zero-dependency, self-contained HTML.

[English](#english) | [中文](#中文)

---

<a id="english"></a>

## English

### Overview

MCP-HTML-Bridge is a universal rendering middleware for [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) tools. Feed it any JSON data or JSON Schema, and it produces a clean, interactive HTML page — **zero runtime dependencies, zero business logic**.

The core principle: **pure structural rendering**. No status badges, no price formatting, no regex-based field guessing. The renderer looks at JSON structure and maps it to HTML:

| JSON Shape | HTML Output |
|---|---|
| Array of objects | Sortable `<table>` with auto-detected columns |
| Flat object | Key-value pairs (`<dl>`) |
| Nested object | Collapsible `<details>` sections |
| Array of scalars | Bulleted `<ul>` list |
| Primitives | Typed `<span>` (number, boolean, null) |
| JSON Schema | Interactive form with smart widgets |

All formatting decisions are the caller's responsibility — whether that's an LLM, a CLI tool, or your own code.

### Features

- **Universal JSON → HTML** — One renderer for any data shape
- **Zero Business Logic** — No hardcoded patterns, no domain-specific formatting
- **Dark Mode** — Automatic via `prefers-color-scheme`
- **Bridge Protocol** — Bidirectional `postMessage` / `CustomEvent` for iframe embedding
- **Self-Contained** — Each HTML file is fully standalone (no CDN, no npm, no build step)
- **Claude-Independent** — Works with any LLM, any MCP client, or standalone
- **CLI Tool** — Render from command line with `mcp-html-skill render`
- **Proxy Mode** — Drop-in MCP proxy that enhances tool results with HTML

### Packages

| Package | Description |
|---|---|
| `@mcp-html-bridge/ui-engine` | Core rendering engine |
| `@mcp-html-bridge/mcp-client` | Lightweight MCP stdio client |
| `@mcp-html-bridge/cli` | CLI adapter (`mcp-bridge` command) |
| `@mcp-html-bridge/proxy` | MCP proxy server |
| `@mcp-html-bridge/claude-skill` | Claude Code integration (`/mcp-render` command) |

### Quick Start

```bash
# Install the rendering engine
npm install @mcp-html-bridge/ui-engine

# Or use the CLI to render JSON
echo '[{"name":"Alice","age":30},{"name":"Bob","age":25}]' | \
  npx @mcp-html-bridge/claude-skill render --data /dev/stdin --open
```

### Usage

#### As a Library

```typescript
import { renderFromData, renderFromSchema, renderJSON } from '@mcp-html-bridge/ui-engine';

// Full HTML document from any JSON data
const html = renderFromData(myData, {
  title: 'MCP Result',
});

// Form from JSON Schema
const formHtml = renderFromSchema(toolSchema, {
  toolName: 'search_products',
  toolDescription: 'Search the catalog',
});

// Just the HTML fragment (no document wrapper)
import { renderJSON } from '@mcp-html-bridge/ui-engine';
const fragment = renderJSON(myData);
```

#### CLI

```bash
# Render JSON data to HTML and open in browser
mcp-html-skill render --data result.json --title "My Result" --open

# Render to stdout for piping
mcp-html-skill render --data result.json --stdout

# Render a JSON Schema as a form
mcp-html-skill render --schema tool-schema.json --open

# Generate test output from mock datasets
npx @mcp-html-bridge/cli test-mock -o ./output
```

#### Proxy Mode

```bash
# Start a proxy that enhances MCP tool results with HTML
npx @mcp-html-bridge/proxy "npx -y @modelcontextprotocol/server-filesystem /tmp"
```

### Architecture

```
┌─────────────────────────────────────────────┐
│  Any MCP Client (Claude Code, other LLMs,   │
│  custom apps, scripts, etc.)                │
│                                             │
│  ┌────────────┐    ┌─────────────────────┐  │
│  │ MCP Server │───▶│ Tool Result (JSON)  │  │
│  └────────────┘    └──────────┬──────────┘  │
│                               │              │
│                ┌──────────────▼──────────┐   │
│                │ mcp-html-bridge         │   │
│                │ ┌──────────────────┐    │   │
│                │ │ JSON → HTML      │    │   │
│                │ │ (pure structural │    │   │
│                │ │  rendering)      │    │   │
│                │ └──────────────────┘    │   │
│                └──────────────┬──────────┘   │
│                               │              │
│                /tmp/mcp-html-bridge/*.html    │
│                               │              │
│                        open ──┘              │
└───────────────────────┬──────────────────────┘
                        ▼
                  ┌───────────┐
                  │  Browser  │
                  └───────────┘
```

### Example: Baidu Youxuan E-Commerce MCP

[Baidu Youxuan](https://openai.baidu.com/) provides MCP tools for product search and comparison. Here's how to render its output:

```bash
# 1. Call MCP tool, save result
cat <<'EOF' > /tmp/youxuan-result.json
[
  { "dimension": "商品名称", "SKU-001": "联想小新 Pro 16", "SKU-002": "RedmiBook Pro 15" },
  { "dimension": "到手价",   "SKU-001": "¥4,699",          "SKU-002": "¥4,099" },
  { "dimension": "处理器",   "SKU-001": "R7-8845H",        "SKU-002": "i7-13700H" },
  { "dimension": "评分",     "SKU-001": "4.8",             "SKU-002": "4.7" }
]
EOF

# 2. Render — no business logic, just a sortable table
mcp-html-skill render \
  --data /tmp/youxuan-result.json \
  --title "笔记本参数对比" \
  --open
```

The rendered HTML shows a sortable comparison table with the raw data — no price formatting, no status badges, no assumptions about what the values mean.

### Claude Code Integration

If you use Claude Code, install the `/mcp-render` skill:

```bash
npx @mcp-html-bridge/claude-skill install
```

Then use `/mcp-render` in any Claude Code conversation to let Claude render MCP tool results as HTML pages.

### Delivery Modes

| Mode | Flag | Use Case |
|---|---|---|
| **File + Browser** | `--open` | Writes HTML, opens in browser |
| **File only** | _(none)_ | Writes HTML, prints path |
| **Stdout** | `--stdout` | Prints raw HTML for piping or embedding |

### Development

```bash
npm install
npm run build
node packages/adapter-cli/dist/index.js test-mock -o ./mcp-html-output
```

### License

MIT

---

<a id="中文"></a>

## 中文

### 概述

MCP-HTML-Bridge 是一个通用的 [MCP（Model Context Protocol）](https://modelcontextprotocol.io/) GUI 包装器。输入任意 JSON 数据或 JSON Schema，输出干净的交互式 HTML 页面 — **零运行时依赖，零业务逻辑**。

核心原则：**纯结构化渲染**。没有状态标签、没有价格格式化、没有基于正则的字段猜测。渲染器只看 JSON 结构，映射为 HTML：

| JSON 形状 | HTML 输出 |
|---|---|
| 对象数组 | 可排序 `<table>`，自动识别列 |
| 扁平对象 | 键值对 (`<dl>`) |
| 嵌套对象 | 可折叠 `<details>` 区块 |
| 标量数组 | `<ul>` 列表 |
| 基础类型 | 带类型的 `<span>`（数字、布尔、null） |
| JSON Schema | 交互式表单 |

所有格式化决策由调用方负责 — 无论是 LLM、CLI 工具还是你自己的代码。

### 特性

- **通用 JSON → HTML** — 一个渲染器适配任意数据形状
- **零业务逻辑** — 没有硬编码模式、没有领域特定格式化
- **暗色模式** — 通过 `prefers-color-scheme` 自动切换
- **Bridge 通信协议** — 双向 `postMessage` / `CustomEvent`，支持 iframe 嵌入
- **完全自包含** — 每个 HTML 文件独立运行（无 CDN、无 npm、无构建步骤）
- **与 Claude 无关** — 适用于任何 LLM、任何 MCP 客户端，或独立使用
- **CLI 工具** — 命令行渲染 `mcp-html-skill render`
- **代理模式** — 透明代理 MCP 服务器，自动增强返回结果

### 包列表

| 包名 | 描述 |
|---|---|
| `@mcp-html-bridge/ui-engine` | 核心渲染引擎 |
| `@mcp-html-bridge/mcp-client` | 轻量级 MCP stdio 客户端 |
| `@mcp-html-bridge/cli` | CLI 适配器 |
| `@mcp-html-bridge/proxy` | MCP 代理服务器 |
| `@mcp-html-bridge/claude-skill` | Claude Code 集成（`/mcp-render` 命令） |

### 快速开始

```bash
# 安装渲染引擎
npm install @mcp-html-bridge/ui-engine

# 或用 CLI 渲染 JSON
echo '[{"name":"Alice","age":30},{"name":"Bob","age":25}]' | \
  npx @mcp-html-bridge/claude-skill render --data /dev/stdin --open
```

### 作为库使用

```typescript
import { renderFromData, renderFromSchema, renderJSON } from '@mcp-html-bridge/ui-engine';

// 从任意 JSON 数据生成完整 HTML 文档
const html = renderFromData(myData, { title: 'MCP 结果' });

// 从 JSON Schema 生成表单
const formHtml = renderFromSchema(toolSchema, {
  toolName: 'search_products',
  toolDescription: '搜索商品目录',
});

// 仅生成 HTML 片段（不含文档包装）
const fragment = renderJSON(myData);
```

### 示例：百度优选电商 MCP

[百度优选](https://openai.baidu.com/) 提供了商品检索和对比的 MCP 工具。以下演示如何渲染其输出：

```bash
# 1. 将 MCP 工具结果保存为文件
cat <<'EOF' > /tmp/youxuan-result.json
[
  { "dimension": "商品名称", "SKU-001": "联想小新 Pro 16", "SKU-002": "RedmiBook Pro 15" },
  { "dimension": "到手价",   "SKU-001": "¥4,699",          "SKU-002": "¥4,099" },
  { "dimension": "处理器",   "SKU-001": "R7-8845H",        "SKU-002": "i7-13700H" },
  { "dimension": "评分",     "SKU-001": "4.8",             "SKU-002": "4.7" }
]
EOF

# 2. 渲染 — 纯结构化，原样展示数据
mcp-html-skill render \
  --data /tmp/youxuan-result.json \
  --title "笔记本参数对比" \
  --open
```

渲染出的 HTML 是一个可排序的对比表格，原样展示数据 — 没有价格格式化，没有状态标签，不对数据含义做任何假设。

### Claude Code 集成

如果你使用 Claude Code，可以安装 `/mcp-render` 技能：

```bash
npx @mcp-html-bridge/claude-skill install
```

然后在任意 Claude Code 对话中使用 `/mcp-render`，让 Claude 将 MCP 工具结果渲染为 HTML 页面。

### 架构

```
┌─────────────────────────────────────────────┐
│  任意 MCP 客户端（Claude Code、其他 LLM、     │
│  自定义应用、脚本等）                          │
│                                             │
│  ┌────────────┐    ┌─────────────────────┐  │
│  │ MCP 服务器  │───▶│ 工具返回 (JSON)     │  │
│  └────────────┘    └──────────┬──────────┘  │
│                               │              │
│                ┌──────────────▼──────────┐   │
│                │ mcp-html-bridge         │   │
│                │ ┌──────────────────┐    │   │
│                │ │ JSON → HTML      │    │   │
│                │ │ (纯结构化渲染)    │    │   │
│                │ └──────────────────┘    │   │
│                └──────────────┬──────────┘   │
│                               │              │
│                /tmp/mcp-html-bridge/*.html    │
│                               │              │
│                        open ──┘              │
└───────────────────────┬──────────────────────┘
                        ▼
                  ┌───────────┐
                  │   浏览器   │
                  └───────────┘
```

### 交付模式

| 模式 | 参数 | 场景 |
|---|---|---|
| **文件 + 浏览器** | `--open` | 写入 HTML，自动打开浏览器 |
| **仅文件** | 无参数 | 写入 HTML，输出路径 |
| **标准输出** | `--stdout` | 输出原始 HTML，用于管道传输或嵌入 |

### 开发

```bash
npm install
npm run build
node packages/adapter-cli/dist/index.js test-mock -o ./mcp-html-output
```

### 许可证

MIT
