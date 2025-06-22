# 主题类名使用指南

## 概述

本文档详细说明了如何使用基于CSS变量的主题色和字体大小类名。系统会根据 `data-theme` 和 `data-font-size` 属性自动切换CSS变量值，实现动态主题效果。

## 🎨 主题色类名

### Tailwind 配置的主题色类名

基于 `tailwind.config.js` 中的配置，可以使用以下Tailwind原生类名：

#### 背景色类名

```html
<!-- 主色调背景 - 完整色阶 -->
<div class="bg-theme-primary-50">浅色背景</div>
<div class="bg-theme-primary-100">很浅背景</div>
<div class="bg-theme-primary-200">浅背景</div>
<div class="bg-theme-primary-300">较浅背景</div>
<div class="bg-theme-primary-400">中浅背景</div>
<div class="bg-theme-primary-500">标准背景</div>
<div class="bg-theme-primary-600">较深背景</div>
<div class="bg-theme-primary-700">深背景</div>
<div class="bg-theme-primary-800">很深背景</div>
<div class="bg-theme-primary-900">最深背景</div>

<!-- 语义化背景色 -->
<div class="bg-theme-bg-primary">主要背景</div>
<div class="bg-theme-bg-secondary">次要背景</div>
<div class="bg-theme-bg-accent">强调背景</div>
```

#### 文本色类名

```html
<!-- 主色调文本 - 完整色阶 -->
<p class="text-theme-primary-50">浅色文本</p>
<p class="text-theme-primary-100">很浅文本</p>
<p class="text-theme-primary-200">浅文本</p>
<p class="text-theme-primary-300">较浅文本</p>
<p class="text-theme-primary-400">中浅文本</p>
<p class="text-theme-primary-500">标准文本</p>
<p class="text-theme-primary-600">较深文本</p>
<p class="text-theme-primary-700">深文本</p>
<p class="text-theme-primary-800">很深文本</p>
<p class="text-theme-primary-900">最深文本</p>

<!-- 语义化文本色 -->
<p class="text-theme-text-primary">主要文本</p>
<p class="text-theme-text-secondary">次要文本</p>
<p class="text-theme-text-accent">强调文本</p>
```

#### 边框色类名

```html
<!-- 主色调边框 - 完整色阶 -->
<div class="border border-theme-primary-50">浅色边框</div>
<div class="border border-theme-primary-100">很浅边框</div>
<div class="border border-theme-primary-200">浅边框</div>
<div class="border border-theme-primary-300">较浅边框</div>
<div class="border border-theme-primary-400">中浅边框</div>
<div class="border border-theme-primary-500">标准边框</div>
<div class="border border-theme-primary-600">较深边框</div>
<div class="border border-theme-primary-700">深边框</div>
<div class="border border-theme-primary-800">很深边框</div>
<div class="border border-theme-primary-900">最深边框</div>

<!-- 语义化边框色 -->
<div class="border border-theme-border-primary">主要边框</div>
<div class="border border-theme-border-secondary">次要边框</div>
```

### Components Layer 的主题色类名

基于 `style.css` 中 `@layer components` 的定义，可以直接使用：

#### 快捷主题色类名

```html
<!-- 文本色 -->
<p class="theme-primary">主题色文本</p>
<p class="theme-text-primary">主题色文本（同上）</p>
<p class="theme-text-primary-600">主题色600文本</p>

<!-- 背景色 -->
<div class="theme-bg-primary">主题色背景</div>
<div class="theme-bg-primary-50">主题色50背景</div>
<div class="theme-bg-primary-100">主题色100背景</div>
<div class="theme-bg-primary-500">主题色500背景</div>
<div class="theme-bg-primary-600">主题色600背景</div>

<!-- 边框色 -->
<div class="theme-border-primary">主题色边框</div>
<div class="theme-border-primary-500">主题色500边框</div>
```

## 📝 字体大小类名

### 自动响应式字体大小

**重要特性**：字体大小会根据 `data-font-size` 属性自动变化，无需修改类名！

#### Tailwind 配置的字体大小类名

```html
<!-- 基础字体大小 - 自动响应 data-font-size -->
<p class="text-xs">超小文本 (自动适应)</p>
<p class="text-sm">小文本 (自动适应)</p>
<p class="text-base">基础文本 (自动适应)</p>
<p class="text-lg">大文本 (自动适应)</p>
<p class="text-xl">超大文本 (自动适应)</p>
<p class="text-2xl">2倍大文本 (自动适应)</p>
<p class="text-3xl">3倍大文本 (自动适应)</p>
```

#### Components Layer 的字体大小类名

```html
<!-- 主题感知字体大小 -->
<p class="text-theme-sm">小号主题文本</p>
<p class="text-theme-base">基础主题文本</p>
<p class="text-theme-lg">大号主题文本</p>

<!-- 响应式字体大小 -->
<p class="text-responsive">响应式文本</p>
```

### 字体大小自动变化机制

当 `data-font-size` 属性改变时，CSS变量会自动更新：

