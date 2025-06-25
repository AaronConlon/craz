# 自定义 Canvas Badge 实现

## 功能概述

使用 Canvas 绘制自定义图标替换 Chrome 扩展的默认 badge，显示当前打开的标签页数量。相比默认 badge，自定义图标提供更大的数字显示、更好的视觉效果和更高的自定义度。

## 核心特性

### 1. 高质量图标绘制

- **高分辨率**: 使用 2x 缩放提升图标清晰度
- **多尺寸支持**: 自动生成 16, 19, 32, 38, 48, 128 等多种尺寸
- **自适应字体**: 根据数字长度和图标尺寸自动调整字体大小
- **视觉效果**: 内阴影、边框、文字阴影等专业视觉效果

### 2. 智能数字显示

- **最大显示**: 支持显示 1-999，超过显示 "999"
- **字体优化**: 单数字 65%、双数字 55%、三数字 45% 的尺寸比例
- **居中对齐**: 精确的文字居中对齐算法

### 3. 主题色集成

- **背景色**: 使用项目主题色 `#3b82f6` (theme-primary-500)
- **文字色**: 白色 `#ffffff` 确保最佳对比度
- **渐变效果**: 径向渐变内阴影增强立体感

## 技术实现

### 核心绘制函数

```typescript
async function drawCustomIcon(tabCount: number, size: number = 19) {
  // 创建高分辨率 canvas
  const scale = 2
  const canvas = new OffscreenCanvas(size * scale, size * scale)
  const ctx = canvas.getContext("2d")
  
  // 格式化数字显示
  const displayText = tabCount > 999 ? "999" : tabCount.toString()
  
  // 高质量渲染设置
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  ctx.scale(scale, scale)
  
  // 绘制圆形背景
  const center = size / 2
  const radius = size / 2 - 1
  
  ctx.fillStyle = "#3b82f6"
  ctx.beginPath()
  ctx.arc(center, center, radius, 0, 2 * Math.PI)
  ctx.fill()
  
  // 添加渐变内阴影
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius)
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.1)")
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.1)")
  ctx.fillStyle = gradient
  ctx.fill()
  
  // 绘制边框
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
  ctx.lineWidth = 0.5
  ctx.stroke()
  
  // 自适应字体大小
  let fontSize = size * 0.6
  if (displayText.length === 1) fontSize = size * 0.65
  else if (displayText.length === 2) fontSize = size * 0.55
  else fontSize = size * 0.45
  
  // 绘制文字
  ctx.fillStyle = "#ffffff"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`
  
  // 文字阴影效果
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
  ctx.shadowBlur = 1
  ctx.shadowOffsetY = 1
  
  ctx.fillText(displayText, center, center)
  
  return ctx.getImageData(0, 0, size * scale, size * scale)
}
```

### 多尺寸图标生成

```typescript
async function createMultiSizeIcons(tabCount: number) {
  const sizes = [16, 19, 32, 38, 48, 128]
  const icons: { [key: string]: ImageData } = {}
  
  for (const size of sizes) {
    const icon = await drawCustomIcon(tabCount, size)
    if (icon) {
      icons[size.toString()] = icon
    }
  }
  
  return Object.keys(icons).length > 0 ? icons : null
}
```

### 图标更新逻辑

```typescript
async function updateBadge() {
  const tabs = await chrome.tabs.query({})
  const tabCount = tabs.length
  
  if (tabCount === 0) {
    // 恢复原始图标
    await chrome.action.setIcon({
      path: {
        "16": "assets/icon.png",
        "32": "assets/icon.png", 
        "48": "assets/icon.png",
        "128": "assets/icon.png"
      }
    })
    await chrome.action.setBadgeText({ text: "" })
    return
  }
  
  // 设置自定义图标
  const customIcons = await createMultiSizeIcons(tabCount)
  if (customIcons) {
    await chrome.action.setIcon({ imageData: customIcons })
    await chrome.action.setBadgeText({ text: "" }) // 清除默认badge
  } else {
    // 回退到默认badge
    await chrome.action.setBadgeText({
      text: tabCount > 999 ? "999" : tabCount.toString()
    })
    await chrome.action.setBadgeBackgroundColor({ color: "#3b82f6" })
    await chrome.action.setBadgeTextColor({ color: "#ffffff" })
  }
}
```

## 视觉设计规范

### 颜色方案

- **主背景**: `#3b82f6` (主题蓝色)
- **文字颜色**: `#ffffff` (纯白)
- **边框颜色**: `rgba(255, 255, 255, 0.3)` (半透明白色)
- **内阴影**: 白色到黑色的径向渐变 (10% 透明度)
- **文字阴影**: `rgba(0, 0, 0, 0.3)` 向下偏移 1px

