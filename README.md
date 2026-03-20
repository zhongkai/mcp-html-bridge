# MCP-HTML-Bridge

> Universal MCP rendering middleware — transform any MCP tool's schema or return data into zero-dependency, self-contained HTML UI.

[English](#english) | [中文](#中文)

---

<a id="english"></a>

## English

### Overview

MCP-HTML-Bridge is a TypeScript monorepo that takes any [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) tool's JSON Schema or result data and automatically generates beautiful, interactive HTML pages — **with zero runtime dependencies**.

It features:

- **Smart Data Sniffing** — Confidence-scored heuristic engine that auto-detects the best rendering strategy (data grid, metrics cards, JSON tree, reading block, form, or composite layout)
- **6 Built-in Renderers** — Form, sortable data grid, collapsible JSON tree, reading block, KPI metrics cards, and composite multi-section layout
- **Dark Mode** — Automatic via `prefers-color-scheme` with CSS variables
- **Bridge Protocol** — Bidirectional `postMessage` / `CustomEvent` communication for iframe embedding
- **Debug Playground** — Optional floating panel with LLM config, console logging, and JSON injection
- **CLI Tool** — `mcp-bridge compile` to connect to any MCP server and generate UI, `mcp-bridge test-mock` for demo output
- **Proxy Mode** — Drop-in MCP proxy that intercepts tool results and appends rendered HTML

### Packages

| Package | Description |
|---|---|
| `@mcp-html-bridge/ui-engine` | Core rendering engine |
| `@mcp-html-bridge/mcp-client` | Lightweight MCP stdio client |
| `@mcp-html-bridge/cli` | CLI adapter (`mcp-bridge` command) |
| `@mcp-html-bridge/proxy` | MCP proxy server |

### Quick Start

```bash
# Install
npm install @mcp-html-bridge/ui-engine

# Or use the CLI
npx @mcp-html-bridge/cli test-mock -o ./output -d
```

### Usage

#### As a Library

```typescript
import { render, renderFromData, renderFromSchema } from '@mcp-html-bridge/ui-engine';

// Render from tool result data (auto-detects best layout)
const html = renderFromData(myData, {
  title: 'Dashboard',
  debug: true,  // enable playground panel
});

// Render a form from JSON Schema
const formHtml = renderFromSchema(toolSchema, {
  toolName: 'search_products',
  toolDescription: 'Search the catalog',
});

// Unified API
const output = render({
  mode: 'data',
  data: myData,
  toolName: 'get_inventory',
}, { darkMode: true });
```

#### CLI

```bash
# Generate HTML from built-in mock datasets
mcp-bridge test-mock -o ./output --debug

# Connect to an MCP server and generate SKILL.md
mcp-bridge compile "npx -y @modelcontextprotocol/server-filesystem /tmp" -o SKILL.md
```

#### Proxy Mode

```bash
# Start a proxy that enhances MCP tool results with HTML
npx @mcp-html-bridge/proxy "npx -y @modelcontextprotocol/server-filesystem /tmp"
```

### Data Sniffer

The engine automatically detects the best rendering strategy:

| Data Shape | Detected Intent | Renderer |
|---|---|---|
| Array of objects with consistent keys | `data-grid` | Sortable table with status badges |
| Flat object with numeric values | `metrics-card` | KPI card layout |
| Deeply nested structure (depth > 3) | `json-tree` | Collapsible syntax-highlighted tree |
| Long text strings or text-like keys | `reading-block` | Formatted text display |
| JSON Schema with properties | `form` | Interactive form with smart widgets |
| Mixed data types | `composite` | Multi-section layout |

### Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Generate test output
node packages/adapter-cli/dist/index.js test-mock -o ./mcp-html-output -d
```

### License

MIT

---

<a id="中文"></a>

## 中文

### 概述

MCP-HTML-Bridge 是一个 TypeScript monorepo 项目，能够将任何 [MCP（Model Context Protocol）](https://modelcontextprotocol.io/) 工具的 JSON Schema 或返回数据自动转换为精美的交互式 HTML 页面 — **零运行时依赖**。

核心特性：

- **智能数据嗅探** — 基于置信度评分的启发式引擎，自动检测最佳渲染策略（数据表格、指标卡片、JSON 树、阅读块、表单或复合布局）
- **6 种内置渲染器** — 表单、可排序数据表格、可折叠 JSON 树、阅读块、KPI 指标卡片、复合多区域布局
- **暗色模式** — 通过 `prefers-color-scheme` 自动切换，基于 CSS 变量
- **Bridge 通信协议** — 基于 `postMessage` / `CustomEvent` 的双向通信，支持 iframe 嵌入
- **调试面板** — 可选的浮动调试面板，支持 LLM 配置、控制台日志和 JSON 注入
- **CLI 工具** — `mcp-bridge compile` 连接任意 MCP 服务器并生成 UI，`mcp-bridge test-mock` 生成演示输出
- **代理模式** — 即插即用的 MCP 代理，拦截工具返回结果并附加渲染后的 HTML

### 包列表

| 包名 | 描述 |
|---|---|
| `@mcp-html-bridge/ui-engine` | 核心渲染引擎 |
| `@mcp-html-bridge/mcp-client` | 轻量级 MCP stdio 客户端 |
| `@mcp-html-bridge/cli` | CLI 适配器（`mcp-bridge` 命令） |
| `@mcp-html-bridge/proxy` | MCP 代理服务器 |

### 快速开始

```bash
# 安装
npm install @mcp-html-bridge/ui-engine

# 或使用 CLI
npx @mcp-html-bridge/cli test-mock -o ./output -d
```

### 使用方式

#### 作为库使用

```typescript
import { render, renderFromData, renderFromSchema } from '@mcp-html-bridge/ui-engine';

// 从工具返回数据渲染（自动检测最佳布局）
const html = renderFromData(myData, {
  title: '仪表盘',
  debug: true,  // 启用调试面板
});

// 从 JSON Schema 渲染表单
const formHtml = renderFromSchema(toolSchema, {
  toolName: 'search_products',
  toolDescription: '搜索商品目录',
});
```

#### CLI 命令

```bash
# 从内置 mock 数据集生成 HTML
mcp-bridge test-mock -o ./output --debug

# 连接 MCP 服务器并生成 SKILL.md
mcp-bridge compile "npx -y @modelcontextprotocol/server-filesystem /tmp" -o SKILL.md
```

#### 代理模式

```bash
# 启动代理，增强 MCP 工具返回结果
npx @mcp-html-bridge/proxy "npx -y @modelcontextprotocol/server-filesystem /tmp"
```

### 数据嗅探器

引擎自动检测最佳渲染策略：

| 数据形状 | 检测意图 | 渲染器 |
|---|---|---|
| 具有一致键的对象数组 | `data-grid` | 可排序表格（含状态标签） |
| 包含数值的扁平对象 | `metrics-card` | KPI 卡片布局 |
| 深层嵌套结构（深度 > 3） | `json-tree` | 可折叠语法高亮树 |
| 长文本字符串或文本类键 | `reading-block` | 格式化文本展示 |
| 带 properties 的 JSON Schema | `form` | 交互式智能表单 |
| 混合数据类型 | `composite` | 多区域复合布局 |

### 开发

```bash
# 安装依赖
npm install

# 构建所有包
npm run build

# 生成测试输出
node packages/adapter-cli/dist/index.js test-mock -o ./mcp-html-output -d
```

### 许可证

MIT
