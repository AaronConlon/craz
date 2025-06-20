# Craz API 客户端 - 完整参考文档

## 概述

Craz API 客户端是一个为 Chrome 扩展优化的 TypeScript API 库，提供了完整的书签、历史记录、认证和团队管理功能。

## 特性

- 🔒 **类型安全**: 100% TypeScript 覆盖，完整的类型检查
- 🌍 **环境配置**: 支持环境变量配置，自动适配开发/生产环境
- 🔄 **自动重试**: 内置智能重试机制
- 📦 **模块化**: 按功能模块划分，可按需使用
- 🚀 **现代化**: 基于 ky 的现代 HTTP 客户端
- 🔧 **Chrome 优化**: 专为 Chrome 扩展环境设计

## 快速开始

### 1. 环境配置

创建 `.env` 文件（开发环境）：

```env
PLASMO_PUBLIC_API_BASE_URL=http://localhost:8787
PLASMO_PUBLIC_API_TIMEOUT=30000
PLASMO_PUBLIC_API_RETRY_LIMIT=3
PLASMO_PUBLIC_ENABLE_API_LOGS=true
```

创建 `.env.prod` 文件（生产环境）：

```env
PLASMO_PUBLIC_API_BASE_URL=https://api.craz.com
PLASMO_PUBLIC_API_TIMEOUT=45000
PLASMO_PUBLIC_API_RETRY_LIMIT=5
PLASMO_PUBLIC_ENABLE_API_LOGS=false
```

### 2. 基本使用

```typescript
import { createCrazApiFromEnv } from '~/shared/api'

// 推荐：使用环境变量配置
const api = createCrazApiFromEnv('your-jwt-token')

// 或者手动配置
const api = createCrazApi({
  baseUrl: 'https://api.craz.com',
  token: 'your-jwt-token'
})
```

## API 模块

### 认证模块 (auth)

- `login(credentials)` - 用户登录
- `register(userData)` - 用户注册
- `logout()` - 用户登出
- `getCurrentUser()` - 获取当前用户信息
- `refreshToken()` - 刷新认证令牌
- `checkAuthStatus()` - 检查认证状态
- `updateUser(data)` - 更新用户信息
- `changePassword(data)` - 修改密码

### 书签模块 (bookmarks)

- `getBookmarks(options?)` - 获取书签列表
- `createBookmark(data)` - 创建书签
- `updateBookmark(id, data)` - 更新书签
- `deleteBookmark(id)` - 删除书签
- `getTeamBookmarks(teamId, options?)` - 获取团队书签
- `createTeamBookmark(teamId, data)` - 创建团队书签
- `updateTeamBookmark(id, data)` - 更新团队书签
- `deleteTeamBookmark(id)` - 删除团队书签
- `findBookmarkByUrl(url)` - 根据 URL 查找书签
- `batchCreateBookmarks(bookmarks)` - 批量创建书签
- `getBookmarkTree()` - 获取书签树结构

### 历史记录模块 (history)

- `getHistory(options?)` - 获取历史记录
- `addHistory(data)` - 添加历史记录
- `updateHistory(id, data)` - 更新历史记录
- `deleteHistory(id)` - 删除历史记录
- `batchAddHistory(items)` - 批量添加历史记录
- `batchDeleteHistory(ids)` - 批量删除历史记录
- `searchHistory(params)` - 搜索历史记录
- `getHistoryStats(params)` - 获取访问统计
- `clearHistory(params)` - 清理历史记录
- `getRecentHistory(limit)` - 获取最近访问
- `getTodayHistory()` - 获取今日访问
- `getHistoryInDays(days)` - 获取指定天数内的历史
- `importFromChrome(items)` - 从 Chrome 导入历史
- `searchByDomain(domain)` - 按域名搜索
- `getMostVisitedSites(limit)` - 获取最常访问的网站
- `exportHistory(options)` - 导出历史记录

### 团队模块 (teams)

- `getTeams(options?)` - 获取团队列表
- `createTeam(data)` - 创建团队
- `updateTeam(id, data)` - 更新团队信息
- `deleteTeam(id)` - 删除团队
- `getTeamMembers(teamId)` - 获取团队成员
- `inviteMember(teamId, data)` - 邀请成员
- `updateMemberRole(teamId, userId, role)` - 更新成员角色
- `removeMember(teamId, userId)` - 移除成员
- `checkTeamPermission(teamId, permission)` - 检查团队权限
- `getOwnedTeams()` - 获取拥有的团队
- `searchTeams(query)` - 搜索团队

## 环境变量配置

详细的环境变量配置说明请参考：[环境配置文档](../config/README.md)

### 支持的环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PLASMO_PUBLIC_API_BASE_URL` | API 基础 URL | `https://api.craz.com` |
| `PLASMO_PUBLIC_API_TIMEOUT` | 请求超时时间(毫秒) | `30000` |
| `PLASMO_PUBLIC_API_RETRY_LIMIT` | 重试次数 | `3` |
| `PLASMO_PUBLIC_ENABLE_API_LOGS` | 是否启用日志 | `false` |

## 错误处理

所有 API 方法都返回统一的响应格式：

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
```

### 错误处理示例

```typescript
try {
  const result = await api.bookmarks.getBookmarks()
  
  if (result.success) {
    console.log('书签数据:', result.data)
  } else {
    console.error('获取失败:', result.error)
  }
} catch (error) {
  console.error('网络错误:', error)
}
```

## 类型定义

完整的类型定义请参考 `types.ts` 文件。主要类型包括：

- `Bookmark` - 书签数据结构
- `HistoryItem` - 历史记录数据结构
- `Team` - 团队数据结构
- `AuthUser` - 用户数据结构
- 各种请求和响应的 DTO 类型

## 最佳实践

1. **使用环境变量**: 优先使用 `createCrazApiFromEnv()` 创建 API 实例
2. **错误处理**: 总是检查 `success` 字段并处理错误情况
3. **类型安全**: 充分利用 TypeScript 类型检查
4. **批量操作**: 对于大量数据操作，使用批量 API 方法
5. **缓存策略**: 在 Chrome 扩展中合理使用缓存减少 API 调用

## 示例代码

完整的使用示例请参考：[examples.ts](./examples.ts)

### 基本认证流程

```typescript
// 登录
const loginResult = await api.auth.login({
  email: 'user@example.com',
  password: 'password123'
})

if (loginResult.success) {
  // 登录成功，令牌自动设置
  const user = await api.auth.getCurrentUser()
  console.log('当前用户:', user.data)
}
```

### 书签管理

```typescript
// 获取书签
const bookmarks = await api.bookmarks.getBookmarks({ limit: 20 })

// 创建书签
const newBookmark = await api.bookmarks.createBookmark({
  url: 'https://example.com',
  title: '示例网站',
  parentId: null
})
```

### 历史记录搜索

```typescript
// 搜索历史记录
const searchResult = await api.history.searchHistory({
  query: 'github',
  maxResults: 10,
  searchFields: ['title', 'url']
})

console.log('搜索结果:', searchResult.data?.results)
```

## 版本信息

当前版本：1.0.0
兼容的 Plasmo 版本：>= 0.84.0
兼容的 Chrome 版本：>= 88
