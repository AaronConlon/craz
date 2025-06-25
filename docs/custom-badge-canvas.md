# 自定义 Canvas Badge 实现

## 功能概述

使用 Canvas 绘制自定义图标替换 Chrome 扩展的默认 badge，显示当前打开的标签页数量。

## 核心特性

### 1. 高质量图标绘制

- 使用 2x 缩放提升图标清晰度
- 多尺寸支持: 16, 19, 32, 38, 48, 128px
- 自适应字体大小
- 专业视觉效果: 内阴影、边框、文字阴影

### 2. 智能数字显示

- 支持显示 1-999，超过显示 "999"
- 字体大小自适应数字长度
- 精确居中对齐

### 3. 主题色集成

- 背景色: `#3b82f6` (theme-primary-500)
- 文字色: `#ffffff`
- 渐变内阴影效果

## 技术实现

### 核心函数

```typescript
// 绘制自定义图标
async function drawCustomIcon(tabCount: number, size: number = 19)

// 创建多尺寸图标
async function createMultiSizeIcons(tabCount: number)

// 更新扩展图标
async function updateBadge()
```

### 视觉规范

- 圆形背景，半径 = size/2 - 1
- 字体大小比例: 1位数65%，2位数55%，3位数45%
- 高分辨率渲染 (2x scale)

## 优势

- 数字更大更清晰
- 完全自定义样式
- 多尺寸完美适配
- 自动回退机制保证兼容性
