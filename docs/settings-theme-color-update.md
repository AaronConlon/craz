# Settings View 主题色更新

## 更新概述

将 `source/features/tab-switcher/ui/settings-view.tsx` 中的固定颜色类替换为动态主题色类，使界面能够根据用户选择的主题色自动调整。

## 更新内容

### 1. 选中状态边框和背景

**替换前：**

```tsx
border-blue-500
bg-blue-50
bg-blue-500
```

**替换后：**

```tsx
border-theme-primary-500
bg-theme-primary-50
bg-theme-primary-500
```

### 2. 加载状态图标

**替换前：**

```tsx
text-blue-600
```

**替换后：**

```tsx
text-theme-primary-600
```

### 3. 悬停状态边框

**替换前：**

```tsx
hover:border-gray-300
```

**替换后：**

```tsx
hover:border-theme-primary-200
```

### 4. 主题预览中的强调元素

**替换前：**

```tsx
bg-blue-500  // 系统偏好和浅色模式
bg-blue-400  // 深色模式
```

**替换后：**

```tsx
bg-theme-primary-500  // 系统偏好和浅色模式
bg-theme-primary-400  // 深色模式
```

### 5. 标题文字颜色

**替换前：**

```tsx
text-theme-primary-400
```

**替换后：**

```tsx
text-theme-primary-600
```

## 影响范围

### 受影响的UI组件

- ✅ 主题色选择器
- ✅ 界面主题选择卡片
- ✅ 语言选择卡片
- ✅ 字体大小选择卡片
- ✅ 加载状态指示器
- ✅ 主题预览窗口

### 保持不变的元素

- ❌ 错误状态图标 (`text-red-500`, `text-red-600`) - 保持语义颜色
- ❌ 成功状态元素 (`bg-green-400`) - 保持语义颜色
- ❌ 中性灰色边框和背景 - 保持中性色调

## 技术实现

### CSS变量系统

使用 Tailwind CSS 的主题色变量系统：

```css
--theme-primary-50   /* 最浅色调 */
--theme-primary-100
--theme-primary-200  /* 悬停边框 */
--theme-primary-300
--theme-primary-400  /* 深色模式强调色 */
--theme-primary-500  /* 主要强调色 */
--theme-primary-600  /* 文字和图标 */
--theme-primary-700
--theme-primary-800
--theme-primary-900  /* 最深色调 */
```

### 动态主题切换

当用户切换主题时：

1. 更新 `data-theme` 属性
2. CSS变量自动更新到新的颜色值
3. 所有使用主题色类的元素自动应用新颜色

## 用户体验改进

### 视觉一致性

- 所有交互元素使用统一的主题色
- 选中状态、悬停状态、强调元素保持色彩一致性
- 主题预览准确反映当前选择的颜色

### 个性化体验

- 用户选择的主题色立即反映在设置界面中
- 提供实时的视觉反馈
- 增强品牌个性化体验

## 兼容性

- ✅ 支持所有预设主题：zinc, indigo, emerald, amber, rose
- ✅ 支持自定义主题色
- ✅ 保持响应式设计
- ✅ 保持可访问性标准

## 测试建议

1. 切换不同主题色，验证设置界面颜色变化
2. 检查选中状态的视觉反馈
3. 验证悬停效果的主题色应用
4. 确认加载状态图标的颜色正确性
