# MCP-HTML-Bridge

> Generic MCP GUI wrapper — render any MCP tool's JSON data as zero-dependency, self-contained HTML.

[English](#english) | [中文](#中文)

---

<a id="english"></a>

## English

### Overview

MCP-HTML-Bridge is a universal rendering middleware for [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) tools. Feed it any JSON data or JSON Schema, and it produces a clean, interactive HTML page — **zero runtime dependencies**.

**Two rendering modes:**

1. **LLM-powered semantic rendering** — Send JSON to any LLM, let the model understand the data's meaning and produce the best HTML. The model decides how to render, not hardcoded patterns.

2. **Structural fallback** — When no LLM is configured, maps JSON shapes to HTML mechanically (tables, key-value pairs, collapsible sections). Zero external calls.

### Quick Start

```bash
# 1. Configure your LLM once (any OpenAI-compatible API)
npx @mcp-html-bridge/claude-skill config \
  --api-url http://localhost:11434/v1 \
  --model qwen2

# 2. Render — LLM config is loaded automatically
echo '{"logo":"<svg>...</svg>","readme":"# Hello\n**world**"}' > /tmp/data.json
npx @mcp-html-bridge/claude-skill render --data /tmp/data.json --open

# Or skip LLM, use structural rendering
npx @mcp-html-bridge/claude-skill render --data /tmp/data.json --no-llm --open
```

### Configuration

```bash
# Set up LLM provider — saved to ~/.mcp-html-bridge/config.json
mcp-html-skill config --api-url <url> --model <model> [--api-key <key>]

# View current config
mcp-html-skill config --show

# Clear config
mcp-html-skill config --clear
```

Config resolution priority: **CLI flags > env vars > config file > no LLM**

Env vars: `MCP_HTML_LLM_API_URL`, `MCP_HTML_LLM_API_KEY`, `MCP_HTML_LLM_MODEL`

**Examples:**

```bash
# Local Ollama
mcp-html-skill config --api-url http://localhost:11434/v1 --model qwen2

# DeepSeek
mcp-html-skill config --api-url https://api.deepseek.com/v1 --api-key sk-xxx --model deepseek-chat

# Baidu ERNIE
mcp-html-skill config --api-url https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop --api-key xxx --model ernie-4.0-8k

# Any OpenAI-compatible endpoint
mcp-html-skill config --api-url https://your-api.com/v1 --api-key xxx --model your-model
```

### Features

- **LLM-Driven Semantic Rendering** — The model understands what the data means and renders accordingly. No pattern matching in code.
- **Any LLM Provider** — Anything with an OpenAI-compatible chat completions API
- **One-Time Config** — Set `config` once, every `render` call uses it automatically
- **Graceful Fallback** — LLM fails? Auto-degrades to structural rendering + error banner
- **Structural Mode** — `--no-llm` for zero-dependency, zero-network rendering
- **Dark Mode** — Automatic via `prefers-color-scheme`
- **Self-Contained** — Each HTML file is fully standalone
- **Bridge Protocol** — Bidirectional `postMessage` / `CustomEvent` for iframe embedding

### Usage

#### As a Library

```typescript
import { renderFromData, renderFromDataSync } from '@mcp-html-bridge/ui-engine';

// LLM-powered semantic rendering
const html = await renderFromData(data, {
  title: 'Result',
  llm: {
    apiUrl: 'http://localhost:11434/v1',
    model: 'qwen2',
  },
});

// Structural rendering (sync, no network)
const html = renderFromDataSync(data, { title: 'Result' });
```

#### CLI

```bash
# Render with LLM (auto-loads config)
mcp-html-skill render --data result.json --open

# Override LLM for this call
mcp-html-skill render --data result.json --api-url http://localhost:11434/v1 --model llama3 --open

# Force structural, no LLM
mcp-html-skill render --data result.json --no-llm --open

# Schema → interactive form
mcp-html-skill render --schema tool-schema.json --open

# Stdout mode
mcp-html-skill render --data result.json --stdout
```

### Architecture

```
┌─────────────────────────────────────────────────┐
│  Any MCP Client                                 │
│                                                 │
│  ┌────────────┐    ┌──────────────────────┐     │
│  │ MCP Server │───▶│ Tool Result (JSON)   │     │
│  └────────────┘    └──────────┬───────────┘     │
│                               │                  │
│                ┌──────────────▼──────────────┐   │
│                │  mcp-html-bridge             │   │
│                │                              │   │
│                │  ~/.mcp-html-bridge/config   │   │
│                │  ┌─ LLM configured? ──────┐  │   │
│                │  │ YES → JSON + prompt     │  │   │
│                │  │       → LLM API         │  │   │
│                │  │       → semantic HTML   │  │   │
│                │  │                        │  │   │
│                │  │ NO  → structural render │  │   │
│                │  │       → shape-based HTML│  │   │
│                │  └────────────────────────┘  │   │
│                │                              │   │
│                │  Wrap with theme + bridge JS  │   │
│                └──────────────┬──────────────┘   │
│                               ▼                  │
│                 /tmp/mcp-html-bridge/*.html       │
└──────────────────────────────────────────────────┘
```

### Packages

| Package | Description |
|---|---|
| `@mcp-html-bridge/ui-engine` | Core engine (LLM renderer + structural fallback) |
| `@mcp-html-bridge/mcp-client` | Lightweight MCP stdio client |
| `@mcp-html-bridge/cli` | CLI adapter (`mcp-bridge` command) |
| `@mcp-html-bridge/proxy` | MCP proxy server |
| `@mcp-html-bridge/claude-skill` | Claude Code integration (`/mcp-render`) |

### Claude Code Integration

```bash
npx @mcp-html-bridge/claude-skill install
```

Then use `/mcp-render` in any Claude Code conversation.

### License

MIT

---

<a id="中文"></a>

## 中文

### 概述

MCP-HTML-Bridge 是一个通用的 [MCP](https://modelcontextprotocol.io/) GUI 包装器。输入任意 JSON，输出交互式 HTML —— **零运行时依赖**。

**两种渲染模式：**

1. **LLM 语义渲染** — 把 JSON 发给模型，让模型理解数据含义，自己决定怎么渲染。代码里不做任何模式匹配。
2. **结构化兜底** — 没配 LLM 时，按 JSON 形状机械映射。无网络调用。

### 快速开始

```bash
# 1. 配置一次 LLM（任何 OpenAI 兼容 API）
npx @mcp-html-bridge/claude-skill config \
  --api-url http://localhost:11434/v1 \
  --model qwen2

# 2. 渲染 —— 自动读取配置
echo '{"logo":"<svg>...</svg>","readme":"# Hello"}' > /tmp/data.json
npx @mcp-html-bridge/claude-skill render --data /tmp/data.json --open

# 跳过 LLM，纯结构化渲染
npx @mcp-html-bridge/claude-skill render --data /tmp/data.json --no-llm --open
```

### 配置

```bash
# 设置 LLM —— 保存到 ~/.mcp-html-bridge/config.json
mcp-html-skill config --api-url <url> --model <model> [--api-key <key>]

# 查看
mcp-html-skill config --show

# 清除
mcp-html-skill config --clear
```

优先级：**CLI 参数 > 环境变量 > 配置文件 > 无 LLM**

环境变量：`MCP_HTML_LLM_API_URL`, `MCP_HTML_LLM_API_KEY`, `MCP_HTML_LLM_MODEL`

**示例：**

```bash
# 本地 Ollama
mcp-html-skill config --api-url http://localhost:11434/v1 --model qwen2

# DeepSeek
mcp-html-skill config --api-url https://api.deepseek.com/v1 --api-key sk-xxx --model deepseek-chat

# 百度文心
mcp-html-skill config --api-url https://aip.baidubce.com/rpc/2.0/... --api-key xxx --model ernie-4.0-8k
```

### 特性

- **LLM 驱动** — 模型理解数据语义，自行决定渲染方式。代码里零模式匹配。
- **任意 LLM** — 支持任何 OpenAI 兼容 API
- **一次配置** — `config` 设一次，`render` 自动使用
- **优雅降级** — LLM 挂了自动退回结构化渲染 + 错误提示
- **结构化模式** — `--no-llm` 零网络依赖渲染
- **暗色模式** — 自动跟随系统
- **完全自包含** — 每个 HTML 独立运行

### 作为库使用

```typescript
import { renderFromData, renderFromDataSync } from '@mcp-html-bridge/ui-engine';

// LLM 语义渲染
const html = await renderFromData(data, {
  title: '结果',
  llm: { apiUrl: 'http://localhost:11434/v1', model: 'qwen2' },
});

// 结构化渲染（同步，无网络）
const html = renderFromDataSync(data, { title: '结果' });
```

### 架构

```
JSON 数据
  │
  ├─ 配置了 LLM → JSON + prompt → 模型 → 语义 HTML
  │
  └─ 没配 LLM   → JSON 形状 → 结构化 HTML
  │
  ▼
theme CSS + bridge JS 包装 → 自包含 HTML 文件
```

### 许可证

MIT
