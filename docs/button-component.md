# Button 组件

基于 shadcn 风格的可复用 Button 组件，支持多种变体和尺寸。

## 特性

- 🎨 **多种变体**: default, destructive, outline, secondary, ghost, link
- 📏 **多种尺寸**: sm, default, lg, icon
- ♿ **可访问性**: 支持键盘导航和屏幕阅读器
- 🎯 **类型安全**: 完整的 TypeScript 支持
- 🎛️ **可定制**: 支持自定义样式和类名

## 基本用法

```tsx
import { Button } from '~/source/shared/components'

export function MyComponent() {
  return (
    <div>
      <Button>默认按钮</Button>
      <Button variant="outline">轮廓按钮</Button>
      <Button size="sm">小按钮</Button>
    </div>
  )
}
```

## 变体 (Variants)

```tsx
<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
```

## 尺寸 (Sizes)

```tsx
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">
  <Settings className="w-4 h-4" />
</Button>
```

## 带图标

```tsx
import { Plus, Download } from 'lucide-react'

<Button className="gap-2">
  <Plus className="w-4 h-4" />
  添加项目
</Button>

<Button variant="outline" className="gap-2">
  <Download className="w-4 h-4" />
  下载
</Button>
```

## 状态

```tsx
<Button>正常状态</Button>
<Button disabled>禁用状态</Button>
```

## 自定义样式

```tsx
<Button className="bg-purple-600 hover:bg-purple-700">
  自定义紫色
</Button>

<Button className="bg-gradient-to-r from-pink-500 to-violet-500">
  渐变背景
</Button>

<Button className="rounded-full">
  圆形按钮
</Button>
```

## Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `variant` | `ButtonVariant` | `'default'` | 按钮变体 |
| `size` | `ButtonSize` | `'default'` | 按钮尺寸 |
| `className` | `string` | - | 自定义 CSS 类名 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `onClick` | `() => void` | - | 点击事件处理器 |

## 类型定义

```tsx
export type ButtonVariant = 
  | 'default' 
  | 'destructive' 
  | 'outline' 
  | 'secondary' 
  | 'ghost' 
  | 'link'

export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}
```

## 在项目中的使用

已在以下组件中应用：

- `SettingsView` - 设置页面的操作按钮
- `ProfileView` - 用户资料页面的各种按钮
- 其他需要按钮的地方

## 设计原则

1. **一致性**: 所有按钮使用统一的设计语言
2. **可访问性**: 支持键盘导航和适当的对比度
3. **灵活性**: 支持自定义样式而不破坏基础功能
4. **性能**: 轻量级实现，无外部依赖
