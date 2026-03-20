/**
 * 百度优选电商搜索 Skill — 模拟 MCP 工具定义
 *
 * 参考 https://openai.baidu.com/
 * 百度优选为智能体提供 CPS 检索、参数对比与决策支持的一站式电商搜索能力。
 *
 * 以下 schema 基于官网描述 + 电商 MCP 通用实践推断。
 */

// ── 工具 1: 商品搜索 (CPS 检索) ──
export const searchProducts = {
  name: 'baidu_youxuan_search',
  description:
    '百度优选商品搜索 — 基于全域商品数据与知识图谱，按关键词、品类、价格区间检索 CPS 商品，返回佣金信息与商品详情。',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '搜索关键词，支持商品名、品牌、型号等',
      },
      category: {
        type: 'string',
        enum: [
          '手机数码',
          '电脑办公',
          '家用电器',
          '服饰鞋包',
          '美妆护肤',
          '食品生鲜',
          '家居家装',
          '母婴玩具',
          '运动户外',
          '图书文娱',
        ],
        description: '商品品类筛选',
      },
      priceMin: {
        type: 'number',
        minimum: 0,
        description: '最低价格（元）',
      },
      priceMax: {
        type: 'number',
        minimum: 0,
        description: '最高价格（元）',
      },
      sortBy: {
        type: 'string',
        enum: ['综合排序', '销量优先', '价格升序', '价格降序', '佣金比例'],
        description: '排序方式',
      },
      hasCoupon: {
        type: 'boolean',
        default: false,
        description: '仅显示有优惠券的商品',
      },
      page: {
        type: 'integer',
        minimum: 1,
        default: 1,
        description: '页码',
      },
      pageSize: {
        type: 'integer',
        minimum: 1,
        maximum: 50,
        default: 20,
        description: '每页数量',
      },
    },
    required: ['query'],
  },
};

// ── 工具 2: 商品参数对比 ──
export const compareProducts = {
  name: 'baidu_youxuan_compare',
  description:
    '百度优选商品对比 — 输入多个商品 ID，返回核心参数的结构化对比表，辅助用户决策。',
  inputSchema: {
    type: 'object',
    properties: {
      productIds: {
        type: 'array',
        items: { type: 'string' },
        description: '待对比的商品 ID 列表（2-5 个）',
        minItems: 2,
        maxItems: 5,
      },
      compareFields: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            '价格',
            '品牌',
            '评分',
            '销量',
            '佣金比例',
            '优惠券',
            '发货速度',
            '售后保障',
          ],
        },
        description: '指定对比维度（不传则返回全部维度）',
      },
    },
    required: ['productIds'],
  },
};

// ── 工具 3: 购买决策推荐 ──
export const getRecommendation = {
  name: 'baidu_youxuan_recommend',
  description:
    '百度优选购买决策 — 根据用户需求描述，结合知识图谱与商品数据，推荐最佳购买方案并给出理由。',
  inputSchema: {
    type: 'object',
    properties: {
      requirement: {
        type: 'string',
        description: '用户需求描述，例如"3000元以内适合大学生的轻薄笔记本"',
        maxLength: 500,
      },
      budget: {
        type: 'number',
        minimum: 0,
        description: '预算上限（元）',
      },
      priority: {
        type: 'string',
        enum: ['性价比', '品质优先', '品牌优先', '销量优先'],
        description: '决策偏好',
      },
      count: {
        type: 'integer',
        minimum: 1,
        maximum: 10,
        default: 3,
        description: '推荐数量',
      },
    },
    required: ['requirement'],
  },
};
