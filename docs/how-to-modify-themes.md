# 如何修改主题

## 概述

本指南详细说明了在Craz Chrome扩展中修改主题的各种方式，包括用户界面操作、代码级别修改和系统扩展。

## 🎨 用户界面修改主题

### 1. 通过设置页面修改

用户可以在设置页面直接选择预设主题或自定义颜色：

#### 预设主题

- **蓝色主题** (blue) - 默认主题
- **紫色主题** (purple) - 专业感
- **绿色主题** (green) - 自然感
- **橙色主题** (orange) - 活力感
- **粉色主题** (pink) - 温馨感

#### 自定义主题

1. 在设置页面找到"主题色"部分
2. 在"自定义"输入框中输入6位十六进制颜色代码（如：`3B82F6`）
3. 系统会自动生成完整的色阶并应用

### 2. 即时预览

- 选择主题色时立即生效，无需保存
- 可以实时查看效果
- 满意后点击"保存更改"持久化设置

## 💻 代码级别修改主题

### 1. 使用useTheme Hook

```typescript
import { useTheme } from '~/source/shared/components'

function MyComponent() {
  const { theme, setTheme, setCustomColor } = useTheme()

  const handleChangeTheme = () => {
    // 切换到紫色主题
    setTheme('purple')
  }

  const handleCustomColor = () => {
    // 设置自定义颜色
    setCustomColor('#FF6B6B')
  }

  return (
    <div>
      <p>当前主题: {theme}</p>
      <button onClick={handleChangeTheme}>切换到紫色</button>
      <button onClick={handleCustomColor}>设置自定义红色</button>
    </div>
  )
}
```

### 2. 直接操作DOM属性

```typescript
// 切换主题
document.documentElement.setAttribute('data-theme', 'purple')

// 切换字体大小
document.documentElement.setAttribute('data-font-size', 'large')

// 设置自定义颜色CSS变量
document.documentElement.style.setProperty('--custom-primary-600', '#7C3AED')
```

### 3. 通过API更新用户设置

```typescript
import { useUserProfile } from '~/source/shared/hooks/use-user-profile'

function ThemeUpdater() {
  const { updateSettings } = useUserProfile()

  const updateTheme = async () => {
    await updateSettings.mutateAsync({
      theme: 'green',
      fontSize: 'large'
    })
  }

  return <button onClick={updateTheme}>更新主题设置</button>
}
```

## 🛠️ 系统级别修改主题

### 1. 添加新的预设主题

#### 步骤1：在CSS中定义新主题

```css
/* style.css - @layer base 中添加 */
[data-theme="teal"] {
  --theme-primary: #14B8A6;
  --theme-primary-50: #F0FDFA;
  --theme-primary-100: #CCFBF1;
  --theme-primary-200: #99F6E4;
  --theme-primary-300: #5EEAD4;
  --theme-primary-400: #2DD4BF;
  --theme-primary-500: #14B8A6;
  --theme-primary-600: #0D9488;
  --theme-primary-700: #0F766E;
  --theme-primary-800: #115E59;
  --theme-primary-900: #134E4A;
}
```

#### 步骤2：更新TypeScript类型

```typescript
// source/shared/types/settings.ts
export type Theme = 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'teal' | 'custom'

export const THEME_COLORS = {
  blue: '#3B82F6',
  purple: '#8B5CF6',
  green: '#10B981',
  orange: '#F59E0B',
  pink: '#EC4899',
  teal: '#14B8A6',  // 新增
  custom: '#3B82F6'
} as const
```

#### 步骤3：更新Tailwind配置（如需要）

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      theme: {
        teal: {
          50: 'var(--theme-teal-50)',
          500: 'var(--theme-teal-500)',
          600: 'var(--theme-teal-600)',
          // ... 其他色阶
        }
      }
    }
  }
}
```

### 2. 修改现有主题的颜色

直接在`style.css`的`@layer base`中修改对应主题的CSS变量：

```css
[data-theme="blue"] {
  --theme-primary-600: #1E40AF; /* 改为更深的蓝色 */
  --theme-primary-700: #1E3A8A;
  /* ... 其他色阶 */
}
```

### 3. 添加深色模式支持

```css
/* style.css - @layer base 中添加 */
[data-theme="blue"][data-mode="dark"] {
  --theme-primary-50: #1E3A8A;
  --theme-primary-100: #1E40AF;
  --theme-primary-600: #60A5FA;
  --theme-primary-900: #DBEAFE;
  
  /* 背景和文本色调整 */
  --theme-bg-primary: #1F2937;
  --theme-text-primary: #F9FAFB;
}
```

## 🎛️ 高级主题定制

### 1. 动态主题生成

```typescript
// 创建动态主题生成器
function createDynamicTheme(baseColor: string) {
  const shades = generateColorShades(baseColor)
  
  Object.entries(shades).forEach(([shade, color]) => {
    document.documentElement.style.setProperty(
      `--custom-primary-${shade}`, 
      color
    )
  })
  
  document.documentElement.setAttribute('data-theme', 'custom')
}

