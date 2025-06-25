# Badge 功能实现文档

## 功能概述

为 Chrome 扩展的 popup 图标添加 badge，显示当前打开的标签页数量。Badge 使用主题色背景配白色数字，实时监听标签页变化并更新显示。

## 实现细节

### 1. 核心功能函数

```typescript
async function updateBadge() {
  try {
    // 获取所有标签页
    const tabs = await chrome.tabs.query({})
    const tabCount = tabs.length

    console.log(`[Background] 更新 Badge: ${tabCount} 个标签页`)

    // 设置 badge 文字
    await chrome.action.setBadgeText({
      text: tabCount > 0 ? tabCount.toString() : ''
    })

    // 设置 badge 背景色（主题色）
    await chrome.action.setBadgeBackgroundColor({
      color: '#3b82f6' // theme-primary-500 蓝色
    })

    // 设置 badge 文字颜色为白色
    if (chrome.action.setBadgeTextColor) {
      await chrome.action.setBadgeTextColor({
        color: '#ffffff'
      })
    }
  } catch (error) {
    console.error("[Background] 更新 Badge 失败:", error)
  }
}
```

### 2. 事件监听器

Badge 功能监听以下标签页事件，确保实时更新：

#### 标签页激活事件

```typescript
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  // ... 原有逻辑 ...
  
  // 更新 badge
  await updateBadge()
})
```

#### 标签页更新事件

```typescript
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // ... 原有逻辑 ...
  
  // 更新 badge
  await updateBadge()
})
```

#### 标签页创建事件

```typescript
chrome.tabs.onCreated.addListener(async (tab) => {
  // ... 原有逻辑 ...
  
  // 更新 badge
  await updateBadge()
})
```

#### 标签页关闭事件

```typescript
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  console.log(`[Background] 标签页关闭: ${tabId}`)

  // 更新 badge
  await updateBadge()
})
```

#### 窗口关闭事件

```typescript
chrome.windows.onRemoved.addListener(async (windowId) => {
  console.log(`[Background] 窗口关闭: ${windowId}`)

  // 更新 badge
  await updateBadge()
})
```

### 3. 初始化

在扩展启动时初始化 badge：

```typescript
// 启动初始化
initializeCurrentTab()
scheduleDataCleanup()

// 初始化 badge
updateBadge()
```

## 技术特性

### 1. 实时更新

- 监听所有标签页生命周期事件
- 包括创建、激活、更新、关闭等操作
- 确保 badge 数字始终准确反映当前标签页数量

### 2. 视觉设计

- **背景色**: `#3b82f6` (theme-primary-500 蓝色)
- **文字色**: `#ffffff` (白色)
- **显示逻辑**: 有标签页时显示数量，无标签页时隐藏 badge

### 3. 错误处理

- 使用 try-catch 包装所有 Chrome API 调用
- 详细的错误日志记录
- 静默处理错误，不影响扩展其他功能

### 4. 性能优化

- 仅在必要时更新 badge
- 使用异步函数避免阻塞
- 最小化 Chrome API 调用频率

## 权限要求

### manifest.json 配置

```json
{
  "permissions": [
    "tabs"
  ]
}
```

项目中已包含 `tabs` 权限，无需额外配置。

## 使用的 Chrome APIs

### 1. chrome.tabs

- `chrome.tabs.query({})` - 获取所有标签页
- `chrome.tabs.onActivated` - 监听标签页激活
- `chrome.tabs.onUpdated` - 监听标签页更新
- `chrome.tabs.onCreated` - 监听标签页创建
- `chrome.tabs.onRemoved` - 监听标签页关闭

### 2. chrome.action

- `chrome.action.setBadgeText()` - 设置 badge 文字
- `chrome.action.setBadgeBackgroundColor()` - 设置背景色
- `chrome.action.setBadgeTextColor()` - 设置文字色

### 3. chrome.windows

- `chrome.windows.onRemoved` - 监听窗口关闭

## 测试验证

### 手动测试步骤

1. 构建并加载扩展
2. 观察扩展图标是否显示当前标签页数量
3. 打开新标签页，验证数字增加
4. 关闭标签页，验证数字减少
5. 在不同窗口间切换，验证数字准确性

### 预期行为

- 扩展图标右上角显示蓝色背景的白色数字
- 数字实时反映当前浏览器中打开的标签页总数
- 包括所有窗口中的标签页
- 数字变化平滑，无延迟

## 日志输出

```
[Background] 更新 Badge: 5 个标签页
[Background] 标签页关闭: 123
[Background] 更新 Badge: 4 个标签页
```

## 潜在问题和解决方案

### 1. 权限不足

- **问题**: 无法访问标签页信息
- **解决**: 确保 manifest.json 中包含 `tabs` 权限

### 2. API 兼容性

- **问题**: `setBadgeTextColor` 在某些 Chrome 版本中不可用
- **解决**: 使用条件检查 `if (chrome.action.setBadgeTextColor)`

### 3. 性能考虑

- **问题**: 频繁更新可能影响性能
- **解决**: 已优化为仅在必要事件时更新

## 扩展功能建议

### 1. 主题色同步

- 可以考虑从用户设置中读取主题色
- 动态更新 badge 背景色

### 2. 数字格式化

- 超过 99 时显示 "99+"
- 超过 999 时显示 "999+"

### 3. 可配置选项

- 允许用户开启/关闭 badge 功能
- 允许用户自定义 badge 颜色

```typescript
// 示例：数字格式化
function formatBadgeText(count: number): string {
  if (count === 0) return ''
  if (count > 999) return '999+'
  if (count > 99) return '99+'
  return count.toString()
}
```
