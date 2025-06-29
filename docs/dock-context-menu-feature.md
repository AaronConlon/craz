# 快捷栏右键菜单功能

## 🎯 功能概述

为快捷栏的 favicon 项目添加了右键上下文菜单，支持删除、左右移动和设置自定义图标等操作，提升用户对快捷栏的管理体验。

## 🛠️ 技术实现

### 架构概览

```
FaviconDockItem (右键点击) → DockItemMenu (菜单组件) → AdvancedDock (处理操作) → Background Messages → IndexedDB
```

### 核心组件

#### 1. DockItemMenu 组件

- **文件位置**: `source/shared/components/dock-item-menu.tsx`
- **功能**: 快捷栏项目的右键上下文菜单
- **特色**:
  - 支持深色模式
  - 智能边界检测
  - 文件选择器集成
  - 动画效果

#### 2. AdvancedDock 组件增强

- **文件位置**: `source/shared/components/advanced-dock.tsx`
- **新增功能**:
  - 右键菜单状态管理
  - 操作处理逻辑
  - 移动能力计算

#### 3. FaviconDockItem 组件扩展

- **新增**: `onContextMenu` 事件处理
- **保持**: 原有的点击和悬停功能

## 🚀 功能详解

### 1. 📱 右键菜单操作

#### 向左移动 / 向右移动

- **功能**: 调整快捷栏项目的位置顺序
- **实现**: 通过重新排序数组并调用 `reorderItems` API
- **智能禁用**:
  - 最左侧项目禁用"向左移动"
  - 最右侧项目禁用"向右移动"

```typescript
case 'move-left': {
  const currentIndex = faviconDockItems.findIndex(i => i.id === item.id)
  if (currentIndex > 0) {
    const newOrder = [...faviconDockItems]
    const [movedItem] = newOrder.splice(currentIndex, 1)
    newOrder.splice(currentIndex - 1, 0, movedItem)
    
    const itemIds = newOrder.map(i => i.id)
    const success = await reorderItems(itemIds)
  }
}
```

#### 设置图标

- **功能**: 用户可以上传自定义图标替换默认 favicon
- **支持格式**: 所有图片格式 (`image/*`)
- **大小限制**: 最大 2MB
- **处理流程**:
  1. 触发文件选择器
  2. 验证文件类型和大小
  3. 转换为 base64 格式
  4. 更新到 IndexedDB

```typescript
const reader = new FileReader()
reader.onload = (e) => {
  const base64 = e.target?.result as string
  if (base64) {
    onAction('set-icon-data', item, { newIcon: base64 })
  }
}
reader.readAsDataURL(file)
```

#### 删除项目

- **功能**: 从快捷栏中移除指定项目
- **确认机制**: 直接删除，依赖用户明确的右键操作意图
- **反馈**: 显示成功/失败提示

### 2. 🎨 用户体验设计

#### 视觉设计

- **渐变背景**: 与整体设计风格保持一致
- **图标**: 使用 Lucide React 图标库
- **颜色体系**:
  - 主要操作: 蓝色主题色
  - 危险操作: 红色警告色
  - 禁用状态: 灰色透明度

#### 交互反馈

- **悬停效果**: 背景渐变和图标颜色变化
- **禁用状态**: 透明度降低，鼠标指针变为禁用状态
- **Toast 提示**: 操作成功/失败的即时反馈

#### 边界处理

- **菜单定位**: 智能检测屏幕边界，自动调整菜单位置
- **点击外部**: 自动关闭菜单
- **Escape 键**: 快速关闭菜单

### 3. 🔧 技术细节

#### 状态管理

```typescript
const [menuState, setMenuState] = useState<{
  isOpen: boolean
  item: FaviconDockItem | null
  position: { x: number; y: number }
}>({
  isOpen: false,
  item: null,
  position: { x: 0, y: 0 }
})
```

#### 移动能力计算

```typescript
const getMovementCapability = (item: FaviconDockItem) => {
  const currentIndex = faviconDockItems.findIndex(i => i.id === item.id)
  return {
    canMoveLeft: currentIndex > 0,
    canMoveRight: currentIndex < faviconDockItems.length - 1
  }
}
```

