# Tailwind CSS 深色模式兼容性测试

## 当前配置

### Tailwind 配置

```javascript
// tailwind.config.js
module.exports = {
  darkMode: ['attribute', '[data-appearance="dark"]'],
  // ...其他配置
}
```

### CSS 基础样式

```css
/* style.css */
[data-appearance="dark"] {
  color-scheme: dark;
}

[data-appearance="light"] {
  color-scheme: light;
}
```

## 使用方式

### 1. HTML 结构

```html
<!-- 浅色模式 -->
<div data-appearance="light">
  <div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
    内容
  </div>
</div>

<!-- 深色模式 -->
<div data-appearance="dark">
  <div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
    内容
  </div>
</div>
```

### 2. 常用深色模式类名

#### 背景色

```css
bg-white dark:bg-gray-900        /* 白色 → 深灰 */
bg-gray-50 dark:bg-gray-800      /* 浅灰 → 较深灰 */
bg-gray-100 dark:bg-gray-700     /* 浅灰 → 中灰 */
```

#### 文本色

```css
text-gray-900 dark:text-white    /* 深色文字 → 白色文字 */
text-gray-600 dark:text-gray-300 /* 中等灰色 → 浅灰色 */
text-gray-500 dark:text-gray-400 /* 较浅灰色 → 中等浅灰 */
```

#### 边框色

```css
border-gray-200 dark:border-gray-700  /* 浅边框 → 深边框 */
border-gray-300 dark:border-gray-600  /* 中等边框 → 较深边框 */
```

### 3. 在 React 组件中使用

```typescript
function MyComponent() {
  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        标题
      </h1>
      <p className="text-gray-600 dark:text-gray-300">
        内容文本
      </p>
      <button className="bg-blue-500 dark:bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-700">
        按钮
      </button>
    </div>
  )
}
```

## 与主题色系统的集成

### 主题色在深色模式下的表现

```css
/* 主题色会根据当前主题自动调整 */
bg-theme-primary-500       /* 在任何模式下都使用主题色 */
text-theme-primary-600     /* 主题色文字 */
border-theme-primary-300   /* 主题色边框 */

/* 结合深色模式的条件样式 */
bg-white dark:bg-gray-900 border-theme-primary-300 dark:border-theme-primary-600
```

### 推荐的颜色组合

#### 卡片组件

```css
bg-white dark:bg-gray-800 
border border-gray-200 dark:border-gray-700 
text-gray-900 dark:text-white
```

#### 输入框

```css
bg-white dark:bg-gray-700 
border border-gray-300 dark:border-gray-600 
text-gray-900 dark:text-white 
placeholder-gray-500 dark:placeholder-gray-400
```

#### 按钮（主要）

```css
bg-theme-primary-500 hover:bg-theme-primary-600 
text-white 
border-theme-primary-500 hover:border-theme-primary-600
```

#### 按钮（次要）

```css
bg-gray-100 dark:bg-gray-700 
hover:bg-gray-200 dark:hover:bg-gray-600 
text-gray-900 dark:text-white 
border border-gray-300 dark:border-gray-600
```

## 测试清单

### ✅ 基础功能测试

- [ ] `dark:` 前缀类名正确应用
- [ ] `data-appearance="dark"` 属性触发深色模式
- [ ] `data-appearance="light"` 属性触发浅色模式
- [ ] 系统偏好检测正常工作

### ✅ 组件兼容性测试

- [ ] 设置界面在深色模式下显示正常
- [ ] 主题色选择器在深色模式下可见
- [ ] 界面模式切换器工作正常
- [ ] 所有交互元素在深色模式下可用

### ✅ 样式一致性测试

- [ ] 主题色在深浅模式下都保持一致
- [ ] 文字对比度符合可访问性标准
- [ ] 边框和分隔线在深色模式下可见
- [ ] 悬停和焦点状态在深色模式下正常

## 常见问题和解决方案

### 1. 深色模式类名不生效

**问题**: `dark:bg-gray-900` 等类名不起作用
**解决**: 检查容器是否设置了 `data-appearance="dark"` 属性

### 2. 主题色在深色模式下不可见

**问题**: 主题色在深色背景下对比度不够
**解决**: 使用更浅的主题色变体，如 `theme-primary-400` 替代 `theme-primary-600`

### 3. 系统偏好检测不工作

**问题**: 跟随系统设置不生效
**解决**: 确保 `applyAppearanceMode` 函数正确监听了系统变化

## 最佳实践

1. **始终提供深色模式变体**: 为每个有背景色或文字色的元素提供 `dark:` 变体
2. **保持对比度**: 确保文字和背景有足够的对比度
3. **测试主题色**: 在不同主题色下测试深色模式
4. **渐进增强**: 深色模式应该是浅色模式的增强，而不是替代
