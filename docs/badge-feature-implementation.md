# Badge 功能实现

## 功能概述

为 Chrome 扩展的 popup 图标添加 badge，显示当前打开的标签页数量。

## 核心实现

### updateBadge 函数

```typescript
async function updateBadge() {
  try {
    const tabs = await chrome.tabs.query({})
    const tabCount = tabs.length

    await chrome.action.setBadgeText({
      text: tabCount > 0 ? tabCount.toString() : ''
    })

    await chrome.action.setBadgeBackgroundColor({
      color: '#3b82f6' // theme-primary-500
    })

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

## 事件监听

- 标签页激活: `chrome.tabs.onActivated`
- 标签页更新: `chrome.tabs.onUpdated`
- 标签页创建: `chrome.tabs.onCreated`
- 标签页关闭: `chrome.tabs.onRemoved`
- 窗口关闭: `chrome.windows.onRemoved`

## 视觉设计

- 背景色: 主题蓝色 `#3b82f6`
- 文字色: 白色 `#ffffff`
- 显示当前所有标签页数量
