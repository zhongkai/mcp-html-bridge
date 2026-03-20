# 百度优选电商搜索 Demo

基于 [MCP-HTML-Bridge](https://github.com/zhongkai/mcp-html-bridge) 渲染的百度优选电商搜索 Skill 演示。

参考：[百度优选开放平台](https://openai.baidu.com/)

## 模拟的 MCP 工具

| 工具名 | 能力 | 渲染模式 |
|---|---|---|
| `baidu_youxuan_search` | CPS 商品检索 | Schema → 表单 / Data → 商品表格 |
| `baidu_youxuan_compare` | 多商品参数对比 | Schema → 表单 / Data → 对比表格 |
| `baidu_youxuan_recommend` | 购买决策推荐 | Schema → 表单 / Data → 复合布局 |

## 生成的页面

| 文件 | 内容 |
|---|---|
| `index.html` | 导航首页 |
| `search-form.html` | 商品搜索输入表单 |
| `compare-form.html` | 商品对比输入表单 |
| `recommend-form.html` | 购买决策输入表单 |
| `search-result.html` | 搜索结果（8 款轻薄笔记本） |
| `compare-result.html` | 4 款笔记本参数对比表 |
| `recommend-result.html` | 大学生轻薄本购买推荐 |
| `dashboard.html` | 平台数据看板 |

## 运行

```bash
# 从项目根目录
npm install
npm run build

# 进入 demo 目录生成
cd demos/youxuan
node generate.js

# 预览
open output/index.html
```

## 数据说明

所有商品数据均为模拟数据，仅用于演示 MCP-HTML-Bridge 的渲染能力。
