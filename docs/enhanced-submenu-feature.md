# Enhanced Submenu Feature - 增强的子菜单功能

## 概述

本次更新为 Chrome 扩展的标签页菜单系统增加了子菜单功能，提供简洁高效的分享选项。

## 功能特性

### 🎯 子菜单机制

- **悬停触发**: 鼠标悬停到父菜单项时，如果没有 `action` 且存在 `children`，则立即显示子菜单
- **智能定位**: 子菜单自动显示在父菜单右侧，支持边界检测和自适应位置
- **延迟隐藏**: 鼠标离开菜单项或子菜单时，150ms 后自动隐藏，给用户时间移动到子菜单
- **级联关闭**: 支持 ESC 键逐级关闭子菜单，点击外部区域一次性关闭所有菜单
- **视觉反馈**: 父菜单项显示右箭头图标 `ChevronRight` 表示有子菜单

### 📤 分享功能

- **复制标题和网址**: 一键复制站点标题和 URL 到剪贴板
- **复制 Markdown 链接**: 生成并复制 `[标题](URL)` 格式的 Markdown 链接
- **分享到 X**: 在新窗口打开 X 分享页面

## 技术实现

### 核心接口

```typescript
interface MenuItem {
  id: string
  label: string
  icon: LucideIcon
  action: string
  variant?: 'default' | 'danger' | 'primary'
  disabled?: boolean
  divider?: boolean
  children?: MenuItem[]  // 新增：子菜单项
}

interface SubMenuState {
  isOpen: boolean
  parentId: string | null
  position: { x: number; y: number }
}
```

### 菜单结构示例

```typescript
{
  id: 'share-website',
  label: '分享网站',
  icon: Share,
  action: '',  // 空 action 表示这是父菜单项
  children: [
    {
      id: 'share-website-copy-url',
      label: '复制标题和网址',
      icon: Copy,
      action: 'share-website-copy-url'
    },
    {
      id: 'share-website-copy-markdown',
      label: '复制 Markdown 链接',
      icon: Hash,
      action: 'share-website-copy-markdown'
    },
    {
      id: 'share-website-to-x',
      label: '分享到 X',
      icon: Twitter,
      action: 'share-website-to-x'
    }
  ]
}
```

### 关键实现逻辑

1. **悬停触发子菜单**:

```typescript
const handleMenuItemHover = (item: MenuItem, event: React.MouseEvent) => {
  if (item.children && item.children.length > 0 && !item.action) {
    const rect = event.currentTarget.getBoundingClientRect()
    setSubMenuState({
      isOpen: true,
      parentId: item.id,
      position: { x: rect.right + 5, y: rect.top }
    })
  }
}
```

2. **延迟隐藏机制**:

```typescript
const handleMenuItemLeave = () => {
  hoverTimeoutRef.current = setTimeout(() => {
    setSubMenuState({ isOpen: false, parentId: null, position: { x: 0, y: 0 } })
  }, 150)  // 150ms 延迟
}
```

3. **取消隐藏定时器**:

```typescript
const handleSubMenuHover = () => {
  if (hoverTimeoutRef.current) {
    clearTimeout(hoverTimeoutRef.current)
  }
}
```

4. **边界检测**:

```typescript
// 如果超出右边界，显示在左侧
if (x + subMenuWidth > window.innerWidth) {
  x = subMenuState.position.x - subMenuWidth - 10
}
```

## 新增 Action 类型

| Action | 功能 | 实现方式 |
|--------|------|----------|
| `share-website-copy-url` | 复制标题和网址 | `copyShare()` 函数 |
| `share-website-copy-markdown` | 复制 Markdown 链接 | `navigator.clipboard.writeText()` |
| `share-website-to-x` | 分享到 X | 打开 `x.com/intent/tweet` |

## 使用方法

### 用户交互

1. 右键点击标签页项
2. 鼠标悬停到 "分享网站" 菜单项，子菜单立即显示
3. 移动鼠标到子菜单，点击选择具体的分享方式
4. 系统自动执行相应的分享操作

### 开发者扩展

要添加新的子菜单项，只需在相应的 `MenuItem[]` 数组中添加 `children` 属性：

```typescript
{
  id: 'new-parent-menu',
  label: '新功能',
  icon: SomeIcon,
  action: '',  // 父菜单项不设置 action
  children: [
    {
      id: 'new-child-1',
      label: '子功能 1',
      icon: ChildIcon1,
      action: 'new-child-action-1'
    }
  ]
}
```

然后在 `handleMenuAction` 函数中添加对应的 case 处理新的 action。

## 设计原则

### 🎨 视觉一致性

- 子菜单使用与主菜单相同的样式系统
- 支持深色模式和主题色适配
- 渐变背景和毛玻璃效果保持一致

### 🔧 用户体验

- 直观的右箭头提示有子菜单
- **即时响应**: 悬停触发，无需点击，操作更流畅
- **容错机制**: 150ms 延迟隐藏，避免误操作
- 平滑的动画过渡效果
- 智能的位置自适应
- 键盘导航支持（ESC 键）

### 🛡️ 健壮性

- 完整的边界检测
- 优雅的错误处理
- 事件冒泡控制
- 内存泄漏防护

## 兼容性说明

- **Chrome 扩展 API**: 使用标准的 `chrome.tabs` 和 `window.open` API
- **图标库**: 使用 lucide-react 中的 `Twitter` 和 `Hash` 图标
- **剪贴板 API**: 使用现代浏览器的 `navigator.clipboard` API

## 性能优化

- **按需渲染**: 只有在打开子菜单时才渲染子菜单 DOM
- **事件委托**: 合理使用事件监听器，避免内存泄漏
- **状态管理**: 使用 `useState` 进行本地状态管理，避免不必要的重渲染

## 特色功能

### 🎯 悬停触发交互

采用悬停触发子菜单的交互方式，相比点击触发有以下优势：

- **更快的操作速度**: 无需点击即可查看所有选项
- **更好的可发现性**: 用户可以快速浏览所有可用功能
- **减少误操作**: 150ms 延迟确保用户有足够时间到达子菜单
- **符合现代 UI 习惯**: 与主流桌面应用和网页应用的交互模式一致

### 📋 Markdown 链接复制

新增的 Markdown 链接复制功能会生成标准的 Markdown 链接格式：

```markdown
[页面标题](页面URL)
```

这对于编写文档、博客或在 GitHub/Reddit 等支持 Markdown 的平台分享链接非常有用。

### 🔗 X (Twitter) 分享

更新了分享到 X 的功能，使用最新的 `x.com` 域名，并在弹窗中预填充页面标题和 URL。

## 未来规划

- [ ] 支持多级子菜单（三级及以上）
- [ ] 添加更多复制格式（HTML、Rich Text 等）
- [ ] 自定义分享模板功能
- [ ] 分享统计和分析功能
