# 主题系统设计文档

## 概述

基于CSS变量的主题系统，支持动态切换主题色和字体大小，提供统一的设计语言和用户自定义体验。

## 🎨 设计理念

### 1. CSS变量驱动

- 使用CSS自定义属性（CSS Variables）作为主题系统的核心
- 通过`data-*`属性控制主题切换
- 支持实时预览和无缝切换

### 2. 语义化命名

- 主题色：`--theme-primary-{shade}`
- 字体大小：`--font-size-{level}`
- 行高：`--line-height-{level}`
- 间距：`--spacing-{size}`

### 3. 渐进增强

- 基础功能不依赖JavaScript
- 支持自定义颜色的高级功能
- 向后兼容传统CSS类名

## 🛠 技术架构

### CSS变量结构

```css
:root {
  /* 主题色系统 */
  --theme-primary: #3B82F6;
  --theme-primary-50: #EFF6FF;
  --theme-primary-100: #DBEAFE;
  /* ... 其他色阶 */
  
  /* 字体大小系统 */
  --font-size-small: 0.875rem;
  --font-size-medium: 1rem;
  --font-size-large: 1.125rem;
  
  /* 行高系统 */
  --line-height-small: 1.25;
  --line-height-medium: 1.5;
  --line-height-large: 1.625;
}
```

### 主题切换机制

```css
[data-theme="blue"] {
  --theme-primary: #3B82F6;
  /* ... 蓝色主题变量 */
}

[data-theme="purple"] {
  --theme-primary: #8B5CF6;
  /* ... 紫色主题变量 */
}

[data-font-size="large"] {
  --font-size-small: 1rem;
  --font-size-medium: 1.125rem;
  --font-size-large: 1.25rem;
}
```

## 🎯 核心组件

### 1. ThemeProvider

```tsx
<ThemeProvider>
  <App />
</ThemeProvider>
```

**功能特性：**

- 监听用户设置变化
- 自动应用主题到DOM
- 支持自定义颜色生成
- 提供主题上下文

### 2. useTheme Hook

```tsx
const { theme, fontSize, setTheme, setFontSize, setCustomColor } = useTheme()
```

**API接口：**

- `theme`: 当前主题名称
- `fontSize`: 当前字体大小
- `setTheme(theme)`: 设置主题色
- `setFontSize(size)`: 设置字体大小
- `setCustomColor(color)`: 设置自定义颜色

### 3. 主题工具类

```css
.theme-primary { color: var(--theme-primary); }
.theme-bg-primary { background-color: var(--theme-primary); }
.theme-border-primary { border-color: var(--theme-primary); }
.text-theme-base { font-size: var(--font-size-medium); }
.theme-transition { transition: color 0.2s, background-color 0.2s; }
```

## 📋 支持的主题

### 预设主题色

| 主题名 | 主色调 | 色值 | 适用场景 |
|--------|--------|------|----------|
| blue | 蓝色 | #3B82F6 | 默认主题，专业稳重 |
| purple | 紫色 | #8B5CF6 | 创意设计，年轻活力 |
| green | 绿色 | #10B981 | 自然环保，健康主题 |
| orange | 橙色 | #F59E0B | 温暖活跃，电商主题 |
| pink | 粉色 | #EC4899 | 时尚浪漫，女性主题 |
| custom | 自定义 | 用户定义 | 个性化定制 |

### 字体大小等级

| 等级 | 小号 | 中号 | 大号 |
|------|------|------|------|
| small | 12px | 14px | 16px |
| medium | 14px | 16px | 18px |
| large | 16px | 18px | 20px |

## 🔧 使用指南

### 1. 基础使用

```tsx
// 在应用根组件包裹ThemeProvider
function App() {
  return (
    <ThemeProvider>
      <YourApp />
    </ThemeProvider>
  )
}

// 在组件中使用主题
function MyComponent() {
  const { theme, setTheme } = useTheme()
  
  return (
    <button 
      className="theme-bg-primary text-white theme-transition"
      onClick={() => setTheme('purple')}
    >
      切换到紫色主题
    </button>
  )
}
```

### 2. 自定义颜色

```tsx
function ColorPicker() {
  const { setCustomColor } = useTheme()
  
  const handleColorChange = (color: string) => {
    setCustomColor(color) // 自动切换到custom主题
  }
  
  return (
    <input 
      type="color" 
      onChange={(e) => handleColorChange(e.target.value)}
    />
  )
}
```

### 3. 响应式字体

```tsx
function ResponsiveText() {
  const { setFontSize } = useTheme()
  
  return (
    <div className="text-theme-base theme-transition">
      这段文字会根据用户的字体大小设置自动调整
    </div>
  )
}
```

