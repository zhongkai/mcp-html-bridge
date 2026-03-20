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
- **Claude Code Skill** — First-class `/mcp-render` command for Claude Code integration
- **CLI Tool** — `mcp-bridge compile` to connect to any MCP server and generate UI, `mcp-bridge test-mock` for demo output
- **Proxy Mode** — Drop-in MCP proxy that intercepts tool results and appends rendered HTML

### Packages

| Package | Description |
|---|---|
| `@mcp-html-bridge/ui-engine` | Core rendering engine |
| `@mcp-html-bridge/mcp-client` | Lightweight MCP stdio client |
| `@mcp-html-bridge/cli` | CLI adapter (`mcp-bridge` command) |
| `@mcp-html-bridge/proxy` | MCP proxy server |
| `@mcp-html-bridge/claude-skill` | Claude Code skill (`/mcp-render` command) |

### Quick Start

```bash
# Install the rendering engine
npm install @mcp-html-bridge/ui-engine

# Or use the CLI
npx @mcp-html-bridge/cli test-mock -o ./output -d

# Or install the Claude Code skill (see below)
npx @mcp-html-bridge/claude-skill install
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

### Claude Code Integration

MCP-HTML-Bridge provides a first-class Claude Code skill that lets you visualize any MCP tool result as a rich HTML page — directly from your Claude Code session.

#### Install the Skill

```bash
npx @mcp-html-bridge/claude-skill install
```

This copies the `/mcp-render` command to `~/.claude/commands/`. Once installed, you can use `/mcp-render` in any Claude Code conversation.

#### Real-World Example: Baidu Youxuan E-Commerce MCP

[Baidu Youxuan (百度优选)](https://openai.baidu.com/) provides MCP tools for CPS product search, parameter comparison, and purchase recommendations. Here's how to use MCP-HTML-Bridge to visualize its tool results in Claude Code.

**Step 1 — Configure the MCP server**

Add the Baidu Youxuan MCP server to your Claude Code MCP config:

```json
{
  "mcpServers": {
    "baidu-youxuan": {
      "command": "npx",
      "args": ["-y", "baidu-youxuan-mcp-server"],
      "env": {
        "YOUXUAN_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

**Step 2 — Call the MCP tool and render**

In Claude Code, ask Claude to compare products and visualize the result:

```
> Help me compare these laptops on Baidu Youxuan:
  联想小新 Pro 16, RedmiBook Pro 15, 华为 MateBook 14s, 荣耀 MagicBook X 16 Pro
  Then render the comparison as an HTML page I can open in my browser.
```

Claude will:

1. Call `baidu_youxuan_compare` with the product IDs
2. Receive structured comparison data:
   ```json
   [
     { "dimension": "商品名称", "SKU-001": "联想小新 Pro 16", "SKU-002": "RedmiBook Pro 15", ... },
     { "dimension": "到手价",   "SKU-001": "¥4,699",          "SKU-002": "¥4,099", ... },
     { "dimension": "处理器",   "SKU-001": "R7-8845H",        "SKU-002": "i7-13700H", ... },
     { "dimension": "评分",     "SKU-001": "4.8",             "SKU-002": "4.7", ... },
     { "dimension": "佣金比例", "SKU-001": "3.5%",            "SKU-002": "4.2%", ... }
   ]
   ```
3. Pipe it through MCP-HTML-Bridge:
   ```bash
   mcp-html-skill render --data /tmp/mcp-input.json \
     --title "笔记本参数对比 — 百度优选" \
     --tool-name "baidu_youxuan_compare" \
     --open
   ```
4. A self-contained HTML page opens in your browser — sortable comparison table with formatted prices, ratings, and commission badges. No server, no dependencies.

**Step 3 — Or use the slash command**

Type `/mcp-render` in Claude Code and Claude will guide you interactively.

#### Architecture

```
┌───────────────────────────────────────────────────┐
│  Claude Code                                      │
│                                                   │
│  User: "Compare these laptops, render as HTML"    │
│                                                   │
│  ┌────────────┐    ┌───────────────────────────┐  │
│  │ MCP Server │───▶│ Tool Result (JSON)        │  │
│  │ (Youxuan)  │    │ { comparison: [...] }     │  │
│  └────────────┘    └────────────┬──────────────┘  │
│                                 │                  │
│                  ┌──────────────▼──────────────┐   │
│                  │ mcp-html-skill render       │   │
│                  │ ┌────────────────────────┐  │   │
│                  │ │ Data Sniffer → Grid    │  │   │
│                  │ │ Theme + Bridge JS      │  │   │
│                  │ │ → Self-contained HTML  │  │   │
│                  │ └────────────────────────┘  │   │
│                  └──────────────┬──────────────┘   │
│                                 │                  │
│                  /tmp/mcp-html-bridge/*.html        │
│                                 │                  │
│                          open ──┘                  │
└─────────────────────────┬──────────────────────────┘
                          ▼
                    ┌───────────┐
                    │  Browser  │
                    └───────────┘
```

#### Delivery Modes

| Mode | Flag | Use Case |
|---|---|---|
| **File + Browser** | `--open` | Default. Writes HTML, opens in browser |
| **File only** | _(none)_ | Writes HTML, prints path |
| **Stdout** | `--stdout` | Prints raw HTML to stdout for piping or embedding |

Generated HTML is fully self-contained:
- Zero runtime dependencies — no CDN, no npm, no build step
- Dark mode follows system preference
- Sortable tables, collapsible trees, formatted metrics
- Optional debug playground for LLM API testing

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
npm install
npm run build
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

- **智能数据嗅探** — 基于置信度评分的启发式引擎，自动检测最佳渲染策略
- **6 种内置渲染器** — 表单、可排序数据表格、可折叠 JSON 树、阅读块、KPI 指标卡片、复合多区域布局
- **暗色模式** — 通过 `prefers-color-scheme` 自动切换
- **Bridge 通信协议** — 双向 `postMessage` / `CustomEvent` 通信
- **Claude Code 技能** — 一等公民的 `/mcp-render` 命令，与 Claude Code 深度集成
- **CLI 工具** — `mcp-bridge compile` 连接 MCP 服务器生成 UI
- **代理模式** — 拦截工具返回并附加渲染后的 HTML

### 包列表

| 包名 | 描述 |
|---|---|
| `@mcp-html-bridge/ui-engine` | 核心渲染引擎 |
| `@mcp-html-bridge/mcp-client` | 轻量级 MCP stdio 客户端 |
| `@mcp-html-bridge/cli` | CLI 适配器 |
| `@mcp-html-bridge/proxy` | MCP 代理服务器 |
| `@mcp-html-bridge/claude-skill` | Claude Code 技能（`/mcp-render` 命令） |

### 快速开始

```bash
# 安装渲染引擎
npm install @mcp-html-bridge/ui-engine

# 或使用 CLI
npx @mcp-html-bridge/cli test-mock -o ./output -d

# 或安装 Claude Code 技能（详见下方）
npx @mcp-html-bridge/claude-skill install
```

### 在 Claude Code 中使用

MCP-HTML-Bridge 提供了一等公民的 Claude Code 技能，让你在 Claude Code 对话中直接将任意 MCP 工具结果渲染为可视化 HTML 页面。

#### 安装技能

```bash
npx @mcp-html-bridge/claude-skill install
```

将 `/mcp-render` 命令安装到 `~/.claude/commands/`，安装后即可在任意 Claude Code 对话中使用。

#### 实战示例：百度优选电商 MCP 商品对比

[百度优选](https://openai.baidu.com/) 提供了 CPS 商品检索、参数对比和购买决策的 MCP 工具。以下演示如何在 Claude Code 中结合百度优选 MCP 和 MCP-HTML-Bridge 生成可视化 HTML。

**第一步 — 配置百度优选 MCP 服务器**

在 Claude Code MCP 配置中添加：

```json
{
  "mcpServers": {
    "baidu-youxuan": {
      "command": "npx",
      "args": ["-y", "baidu-youxuan-mcp-server"],
      "env": {
        "YOUXUAN_API_KEY": "<你的-API-密钥>"
      }
    }
  }
}
```

**第二步 — 让 Claude 调用工具并渲染**

在 Claude Code 中对话：

```
> 帮我在百度优选上对比这几款笔记本的参数：
  联想小新 Pro 16、RedmiBook Pro 15、华为 MateBook 14s、荣耀 MagicBook X 16 Pro
  然后渲染成可视化 HTML 页面打开。
```

Claude 会自动完成以下步骤：

1. 调用 `baidu_youxuan_compare` 工具，传入商品 ID 列表
2. 获取结构化对比数据（处理器、价格、评分、佣金等维度）
3. 将数据交给 MCP-HTML-Bridge 渲染：
   ```bash
   mcp-html-skill render --data /tmp/mcp-input.json \
     --title "笔记本参数对比 — 百度优选" \
     --tool-name "baidu_youxuan_compare" \
     --open
   ```
4. 浏览器自动打开：一个零依赖的 HTML 页面，包含可排序对比表、格式化价格和佣金标签

**第三步 — 或直接使用斜杠命令**

```
> /mcp-render
```

Claude 会引导你提供 JSON 数据并交互式渲染。

#### 工作流程

```
┌───────────────────────────────────────────────────┐
│  Claude Code                                      │
│                                                   │
│  用户: "对比这几款笔记本，渲染成 HTML"                  │
│                                                   │
│  ┌────────────┐    ┌───────────────────────────┐  │
│  │ MCP 服务器  │───▶│ 工具返回 (JSON)            │  │
│  │ (百度优选)   │    │ { comparison: [...] }     │  │
│  └────────────┘    └────────────┬──────────────┘  │
│                                 │                  │
│                  ┌──────────────▼──────────────┐   │
│                  │ mcp-html-skill render       │   │
│                  │ ┌────────────────────────┐  │   │
│                  │ │ 数据嗅探 → data-grid   │  │   │
│                  │ │ 主题 CSS + Bridge JS   │  │   │
│                  │ │ → 自包含 HTML          │  │   │
│                  │ └────────────────────────┘  │   │
│                  └──────────────┬──────────────┘   │
│                                 │                  │
│                  /tmp/mcp-html-bridge/*.html        │
│                                 │                  │
│                          open ──┘                  │
└─────────────────────────┬──────────────────────────┘
                          ▼
                    ┌───────────┐
                    │   浏览器   │
                    └───────────┘
```

#### 交付模式

| 模式 | 参数 | 场景 |
|---|---|---|
| **文件 + 浏览器** | `--open` | 默认。写入 HTML 到 `/tmp/`，自动打开浏览器 |
| **仅文件** | 无参数 | 写入 HTML，输出路径 |
| **标准输出** | `--stdout` | 输出原始 HTML，用于管道传输或嵌入回复流 |

生成的 HTML 完全自包含：
- 零运行时依赖（无 CDN、无 npm、无构建步骤）
- 暗色模式跟随系统偏好
- 可排序表格、可折叠树、格式化指标卡片
- 可选调试面板，支持 LLM API 中继

### 作为库使用

```typescript
import { render, renderFromData, renderFromSchema } from '@mcp-html-bridge/ui-engine';

const html = renderFromData(myData, {
  title: '仪表盘',
  debug: true,
});

const formHtml = renderFromSchema(toolSchema, {
  toolName: 'search_products',
  toolDescription: '搜索商品目录',
});
```

### 数据嗅探器

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
npm install
npm run build
node packages/adapter-cli/dist/index.js test-mock -o ./mcp-html-output -d
```

### 许可证

MIT
