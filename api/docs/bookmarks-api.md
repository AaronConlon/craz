# Craz 书签与历史记录 API 文档

## 概述

本文档描述了 Craz 项目的完整 API，包括：

1. **书签管理 API** - 个人书签和团队书签的完整管理功能
2. **Chrome 历史记录 API** - 用户浏览历史的存储、查询和分析功能

所有 API 都需要 JWT 认证，并严格按用户进行数据隔离。Chrome 历史记录 API 采用原始的 Chrome History 数据格式，支持高效的时间戳索引、全文搜索，并通过优化的 D1 数据库查询来降低响应时间。

## 个人书签 API

### 获取个人书签列表

```http
GET /api/bookmarks
```

**响应**

```json
[
  {
    "id": "string",
    "url": "string | null",
    "title": "string",
    "parentId": "string | null",
    "sortOrder": number,
    "dateAdded": number,
    "dateModified": number,
    "metadata": object,
    "userId": "string",
    "createdBy": "string",
    "updatedBy": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
]
```

### 创建个人书签

```http
POST /api/bookmarks
```

**请求体**

```json
{
  "url": "string | null",
  "title": "string",
  "parentId": "string | null",
  "sortOrder": number,
  "metadata": object
}
```

**响应**

```json
{
  "success": true,
  "id": "string"
}
```

### 更新个人书签

```http
PUT /api/bookmarks/:id
```

**请求体**

```json
{
  "url": "string | null",
  "title": "string",
  "parentId": "string | null",
  "sortOrder": number,
  "metadata": object
}
```

**响应**

```json
{
  "success": true,
  "affected": number
}
```

### 删除个人书签

```http
DELETE /api/bookmarks/:id
```

**响应**

```json
{
  "success": true,
  "affected": number
}
```

## 团队书签 API

### 获取团队书签列表

```http
GET /api/teams/:teamId/bookmarks
```

**响应**

```json
[
  {
    "id": "string",
    "url": "string | null",
    "title": "string",
    "parentId": "string | null",
    "sortOrder": number,
    "dateAdded": number,
    "dateModified": number,
    "metadata": object,
    "teamId": "string",
    "createdBy": "string",
    "updatedBy": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
]
```

### 创建团队书签

```http
POST /api/teams/:teamId/bookmarks
```

**请求体**

```json
{
  "url": "string | null",
  "title": "string",
  "parentId": "string | null",
  "sortOrder": number,
  "metadata": object,
  "teamId": "string"
}
```

**响应**

```json
{
  "success": true,
  "id": "string"
}
```

### 更新团队书签

```http
PUT /api/teams/:teamId/bookmarks/:id
```

**请求体**

```json
{
  "url": "string | null",
  "title": "string",
  "parentId": "string | null",
  "sortOrder": number,
  "metadata": object,
  "teamId": "string"
}
```

**响应**

```json
{
  "success": true,
  "affected": number
}
```

### 删除团队书签

```http
DELETE /api/teams/:teamId/bookmarks/:id
```

**响应**

```json
{
  "success": true,
  "affected": number
}
```

## Chrome 历史记录 API

### 概述

Chrome 历史记录 API 提供用户浏览历史的存储和查询功能。采用 Chrome History API 的原始数据格式，支持高效的时间戳索引和全文搜索，通过优化的 D1 查询减少响应时间。

### 获取历史记录列表

```http
GET /api/history
```

**查询参数**

```
text?: string          // 搜索关键词，支持标题和URL搜索
startTime?: number     // 开始时间戳 (毫秒)
endTime?: number       // 结束时间戳 (毫秒)
maxResults?: number    // 最大返回数量，默认100，最大1000
offset?: number        // 分页偏移量，默认0
order?: "asc" | "desc" // 时间排序，默认desc
```

**响应**

```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "url": "string",
      "title": "string",
      "lastVisitTime": number,
      "visitCount": number,
      "typedCount": number,
      "userId": "string",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "pagination": {
    "total": number,
    "offset": number,
    "limit": number,
    "hasMore": boolean
  }
}
```

### 获取单个历史记录

```http
GET /api/history/:id
```

**响应**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "url": "string",
    "title": "string",
    "lastVisitTime": number,
    "visitCount": number,
    "typedCount": number,
    "userId": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

### 批量添加历史记录

```http
POST /api/history/batch
```

**请求体**

```json
{
  "items": [
    {
      "url": "string",
      "title": "string",
      "lastVisitTime": number,
      "visitCount": number,
      "typedCount": number
    }
  ]
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "created": number,
    "updated": number,
    "total": number
  }
}
```

### 添加单个历史记录

```http
POST /api/history
```

**请求体**

```json
{
  "url": "string",
  "title": "string",
  "lastVisitTime": number,
  "visitCount": number,
  "typedCount": number
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "id": "string"
  }
}
```

### 更新历史记录

```http
PUT /api/history/:id
```

**请求体**

```json
{
  "title": "string",
  "lastVisitTime": number,
  "visitCount": number,
  "typedCount": number
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "affected": number
  }
}
```

### 删除历史记录

```http
DELETE /api/history/:id
```

**响应**

```json
{
  "success": true,
  "data": {
    "affected": number
  }
}
```

### 批量删除历史记录

```http
DELETE /api/history/batch
```

**请求体**

```json
{
  "ids": ["string"],
  "urlPattern": "string",     // 可选：按URL模式删除
  "startTime": number,        // 可选：按时间范围删除
  "endTime": number          // 可选：按时间范围删除
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "affected": number
  }
}
```

### 搜索历史记录

```http
POST /api/history/search
```

**请求体**

