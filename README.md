# MCP-HTML-Bridge

> 通用 MCP GUI 包装器 —— 把任意 MCP 工具的 JSON 数据渲染为零依赖、自包含的交互式 HTML。

[![npm version](https://img.shields.io/npm/v/@mcp-html-bridge/ui-engine.svg)](https://www.npmjs.com/package/@mcp-html-bridge/ui-engine)
[![license](https://img.shields.io/github/license/zhongkai/mcp-html-bridge)](./LICENSE)

[English](./README.en.md) | **中文**

**官网 & 文档：** [https://zhongkai.github.io/mcp-html-bridge/](https://zhongkai.github.io/mcp-html-bridge/)

---

## 概述

MCP-HTML-Bridge 是一个通用的 [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) 渲染中间件。输入任意 JSON 数据或 JSON Schema，输出交互式 HTML 页面 —— **零运行时依赖**。

**两种渲染模式：**

1. **LLM 语义渲染** — 把 JSON 发给大模型，让模型理解数据含义，自行决定最佳渲染方式。代码中不做任何模式匹配。
2. **结构化兜底** — 没配 LLM 时，按 JSON 形状机械映射（表格、键值对、可折叠区块等）。无网络调用。

## 快速开始

```bash
# 1. 配置一次 LLM（支持任何 OpenAI 兼容 API）
npx @mcp-html-bridge/claude-skill config \
  --api-url http://localhost:11434/v1 \
  --model qwen2

# 2. 渲染 —— 自动读取配置
echo '{"logo":"<svg>...</svg>","readme":"# Hello"}' > /tmp/data.json
npx @mcp-html-bridge/claude-skill render --data /tmp/data.json --open

# 跳过 LLM，纯结构化渲染
npx @mcp-html-bridge/claude-skill render --data /tmp/data.json --no-llm --open
```

## 配置

```bash
# 设置 LLM —— 保存到 ~/.mcp-html-bridge/config.json
mcp-html-skill config --api-url <url> --model <model> [--api-key <key>]

# 查看当前配置
mcp-html-skill config --show

# 清除配置
mcp-html-skill config --clear
```

优先级：**CLI 参数 > 环境变量 > 配置文件 > 无 LLM**

环境变量：`MCP_HTML_LLM_API_URL`、`MCP_HTML_LLM_API_KEY`、`MCP_HTML_LLM_MODEL`

**示例：**

```bash
# 本地 Ollama
mcp-html-skill config --api-url http://localhost:11434/v1 --model qwen2

# DeepSeek
mcp-html-skill config --api-url https://api.deepseek.com/v1 --api-key sk-xxx --model deepseek-chat

# 百度文心
mcp-html-skill config --api-url https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop --api-key xxx --model ernie-4.0-8k

# 任何 OpenAI 兼容端点
mcp-html-skill config --api-url https://your-api.com/v1 --api-key xxx --model your-model
```

## 特性

- **LLM 驱动** — 模型理解数据语义，自行决定渲染方式
- **任意 LLM** — 支持任何 OpenAI 兼容 chat completions API
- **一次配置** — `config` 设一次，`render` 自动使用
- **优雅降级** — LLM 失败自动退回结构化渲染 + 错误提示
- **结构化模式** — `--no-llm` 零网络依赖渲染
- **暗色模式** — 自动跟随系统 `prefers-color-scheme`
- **完全自包含** — 每个 HTML 文件独立运行，无外部依赖
- **Bridge 协议** — 双向 `postMessage` / `CustomEvent`，支持 iframe 嵌入

## 使用方式

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

### CLI

```bash
# LLM 渲染（自动读取配置）
mcp-html-skill render --data result.json --open

# 临时覆盖 LLM 配置
mcp-html-skill render --data result.json --api-url http://localhost:11434/v1 --model llama3 --open

# 纯结构化渲染
mcp-html-skill render --data result.json --no-llm --open

# JSON Schema → 交互式表单
mcp-html-skill render --schema tool-schema.json --open

# 输出到 stdout
mcp-html-skill render --data result.json --stdout
```

## 架构

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

## 包列表

| 包 | 说明 |
|---|---|
| [`@mcp-html-bridge/ui-engine`](https://www.npmjs.com/package/@mcp-html-bridge/ui-engine) | 核心渲染引擎（LLM 渲染 + 结构化兜底） |
| [`@mcp-html-bridge/mcp-client`](https://www.npmjs.com/package/@mcp-html-bridge/mcp-client) | 轻量 MCP stdio 客户端 |
| [`@mcp-html-bridge/cli`](https://www.npmjs.com/package/@mcp-html-bridge/cli) | CLI 适配器（`mcp-bridge` 命令） |
| [`@mcp-html-bridge/proxy`](https://www.npmjs.com/package/@mcp-html-bridge/proxy) | MCP 代理服务器 |
| [`@mcp-html-bridge/claude-skill`](https://www.npmjs.com/package/@mcp-html-bridge/claude-skill) | Claude Code 集成（`/mcp-render` 技能） |

## Claude Code 集成

```bash
npx @mcp-html-bridge/claude-skill install
```

安装后在 Claude Code 中使用 `/mcp-render` 即可可视化任意 MCP 工具数据。

详细文档请参阅 [官网](https://zhongkai.github.io/mcp-html-bridge/)。

## 许可证

MIT
