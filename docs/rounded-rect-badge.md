# 圆角矩形 Canvas Badge 实现

## 设计更新
已将原来的圆形设计改为圆角矩形设计，提供更现代的视觉效果。

## 核心特性

### 1. 圆角矩形设计
- **形状**: 长方形，border-radius: 3px
- **尺寸**: 填满整个图标区域，留出 1px 边距
- **兼容性**: 支持原生 roundRect 和手动绘制两种方式

### 2. 优化的字体显示
- **更大字体**: 利用矩形更多的水平空间
- **字体比例**:
  - 1位数字: 75% 图标尺寸
  - 2位数字: 65% 图标尺寸  
  - 3位数字: 55% 图标尺寸

### 3. 视觉效果升级
- **线性渐变**: 从上到下的渐变效果，更适合矩形
- **渐变层次**: 顶部高光 15% → 中部 5% → 底部阴影 10%
- **边框**: 半透明白色边框增强立体感

## 技术实现

### 圆角矩形绘制
\`\`\`typescript
// 兼容性检查
if (typeof ctx.roundRect === 'function') {
  // Chrome 99+ 原生支持
  ctx.roundRect(rectX, rectY, rectWidth, rectHeight, 3)
} else {
  // 手动绘制圆角矩形
  // 使用 quadraticCurveTo 创建圆角
}
\`\`\`

### 线性渐变效果
\`\`\`typescript
const gradient = ctx.createLinearGradient(rectX, rectY, rectX, rectY + rectHeight)
gradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)') // 顶部高光
gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)') // 中部过渡
gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)') // 底部阴影
\`\`\`

## 优势
- 更现代的视觉设计
- 更大的数字显示空间
- 更好的可读性
- 符合当前 UI 设计趋势