### 尺寸规范

- **图标尺寸**: 16px, 19px, 32px, 38px, 48px, 128px
- **圆形半径**: `size / 2 - 1` (留出边框空间)
- **字体大小比例**:
  - 1位数字: 65% 图标尺寸
  - 2位数字: 55% 图标尺寸  
  - 3位数字: 45% 图标尺寸

### 字体规范

- **字体族**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`
- **字重**: `bold`
- **对齐**: 水平和垂直居中

## 性能优化

### 1. 渲染优化

- 使用 `OffscreenCanvas` 避免 DOM 操作
- 2x 高分辨率渲染提升清晰度
- `imageSmoothingQuality: "high"` 高质量抗锯齿

### 2. 缓存策略

- 仅在标签页数量变化时重新绘制
- 多尺寸图标一次性生成，避免重复计算

### 3. 错误处理

- Canvas 绘制失败时自动回退到默认 badge
- 详细的错误日志记录
- 静默处理错误，不影响扩展主功能

## 兼容性考虑

### Chrome API 兼容性

- 使用 `chrome.action.setIcon()` 设置图标
- 支持 `imageData` 格式的多尺寸图标
- 兼容 Manifest V3 规范

### 浏览器兼容性

- Chrome 88+ (OffscreenCanvas 支持)
- Edge 88+ (基于 Chromium)
- 自动回退机制确保旧版本兼容性

## 测试功能

### 开发模式测试

```typescript
async function testCustomIconDrawing() {
  // 测试不同数字的绘制
  const testCounts = [1, 12, 123, 999, 1234]
  
  for (const count of testCounts) {
    const icon = await drawCustomIcon(count, 19)
    console.log(`绘制数字 ${count}: ${icon ? '成功' : '失败'}`)
  }
  
  // 测试多尺寸图标
  const multiSizeIcons = await createMultiSizeIcons(42)
  console.log(`多尺寸图标: ${Object.keys(multiSizeIcons).join(', ')}`)
}
```

### 手动测试步骤

1. 构建并加载扩展到 Chrome
2. 观察扩展图标是否显示自定义圆形数字
3. 打开/关闭标签页，验证数字实时更新
4. 测试 1-999 范围内的数字显示
5. 测试超过 999 时显示 "999"
6. 验证无标签页时恢复原始图标

## 日志输出示例

```
[Background] 🎨 测试自定义图标绘制功能...
[Background] ✅ 成功绘制数字 1 的图标 (38x38)
[Background] ✅ 成功绘制数字 12 的图标 (38x38)
[Background] ✅ 成功绘制数字 123 的图标 (38x38)
[Background] ✅ 成功绘制数字 999 的图标 (38x38)
[Background] ✅ 成功绘制数字 1234 的图标 (38x38)
[Background] ✅ 成功创建多尺寸图标: 16, 19, 32, 38, 48, 128
[Background] 🎨 自定义图标绘制测试完成
[Background] 更新 Badge: 8 个标签页
[Background] 🚀 Craz Extension 后台脚本启动完成
```

## 优势对比

### 相比默认 Badge

| 特性 | 默认 Badge | 自定义 Canvas |
|------|------------|---------------|
| 数字大小 | 小，受限 | 大，占满图标 |
| 视觉效果 | 基础 | 专业渐变阴影 |
| 自定义度 | 低 | 高度可定制 |
| 多尺寸支持 | 有限 | 完整支持 |
| 性能影响 | 极低 | 低 |
| 兼容性 | 完美 | 良好(有回退) |

## 未来扩展

### 1. 主题色同步

```typescript
// 从用户设置读取主题色
const themeColor = await getUserThemeColor()
ctx.fillStyle = themeColor
```

### 2. 图标样式选项

- 圆形/方形/圆角方形
- 不同的渐变效果
- 可配置的阴影强度

### 3. 动画效果

- 数字变化时的动画过渡
- 脉冲效果表示活跃状态

### 4. 更多信息显示

- 显示未读通知数量
- 显示特定网站的标签页数量
- 颜色编码表示不同类型的标签页