```json
{
  "query": "string",          // 搜索关键词
  "maxResults": number,       // 最大结果数，默认50
  "startTime": number,        // 可选：开始时间
  "endTime": number,          // 可选：结束时间
  "searchFields": ["title", "url"] // 搜索字段，默认both
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "string",
        "url": "string",
        "title": "string",
        "lastVisitTime": number,
        "visitCount": number,
        "typedCount": number,
        "relevanceScore": number
      }
    ],
    "total": number,
    "searchTime": number
  }
}
```

### 获取访问统计

```http
GET /api/history/stats
```

**查询参数**

```
period?: "day" | "week" | "month" | "year"  // 统计周期，默认week
startTime?: number                          // 开始时间戳
endTime?: number                           // 结束时间戳
```

**响应**

```json
{
  "success": true,
  "data": {
    "totalVisits": number,
    "uniqueUrls": number,
    "topDomains": [
      {
        "domain": "string",
        "visitCount": number,
        "percentage": number
      }
    ],
    "dailyStats": [
      {
        "date": "string",
        "visits": number,
        "uniqueUrls": number
      }
    ]
  }
}
```

### 清空历史记录

```http
DELETE /api/history/clear
```

**请求体**

```json
{
  "confirm": true,           // 必须为true确认清空
  "startTime": number,       // 可选：只清空指定时间范围
  "endTime": number         // 可选：只清空指定时间范围
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "affected": number
  }
}
```

## 错误响应

所有 API 在发生错误时都会返回以下格式：

```json
{
  "error": "错误信息"
}
```

常见错误状态码：

- 400: 请求参数错误
- 401: 未认证
- 403: 无权限
- 404: 资源不存在
- 500: 服务器错误

## 权限说明

### 个人书签

- 用户可以完全管理自己的书签（创建、读取、更新、删除）

### 团队书签

- 团队成员可以查看团队书签
- 团队管理员和所有者可以管理团队书签
- 普通成员需要团队设置 `allowMemberEdit` 为 `true` 才能管理书签

### Chrome 历史记录

- 用户只能访问和管理自己的历史记录
- 所有历史记录操作都需要有效的JWT认证
- 历史记录数据严格按用户隔离，无法访问其他用户数据
- 批量操作有频率限制（每分钟最多100次操作）
- 搜索操作有复杂度限制（防止过于复杂的查询影响性能）

## 数据结构

### 书签对象

```typescript
interface Bookmark {
  id: string;
  url: string | null;
  title: string;
  parentId: string | null;
  sortOrder: number;
  dateAdded: number;
  dateModified: number;
  metadata: {
    keywords?: string[];
    description?: string;
    ogImage?: string;
    ogTitle?: string;
    ogDescription?: string;
    favicon?: string;
  };
  userId?: string;
  teamId?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}
```

### 团队设置

```typescript
interface TeamSettings {
  allowMemberEdit: boolean;
  allowMemberInvite: boolean;
}
```

### Chrome 历史记录对象

```typescript
interface HistoryItem {
  id: string;                // 唯一标识符
  url: string;               // 页面URL
  title: string;             // 页面标题
  lastVisitTime: number;     // 最后访问时间戳 (毫秒)
  visitCount: number;        // 访问次数
  typedCount: number;        // 直接输入URL的次数
  userId: string;            // 用户ID
  createdAt: string;         // 创建时间 (ISO字符串)
  updatedAt: string;         // 更新时间 (ISO字符串)
}
```

### 历史记录搜索结果

```typescript
interface HistorySearchResult extends HistoryItem {
  relevanceScore: number;    // 搜索相关性评分 (0-1)
}
```

### 历史记录统计

```typescript
interface HistoryStats {
  totalVisits: number;
  uniqueUrls: number;
  topDomains: Array<{
    domain: string;
    visitCount: number;
    percentage: number;
  }>;
  dailyStats: Array<{
    date: string;           // YYYY-MM-DD 格式
    visits: number;
    uniqueUrls: number;
  }>;
}
```

## 性能优化说明

### Chrome 历史记录 API 优化策略

1. **索引优化**
   - 主键索引：`id` (PRIMARY KEY)
   - 时间索引：`lastVisitTime` (DESC, 支持时间范围查询)
   - 用户索引：`userId` (支持用户数据隔离)
   - 复合索引：`(userId, lastVisitTime)` (优化用户历史查询)
   - URL索引：`url` (支持URL精确查询和去重)

2. **查询优化**
   - 使用 `LIMIT` 和 `OFFSET` 进行分页
   - 时间范围查询使用索引优化
   - 全文搜索使用 SQLite FTS5 扩展
   - 批量操作使用事务减少请求次数

3. **缓存策略**
   - 热点数据缓存（最近7天的历史记录）
   - 统计数据缓存（每小时更新）
   - 搜索结果缓存（30分钟TTL）

4. **数据库设计**

   ```sql
   CREATE TABLE history_items (
     id TEXT PRIMARY KEY,
     url TEXT NOT NULL,
     title TEXT NOT NULL,
     lastVisitTime INTEGER NOT NULL,
     visitCount INTEGER DEFAULT 1,
     typedCount INTEGER DEFAULT 0,
     userId TEXT NOT NULL,
     createdAt TEXT NOT NULL,
     updatedAt TEXT NOT NULL,
     UNIQUE(userId, url)
   );
   
   -- 优化索引
   CREATE INDEX idx_history_user_time ON history_items(userId, lastVisitTime DESC);
   CREATE INDEX idx_history_url ON history_items(url);
   CREATE INDEX idx_history_time ON history_items(lastVisitTime DESC);
   
   -- FTS5 全文搜索表
   CREATE VIRTUAL TABLE history_fts USING fts5(
     url, title, content=history_items, content_rowid=rowid
   );
   ```
