# Background Messages

Chrome 扩展的 Background Script 消息处理器集合。

## 架构说明

遵循项目的 Feature-Sliced Design 架构原则，Background 作为服务的中间接口层：

- **数据流向**: UI → Messages → Background → Chrome API → Background → UI
- **职责分离**: UI 组件不直接调用 Chrome API，通过 messaging 与 background 通信
- **权限管理**: 敏感权限和 API 调用集中在 background 处理
- **错误处理**: 统一的错误处理和响应格式

## 消息处理器列表

### 标签页管理

- `get-tabs.ts` - 获取 Chrome 标签页信息
- `get-default-search-tabs.ts` - 🆕 获取默认搜索结果标签页
- `get-default-history-top7.ts` - 🆕 获取本地历史访问次数前7的数据
- `switch-tab.ts` - 切换到指定标签页
- `close-tab.ts` - 关闭指定标签页
- `clean-duplicate-tabs.ts` - 清理重复标签页
- `restore-last-closed-tab.ts` - 恢复最后关闭的标签页

### 认证相关

- `check-auth-status.ts` - 检查用户认证状态

### 用户设置

- `get-user-settings.ts` - 获取用户设置
- `update-user-settings.ts` - 更新用户设置

### 图标缓存

- `get-favicon-cache.ts` - 获取网站图标缓存
- `save-favicon-cache.ts` - 保存网站图标缓存
- `save-favicon.ts` - 保存单个网站图标
- `get-website-favicon.ts` - 获取网站图标
- `check-favicon-availability.ts` - 检查图标可用性

### 书签管理

- `get-bookmarks.ts` - 获取书签数据

### 系统工具

- `ping.ts` - 系统连通性测试

## 🆕 新功能：默认搜索标签页

### `get-default-search-tabs.ts`

**功能**：获取默认搜索结果的标签页，用于标签页搜索功能的默认推荐。

**返回数据**：

- **最近访问的前2条**：按最后访问时间排序
- **访问频繁的前5条**：按访问次数排序，结合时间权重

**请求参数**：

```typescript
interface GetDefaultSearchTabsRequest {
  excludeCurrentTab?: boolean // 是否排除当前活动标签页
  windowId?: number // 限制在指定窗口内搜索
}
```

**响应数据**：

```typescript
interface GetDefaultSearchTabsResponse {
  success: boolean
  recentTabs: TabWithStats[] // 最近访问的前2条
  frequentTabs: TabWithStats[] // 访问最频繁的前5条
  total: number
  error?: string
}
```

**增强的标签页数据**：

```typescript
interface TabWithStats extends chrome.tabs.Tab {
  lastAccessed?: number // 最后访问时间戳
  visitCount?: number // 访问次数（来自 Chrome 历史记录）
  accessScore?: number // 综合访问分数
}
```

### 使用示例

```typescript
import { getDefaultSearchTabs } from '~/shared/api/messages'

// 基本使用
const result = await getDefaultSearchTabs({
  excludeCurrentTab: true
})

if (result.success) {
  console.log('最近访问:', result.recentTabs)
  console.log('访问频繁:', result.frequentTabs)
}

// 指定窗口
const windowResult = await getDefaultSearchTabs({
  windowId: 123,
  excludeCurrentTab: true
})
```

### 智能推荐算法

1. **时间权重**：基于 `lastAccessed` 时间戳
2. **频率权重**：基于 Chrome 历史记录的 `visitCount`
3. **综合分数**：`accessScore = timeScore + (visitCount * 1000)`
4. **去重处理**：避免重复推荐相同标签页
5. **智能补充**：如果数量不足，按综合分数补充

### 适用场景

- 🔍 **搜索默认结果**：用户打开标签页搜索时的初始推荐
- 🚀 **快速访问**：提供最可能需要的标签页
- 📊 **智能排序**：结合时间和频率的双重排序
- 🎯 **个性化推荐**：基于用户实际使用习惯

## 开发规范

### 文件结构

```typescript
import type { PlasmoMessaging } from "@plasmohq/messaging"

export interface MessageRequest {
  // 请求参数定义
}

export interface MessageResponse {
  success: boolean
  // 响应数据定义
  error?: string
}

const handler: PlasmoMessaging.MessageHandler<
  MessageRequest,
  MessageResponse
> = async (req, res) => {
  console.log("Background message-name: 收到请求，参数:", req.body)
  
  try {
    // 处理逻辑
    res.send({
      success: true,
      // 返回数据
    })
  } catch (error) {
    console.error("Background message-name: 处理失败:", error)
    res.send({
      success: false,
      error: error instanceof Error ? error.message : "处理失败"
    })
  }
}

export default handler
```

### 命名约定

- 文件名使用 kebab-case：`get-default-search-tabs.ts`
- 接口名使用 PascalCase：`GetDefaultSearchTabsRequest`
- 消息名称与文件名一致：`get-default-search-tabs`

### 错误处理

- 统一的错误处理格式
- 详细的错误日志
- 友好的错误信息

### 日志规范

- 请求日志：`"Background message-name: 收到请求，参数:"`
- 成功日志：`"Background message-name: 成功处理"`
- 错误日志：`"Background message-name: 处理失败:"`

## 测试建议

1. **功能测试**：验证基本功能是否正常工作
2. **边界测试**：测试空数据、异常参数等边界情况
3. **性能测试**：确保处理大量标签页时的性能
4. **权限测试**：验证 Chrome API 权限要求
5. **兼容性测试**：测试不同 Chrome 版本的兼容性