```html
<!-- small 字体方案 -->
<html data-font-size="small">
  <p class="text-base">显示为 16px</p>
</html>

<!-- medium 字体方案 -->
<html data-font-size="medium">
  <p class="text-base">显示为 18px</p>
</html>

<!-- large 字体方案 -->
<html data-font-size="large">
  <p class="text-base">显示为 20px</p>
</html>
```

## 🎯 实际使用示例

### 1. 主题感知按钮

```html
<button class="px-4 py-2 text-base text-white rounded-lg  bg-theme-primary-600 hover:bg-theme-primary-700 theme-transition">
  主题色按钮 (自动适应主题和字体)
</button>
```

### 2. 主题感知卡片

```html
<div class="p-4 space-y-3 rounded-lg border  bg-theme-bg-secondary border-theme-border-primary">
  <h3 class="text-lg font-semibold text-theme-text-primary">
    卡片标题 (自动适应)
  </h3>
  <p class="text-base text-theme-text-secondary">
    卡片内容会根据主题和字体设置自动调整
  </p>
</div>
```

### 3. 主题感知表单

```html
<div class="space-y-4">
  <label class="block text-sm font-medium text-theme-text-primary">
    用户名
  </label>
  <input class="px-3 py-2 w-full text-base rounded-lg border  border-theme-border-primary focus:border-theme-primary-500 focus:ring-1 focus:ring-theme-primary-500 theme-transition" type="text" placeholder="请输入用户名">
</div>
```

### 4. 使用Components Layer快捷类名

```html
<!-- 使用快捷类名 -->
<div class="p-4 rounded-lg theme-bg-primary-50 theme-border-primary">
  <h2 class="text-lg font-bold theme-text-primary">快捷主题标题</h2>
  <p class="text-base theme-primary">使用快捷主题色文本</p>
</div>
```

## 🔄 主题切换效果

### 添加平滑过渡

```html
<div class="p-4 text-white rounded-lg  bg-theme-primary-600 theme-transition">
  这个元素会平滑过渡主题变化
</div>
```

### 主题切换示例

```javascript
// 切换主题时，所有使用主题类名的元素都会自动更新
document.documentElement.setAttribute('data-theme', 'purple')
document.documentElement.setAttribute('data-font-size', 'large')
```

## 📋 类名对照表

### 主题色对照表

| 语义化类名 | Tailwind类名 | CSS变量 | 用途 |
|------------|-------------|---------|------|
| `theme-primary` | `text-theme-primary-500` | `var(--theme-primary)` | 主色调文本 |
| `theme-bg-primary` | `bg-theme-primary-600` | `var(--theme-primary)` | 主色调背景 |
| `theme-text-primary` | `text-theme-text-primary` | `var(--theme-text-primary)` | 主要文本 |
| `theme-bg-primary-50` | `bg-theme-primary-50` | `var(--theme-primary-50)` | 浅色背景 |

### 字体大小对照表

| Tailwind类名 | CSS变量 | Small | Medium | Large |
|-------------|---------|--------|--------|--------|
| `text-xs` | `var(--font-size-xs)` | 12px | 14px | 16px |
| `text-sm` | `var(--font-size-sm)` | 14px | 16px | 18px |
| `text-base` | `var(--font-size-base)` | 16px | 18px | 20px |
| `text-lg` | `var(--font-size-lg)` | 18px | 20px | 24px |
| `text-xl` | `var(--font-size-xl)` | 20px | 24px | 30px |

## 💡 最佳实践

### 1. 优先使用语义化类名

```html
<!-- 推荐：语义化 -->
<p class="text-theme-text-primary">主要文本</p>

<!-- 可选：具体色阶 -->
<p class="text-theme-primary-700">深色文本</p>
```

### 2. 组合使用主题类名

```html
<div class="border  bg-theme-bg-secondary border-theme-border-primary text-theme-text-primary theme-transition">
  完整主题感知容器
</div>
```

### 3. 利用自动字体大小特性

```html
<!-- 字体大小会自动适应，无需修改类名 -->
<h1 class="text-2xl font-bold">标题 (自动适应字体设置)</h1>
<p class="text-base">正文 (自动适应字体设置)</p>
<small class="text-sm">小字 (自动适应字体设置)</small>
```

### 4. 添加过渡动画

```html
<button class="bg-theme-primary-600 hover:bg-theme-primary-700 theme-transition">
  平滑过渡按钮
</button>
```

## 🎨 主题预览

不同主题下的效果预览：

### Blue 主题 (默认)

- 主色：`#3B82F6` (蓝色)
- 背景：浅蓝到深蓝渐变
- 文本：深蓝色系

### Purple 主题

- 主色：`#8B5CF6` (紫色)
- 背景：浅紫到深紫渐变
- 文本：深紫色系

### Green 主题

- 主色：`#10B981` (绿色)
- 背景：浅绿到深绿渐变
- 文本：深绿色系

### Custom 主题

- 主色：用户自定义颜色
- 背景：基于自定义色生成的渐变
- 文本：自动计算的对比色

通过这套类名系统，您可以创建完全主题感知的界面，所有元素都会根据用户的主题和字体大小设置自动调整，无需手动修改每个组件的样式！
