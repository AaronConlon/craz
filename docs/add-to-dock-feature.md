# 添加到快捷栏功能

## 🎯 功能概述

在标签页切换器中，用户现在可以将任何网站（当前标签页或历史记录）添加到快捷栏中，实现快速访问。

## 🛠️ 技术实现

### 架构概览

```
UI (右键菜单) → Background Message → IndexedDB 存储 → 快捷栏显示
```

### 核心组件

#### 1. 数据存储层

- **存储位置**: IndexedDB (`CrazFaviconDock` 数据库)
- **数据结构**: `FaviconDockItem`

  ```typescript
  interface FaviconDockItem {
    id: string          // 唯一标识符
    url: string         // 网站 URL
    title: string       // 网站标题
    favicon: string     // favicon base64 数据
    order: number       // 排序顺序
    addedAt: number     // 添加时间戳
    lastUsed?: number   // 最后使用时间
  }
  ```

#### 2. Background Messages

- **`add-favicon-dock-item`**: 添加新的快捷栏项目
- **`get-favicon-dock-items`**: 获取所有快捷栏项目
- **`remove-favicon-dock-item`**: 删除快捷栏项目
- **`update-favicon-dock-items`**: 更新快捷栏项目

#### 3. UI 组件

- **`AdvancedDock`**: 显示快捷栏的主组件
- **`TabMenu`**: 右键菜单，包含"添加到快捷栏"选项
- **`useFaviconDockItems`**: React Hook，管理快捷栏状态

## 🚀 使用方法

### 从当前标签页添加

1. 在标签页切换器中右键点击任意标签页
2. 选择"添加到快捷栏"
3. 系统会自动获取网站信息和 favicon
4. 添加成功后显示 ⭐ 提示

### 从历史记录添加

1. 在标签页切换器中右键点击历史记录项
2. 选择"添加到快捷栏"
3. 系统会自动创建新标签页访问该网站
4. 将网站信息保存到快捷栏

### 智能去重

- 系统会自动检查 URL 是否已存在于快捷栏
- 如果已存在，显示"该网站已在快捷栏中"提示
- 避免重复添加相同网站

## 📱 快捷栏显示

快捷栏位于扩展主界面的底部 Dock 中：

- **左侧**: 功能菜单（设置、个人资料、标签页、书签等）
- **右侧**: 用户添加的快捷网站 favicon
- **交互**: 点击 favicon 在新标签页中打开对应网站

## ⚡ 功能特色

### 自动 Favicon 获取

1. **优先级**: 标签页 favicon → 网站根目录 favicon → 默认图标
2. **格式转换**: 自动转换为 base64 格式存储
3. **错误处理**: 获取失败时使用默认图标

### 智能排序

- 新添加的项目自动排在最后
- 支持手动重新排序（通过 `reorderItems` 方法）
- 记录最后使用时间，支持按使用频率排序

### 性能优化

- **缓存机制**: 使用 React Query 缓存快捷栏数据
- **增量更新**: 只更新变化的项目，避免全量刷新
- **延迟加载**: 快捷栏组件支持加载状态

## 🔧 开发扩展

### 添加新的操作

在 `background/messages/add-favicon-dock-item.ts` 中扩展功能：

```typescript
// 例如：添加标签分类
const newItem: FaviconDockItem = {
  // ... 现有字段
  category: 'work' | 'personal' | 'entertainment',
  tags: ['tag1', 'tag2']
}
```

### 自定义 UI

在 `AdvancedDock` 组件中自定义快捷栏样式：

```typescript
// 修改 FaviconDockItem 组件样式
const customStyle = "your-custom-classes"
```

### 数据导入导出

使用现有的 `faviconDockItems` 实例方法：

```typescript
// 导出所有数据
const allItems = await faviconDockItems.getAllItems()

// 批量导入
for (const item of importData) {
  await faviconDockItems.addItem(item)
}
```

## 🧪 测试验证

### 手动测试步骤

1. 打开标签页切换器
2. 右键点击不同类型的项目（当前标签页、历史记录）
3. 选择"添加到快捷栏"
4. 验证成功提示和重复检测
5. 查看快捷栏是否正确显示新添加的项目
6. 点击快捷栏项目验证链接跳转

### 错误处理测试

- 网络断开时的 favicon 获取
- 无效 URL 的处理
- IndexedDB 存储异常
- 重复添加的防护

## 📊 相关文件

### 核心文件

- `source/features/tab-switcher/ui/tabs-content.tsx` - 添加功能实现
- `background/messages/add-favicon-dock-item.ts` - Background 处理器
- `source/shared/utils/favicon-dock-items.ts` - 数据层实现
- `source/shared/components/advanced-dock.tsx` - UI 显示组件

### 辅助文件

- `source/shared/hooks/use-favicon-dock-items.ts` - React Hook
- `background/messages/get-favicon-dock-items.ts` - 获取数据处理器
- `source/features/tab-switcher/ui/tab-menu.tsx` - 右键菜单定义

## 🔮 未来改进

- 支持快捷栏项目分组
- 添加拖拽排序功能
- 实现快捷栏项目的云同步
- 添加快捷键支持（Ctrl+D 快速添加）
- 支持自定义图标和标题编辑