### 4. 主题感知组件

```tsx
function ThemeAwareButton({ children, ...props }) {
  return (
    <button 
      className={cn(
        "px-4 py-2 rounded-md font-medium",
        "theme-bg-primary-600 hover:theme-bg-primary-700",
        "text-white theme-transition"
      )}
      {...props}
    >
      {children}
    </button>
  )
}
```

## 🎨 设计原则

### 1. 一致性

- 所有UI元素使用统一的主题变量
- 保持视觉层次和间距的一致性
- 统一的动画过渡效果

### 2. 可访问性

- 确保足够的颜色对比度
- 支持大字体显示
- 兼容屏幕阅读器

### 3. 性能优化

- CSS变量的高效切换
- 最小化重绘和重排
- 懒加载非关键主题资源

### 4. 扩展性

- 易于添加新的主题色
- 支持深色模式扩展
- 灵活的自定义选项

## 🔄 集成流程

### 1. 导入样式

```css
/* 在主样式文件中导入 */
@import url('./source/shared/styles/theme-variables.css');
```

### 2. 包裹Provider

```tsx
// 在应用入口添加ThemeProvider
import { ThemeProvider } from '~/source/shared/components'

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes />
      </Router>
    </ThemeProvider>
  )
}
```

### 3. 更新组件

```tsx
// 将硬编码的颜色替换为主题变量
// 之前
className="bg-blue-600 text-white"

// 之后  
className="theme-bg-primary-600 text-white theme-transition"
```

### 4. 连接设置

```tsx
// 在设置页面中使用主题控制
function SettingsPage() {
  const { theme, setTheme } = useTheme()
  
  return (
    <div>
      {themes.map(themeName => (
        <button 
          key={themeName}
          onClick={() => setTheme(themeName)}
          className={theme === themeName ? 'active' : ''}
        >
          {themeName}
        </button>
      ))}
    </div>
  )
}
```

## 🚀 高级特性

### 1. 动态颜色生成

```typescript
// 自动生成颜色色阶
function generateColorShades(baseColor: string) {
  // 基于基础颜色生成50-900的色阶
  return {
    50: lighten(baseColor, 0.4),
    100: lighten(baseColor, 0.3),
    // ... 其他色阶
    900: darken(baseColor, 0.4)
  }
}
```

### 2. 主题预设管理

```typescript
// 支持导入/导出主题配置
interface ThemePreset {
  name: string
  primaryColor: string
  fontSize: FontSize
  customSettings: Record<string, any>
}

const exportTheme = (): ThemePreset => ({ ... })
const importTheme = (preset: ThemePreset) => { ... }
```

### 3. 实时预览

```tsx
// 设置更改时的实时预览
function ThemePreview({ previewTheme }: { previewTheme: Theme }) {
  useEffect(() => {
    // 临时应用预览主题
    document.documentElement.setAttribute('data-theme', previewTheme)
    
    return () => {
      // 恢复原主题
      document.documentElement.setAttribute('data-theme', currentTheme)
    }
  }, [previewTheme])
  
  return <div>预览内容</div>
}
```

## 📱 响应式支持

### 1. 移动端适配

```css
@media (max-width: 768px) {
  [data-font-size="large"] {
    --font-size-medium: 1rem; /* 移动端适当缩小 */
  }
}
```

### 2. 高DPI屏幕

```css
@media (-webkit-min-device-pixel-ratio: 2) {
  .theme-border-primary {
    border-width: 0.5px; /* 高DPI屏幕使用更细的边框 */
  }
}
```

## 🧪 测试策略

### 1. 视觉回归测试

- 所有主题的截图对比
- 字体大小变化的布局测试
- 动画过渡效果验证

### 2. 可访问性测试

- 颜色对比度检查
- 键盘导航测试
- 屏幕阅读器兼容性

### 3. 性能测试

- 主题切换的响应时间
- CSS变量更新的性能影响
- 内存使用情况监控

## 🔮 未来规划

### 1. 深色模式

- 自动检测系统主题偏好
- 独立的深色主题变量
- 平滑的明暗切换动画

### 2. 高级自定义

- 渐变色主题支持
- 多色彩主题方案
- 用户自定义CSS注入

### 3. 主题市场

- 社区主题分享
- 主题模板库
- 一键导入/导出功能

## 📚 参考资源

- [CSS自定义属性规范](https://www.w3.org/TR/css-variables-1/)
- [WCAG颜色对比度指南](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Material Design颜色系统](https://material.io/design/color/the-color-system.html)
- [Tailwind CSS主题定制](https://tailwindcss.com/docs/theme)
