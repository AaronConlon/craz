# Craz API 架构设计文档

## 概述

本文档描述了 Craz 项目的后端架构设计，基于 Cloudflare Workers 和 D1 数据库。该架构充分利用了 Cloudflare 平台的优势，包括全球边缘计算能力、内置数据库、KV 存储、安全防护和全球 CDN 网络。

## 目录

1. [数据模型设计](#数据模型设计)
2. [Workers 架构设计](#workers-架构设计)
3. [缓存策略](#缓存策略)
4. [元数据抓取服务](#元数据抓取服务)
5. [部署配置](#部署配置)
6. [安全考虑](#安全考虑)
7. [性能优化](#性能优化)
8. [监控和日志](#监控和日志)

## 数据模型设计

### D1 数据库表结构

```sql
-- 用户表
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at INTEGER NOT NULL, -- 使用 Unix timestamp
  updated_at INTEGER NOT NULL
);

-- 团队表
CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL,
  settings TEXT NOT NULL, -- JSON 字符串存储
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- 团队成员表
CREATE TABLE team_members (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  joined_at INTEGER NOT NULL,
  FOREIGN KEY (team_id) REFERENCES teams(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(team_id, user_id)
);

-- 书签表
CREATE TABLE bookmarks (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  parent_id TEXT,
  index INTEGER NOT NULL,
  date_added INTEGER NOT NULL,
  date_modified INTEGER NOT NULL,
  metadata TEXT NOT NULL, -- JSON 字符串存储
  user_id TEXT,
  team_id TEXT,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (parent_id) REFERENCES bookmarks(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (team_id) REFERENCES teams(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- 创建索引
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_team_id ON bookmarks(team_id);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
```

## Workers 架构设计

### 项目结构

```
src/
├── workers/
│   ├── auth.ts        // 认证相关 Worker
│   ├── bookmarks.ts   // 书签相关 Worker
│   ├── teams.ts       // 团队相关 Worker
│   └── metadata.ts    // 元数据抓取 Worker
├── lib/
│   ├── db.ts          // D1 数据库操作封装
│   ├── auth.ts        // 认证工具
│   ├── validation.ts  // 数据验证
│   └── types.ts       // 类型定义
└── utils/
    ├── response.ts    // 响应格式化
    └── error.ts       // 错误处理
```

### Worker 实现示例

```typescript
// src/workers/bookmarks.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt } from 'hono/jwt'
import { D1Database } from '@cloudflare/workers-types'
import { z } from 'zod'

interface Env {
  DB: D1Database
  JWT_SECRET: string
}

const app = new Hono<{ Bindings: Env }>()

// 中间件
app.use('*', cors())
app.use('*', jwt({
  secret: 'JWT_SECRET'
}))

// 路由
app.get('/api/bookmarks', async (c) => {
  const db = c.env.DB
  const userId = c.get('jwtPayload').sub
  
  const bookmarks = await db
    .prepare('SELECT * FROM bookmarks WHERE user_id = ?')
    .bind(userId)
    .all()
    
  return c.json(bookmarks)
})

export default app
```

## 缓存策略

使用 Cloudflare KV 进行缓存：

```typescript
// 缓存键设计
const CACHE_KEYS = {
  user: (userId: string) => `user:${userId}`,
  userBookmarks: (userId: string) => `user:${userId}:bookmarks`,
  teamBookmarks: (teamId: string) => `team:${teamId}:bookmarks`,
  pageMetadata: (url: string) => `metadata:${url}`
}

// 缓存时间
const CACHE_TTL = {
  user: 3600, // 1小时
  bookmarks: 300, // 5分钟
  metadata: 86400 // 24小时
}

// 缓存实现示例
async function getCachedBookmarks(userId: string, env: Env) {
  const cacheKey = CACHE_KEYS.userBookmarks(userId)
  const cached = await env.KV.get(cacheKey)
  
  if (cached) {
    return JSON.parse(cached)
  }
  
  const bookmarks = await env.DB
    .prepare('SELECT * FROM bookmarks WHERE user_id = ?')
    .bind(userId)
    .all()
    
  await env.KV.put(cacheKey, JSON.stringify(bookmarks), {
    expirationTtl: CACHE_TTL.bookmarks
  })
  
  return bookmarks
}
```

## 元数据抓取服务

```typescript
// src/workers/metadata.ts
import { Hono } from 'hono'
import { z } from 'zod'

const app = new Hono<{ Bindings: Env }>()

app.post('/api/metadata/fetch', async (c) => {
  const { url } = await c.req.json()
  
  // 使用 Cloudflare Workers 的 fetch API 获取页面内容
  const response = await fetch(url)
  const html = await response.text()
  
  // 解析元数据
  const metadata = await parseMetadata(html)
  
  // 缓存元数据
  await c.env.KV.put(
    CACHE_KEYS.pageMetadata(url),
    JSON.stringify(metadata),
    { expirationTtl: CACHE_TTL.metadata }
  )
  
  return c.json(metadata)
})

// 元数据解析函数
async function parseMetadata(html: string) {
  // 使用 cheerio 或其他库解析 HTML
  // 提取 og 标签、meta 标签等信息
  return {
    title: '',
    description: '',
    ogImage: '',
    // ...其他元数据
  }
}
```

## 部署配置

```toml
# wrangler.toml
name = "craz-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# D1 数据库配置
[[d1_databases]]
binding = "DB"
database_name = "craz-db"
database_id = "xxx"

# KV 命名空间配置
[[kv_namespaces]]
binding = "KV"
id = "xxx"
preview_id = "xxx"

# 环境变量
[vars]
JWT_SECRET = "your-secret-key"

# 路由配置
[routes]
pattern = "api.craz.com/*"
zone_id = "xxx"
```

## 安全考虑

1. 使用 Cloudflare 的 WAF 进行防护
2. 实现请求速率限制（使用 Cloudflare 的 Rate Limiting）
3. 使用 JWT 进行身份认证
4. 实现 CORS 策略
5. 使用 Cloudflare 的 SSL/TLS 加密

## 性能优化

1. 使用 D1 的索引优化查询性能
2. 合理使用 KV 缓存减少数据库查询
3. 利用 Cloudflare 的全球 CDN 网络
4. 使用 Workers 的流式响应处理大文件
5. 实现数据分页和懒加载

## 监控和日志

1. 使用 Cloudflare 的 Analytics 监控请求
2. 使用 Workers 的日志功能记录关键操作
3. 实现错误追踪和报告
4. 监控 Worker 的性能指标

## 优势

该架构设计充分利用了 Cloudflare 平台的优势：

1. 全球边缘计算能力
2. 内置的 D1 数据库
3. KV 存储用于缓存
4. 强大的安全防护
5. 全球 CDN 网络

## 注意事项

1. D1 数据库目前处于 beta 阶段，需要注意其限制和变化
2. Workers 有执行时间限制（CPU 时间）
3. KV 存储有大小限制
4. 需要合理设计缓存策略
5. 注意处理跨区域数据一致性问题