#### 文件处理

- **类型验证**: `file.type.startsWith('image/')`
- **大小检查**: `file.size > 2 * 1024 * 1024`
- **Base64 转换**: `FileReader.readAsDataURL()`
- **错误处理**: 完整的异常捕获和用户提示

## 📱 使用方法

### 基本操作流程

1. **右键点击**: 在快捷栏的任意 favicon 上右键点击
2. **选择操作**: 从弹出菜单中选择需要的操作
3. **确认结果**: 观察操作反馈和视觉变化

### 具体操作指南

#### 🔄 调整顺序

1. 右键点击要移动的 favicon
2. 选择"向左移动"或"向右移动"
3. 观察 favicon 位置的实时变化

#### 🎨 更换图标

1. 右键点击目标 favicon
2. 选择"设置图标"
3. 在文件选择器中选择图片文件
4. 确认新图标生效

#### 🗑️ 删除项目

1. 右键点击要删除的 favicon
2. 选择"删除"（红色危险操作）
3. 确认项目从快捷栏消失

## ⚠️ 注意事项

### 文件上传限制

- **格式要求**: 必须是图片文件
- **大小限制**: 不超过 2MB
- **推荐尺寸**: 16x16 到 128x128 像素的正方形图片
- **格式建议**: PNG 或 SVG 格式，确保透明背景效果

### 性能考虑

- **Base64 存储**: 图片转换为 base64 后存储在 IndexedDB
- **内存占用**: 大图片会增加内存使用，建议使用小尺寸图标
- **加载速度**: 过多或过大的自定义图标可能影响快捷栏加载速度

### 浏览器兼容性

- **文件 API**: 依赖现代浏览器的 File API 支持
- **Right-click**: 需要支持 `onContextMenu` 事件
- **IndexedDB**: 需要浏览器支持 IndexedDB 存储

## 🧪 测试验证

### 功能测试

1. **菜单显示**: 右键点击后菜单是否正确显示
2. **位置计算**: 菜单是否在屏幕边界内正确定位
3. **操作执行**: 各项操作是否按预期工作
4. **状态更新**: 操作后 UI 是否及时更新

### 边界测试

- 在屏幕边角右键点击，验证菜单位置
- 上传不同格式和大小的图片文件
- 测试只有一个项目时的移动按钮状态
- 验证深色模式下的视觉效果

### 错误处理测试

- 上传超大文件
- 上传非图片文件
- 网络异常时的操作反馈
- IndexedDB 存储失败的处理

## 🔮 未来增强

### 功能扩展

- **拖拽排序**: 支持直接拖拽调整 favicon 顺序
- **批量操作**: 支持多选和批量删除
- **分组管理**: 支持 favicon 分组和折叠
- **导入导出**: 支持快捷栏配置的备份和恢复

### 用户体验优化

- **预览功能**: 图标设置时的实时预览
- **撤销操作**: 支持删除和移动的撤销功能
- **键盘快捷键**: 支持方向键快速移动
- **自定义右键菜单**: 允许用户自定义菜单项

### 性能优化

- **图片压缩**: 自动压缩上传的图片
- **懒加载**: 大量 favicon 的延迟加载
- **缓存机制**: 智能缓存减少重复计算
- **虚拟滚动**: 支持更多 favicon 项目的高性能渲染

## 📊 相关文件

### 核心文件

- `source/shared/components/dock-item-menu.tsx` - 右键菜单组件
- `source/shared/components/advanced-dock.tsx` - 快捷栏主组件
- `source/shared/hooks/use-favicon-dock-items.ts` - 快捷栏数据管理

### 辅助文件

- `source/shared/components/index.ts` - 组件导出管理
- `source/shared/utils/favicon-dock-items.ts` - 数据层实现
- `background/messages/update-favicon-dock-items.ts` - 后台更新处理

这个右键菜单功能大大提升了快捷栏的可用性，让用户能够更灵活地管理自己的快捷访问项目。
