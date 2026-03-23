# MCP-HTML-Bridge

> Generic MCP GUI wrapper — render any MCP tool's JSON data as zero-dependency, self-contained HTML.

[![npm version](https://img.shields.io/npm/v/@mcp-html-bridge/ui-engine.svg)](https://www.npmjs.com/package/@mcp-html-bridge/ui-engine)
[![license](https://img.shields.io/github/license/zhongkai/mcp-html-bridge)](./LICENSE)

[中文](./README.md) | **English**

**Docs & Demo:** [https://zhongkai.github.io/mcp-html-bridge/](https://zhongkai.github.io/mcp-html-bridge/)

---

## Overview

MCP-HTML-Bridge is a universal rendering middleware for [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) tools. Feed it any JSON data or JSON Schema, and it produces a clean, interactive HTML page — **zero runtime dependencies**.

**Two rendering modes:**

1. **LLM-powered semantic rendering** — Send JSON to any LLM, let the model understand the data's meaning and produce the best HTML. The model decides how to render, not hardcoded patterns.

2. **Structural fallback** — When no LLM is configured, maps JSON shapes to HTML mechanically (tables, key-value pairs, collapsible sections). Zero external calls.

## Quick Start

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

## Configuration

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

## Features

- **LLM-Driven Semantic Rendering** — The model understands what the data means and renders accordingly. No pattern matching in code.
- **Any LLM Provider** — Anything with an OpenAI-compatible chat completions API
- **One-Time Config** — Set `config` once, every `render` call uses it automatically
- **Graceful Fallback** — LLM fails? Auto-degrades to structural rendering + error banner
- **Structural Mode** — `--no-llm` for zero-dependency, zero-network rendering
- **Dark Mode** — Automatic via `prefers-color-scheme`
- **Self-Contained** — Each HTML file is fully standalone
- **Bridge Protocol** — Bidirectional `postMessage` / `CustomEvent` for iframe embedding

## Usage

### As a Library

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

### CLI

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

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Any MCP Client                                 │
│                                                 │
│  ┌────────────┐    ┌──────────────────────┐     │
│  │ MCP Server │───>│ Tool Result (JSON)   │     │
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

## Packages

| Package | Description |
|---|---|
| [`@mcp-html-bridge/ui-engine`](https://www.npmjs.com/package/@mcp-html-bridge/ui-engine) | Core engine (LLM renderer + structural fallback) |
| [`@mcp-html-bridge/mcp-client`](https://www.npmjs.com/package/@mcp-html-bridge/mcp-client) | Lightweight MCP stdio client |
| [`@mcp-html-bridge/cli`](https://www.npmjs.com/package/@mcp-html-bridge/cli) | CLI adapter (`mcp-bridge` command) |
| [`@mcp-html-bridge/proxy`](https://www.npmjs.com/package/@mcp-html-bridge/proxy) | MCP proxy server |
| [`@mcp-html-bridge/claude-skill`](https://www.npmjs.com/package/@mcp-html-bridge/claude-skill) | Claude Code integration (`/mcp-render` skill) |

## Claude Code Integration

```bash
npx @mcp-html-bridge/claude-skill install
```

Then use `/mcp-render` in any Claude Code conversation to visualize MCP tool data.

For detailed documentation, visit the [docs site](https://zhongkai.github.io/mcp-html-bridge/).

## License

MIT