// 使用示例
createDynamicTheme('#FF6B6B') // 创建红色主题
```

### 2. 主题动画过渡

```css
/* style.css - @layer utilities 中 */
.theme-transition {
  transition: 
    color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 为特定元素添加更复杂的过渡 */
.theme-transition-complex {
  transition: 
    all 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.2s ease-out;
}
```

### 3. 主题感知组件

```typescript
// 创建主题感知的组件
import { useTheme } from '~/source/shared/components'

function ThemeAwareButton({ children, ...props }) {
  const { theme } = useTheme()
  
  const getThemeClasses = () => {
    switch (theme) {
      case 'purple':
        return 'bg-purple-600 hover:bg-purple-700'
      case 'green':
        return 'bg-green-600 hover:bg-green-700'
      default:
        return 'bg-theme-primary-600 hover:bg-theme-primary-700'
    }
  }

  return (
    <button 
      className={`${getThemeClasses()} text-white px-4 py-2 rounded theme-transition`}
      {...props}
    >
      {children}
    </button>
  )
}
```

## 📱 实际应用示例

### 1. 组件中使用主题色

```tsx
// 使用Tailwind主题类
<div className="bg-theme-primary-600 text-white p-4 rounded-lg">
  这个容器会根据当前主题自动调整颜色
</div>

// 使用自定义主题类
<button className="theme-bg-primary theme-transition hover:opacity-80">
  主题色按钮
</button>

// 响应式主题文本
<p className="text-theme-text-primary text-theme-base">
  这段文字会根据主题和字体设置自动调整
</p>
```

### 2. 条件主题样式

```tsx
import { useTheme } from '~/source/shared/components'

function ConditionalThemeComponent() {
  const { theme } = useTheme()
  
  return (
    <div className={cn(
      "p-4 rounded-lg",
      theme === 'purple' && "bg-purple-50 border border-purple-200",
      theme === 'green' && "bg-green-50 border border-green-200",
      theme !== 'purple' && theme !== 'green' && "bg-theme-bg-secondary border border-theme-border-primary"
    )}>
      主题感知容器
    </div>
  )
}
```

## 🔧 调试和测试主题

### 1. 主题工具函数

```typescript
import { themeUtils } from '~/source/shared/components'

// 获取当前主题色值
const currentColor = themeUtils.getCurrentThemeColor(600)
console.log('当前主题色:', currentColor)

// 获取当前字体大小
const fontSize = themeUtils.getCurrentFontSize('medium')
console.log('当前字体大小:', fontSize)

// 检查主题类名
const classes = themeUtils.getThemeClasses('my-component')
console.log('主题类名:', classes)
```

### 2. 主题测试组件

```tsx
function ThemeDebugger() {
  const { theme, fontSize } = useTheme()
  
  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg border">
      <h3 className="font-semibold mb-2">主题调试器</h3>
      <p>当前主题: {theme}</p>
      <p>字体大小: {fontSize}</p>
      <div className="mt-2 flex gap-2">
        {Object.keys(THEME_COLORS).map(t => (
          <div 
            key={t}
            className="w-4 h-4 rounded border"
            style={{ backgroundColor: THEME_COLORS[t] }}
            title={t}
          />
        ))}
      </div>
    </div>
  )
}
```

## 📋 主题修改清单

### 用户操作

- [ ] 在设置页面选择预设主题
- [ ] 输入自定义颜色代码
- [ ] 预览主题效果
- [ ] 保存主题设置

### 开发者操作

- [ ] 使用`useTheme` Hook
- [ ] 添加新预设主题
- [ ] 修改现有主题颜色
- [ ] 创建主题感知组件
- [ ] 测试主题切换效果

### 系统扩展

- [ ] 添加深色模式支持
- [ ] 实现动态主题生成
- [ ] 优化主题动画效果
- [ ] 创建主题管理工具

## 💡 最佳实践

1. **使用语义化颜色**: 优先使用`text-theme-text-primary`而非具体色阶
2. **添加过渡动画**: 为主题切换添加`theme-transition`类
3. **测试所有主题**: 确保组件在所有主题下都能正常显示
4. **保持一致性**: 遵循现有的主题色使用模式
5. **性能考虑**: 避免频繁的主题切换操作

通过以上方式，您可以灵活地修改和扩展Craz扩展的主题系统，为用户提供丰富的个性化体验。
