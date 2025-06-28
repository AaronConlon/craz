# Jost 字体集成指南

本文档详细说明了如何在 Plasmo Chrome 扩展中正确集成和使用 Jost 字体。

## 🎯 目标

- 在扩展的所有组件中使用 Jost 字体
- 确保字体只在插件内部生效，不影响网页内容
- 支持多种字重 (400, 500, 600, 700)
- 兼容深色模式和主题系统

## 📁 文件结构

```
assets/
├── jost.ttf           # 字体文件
└── fonts.css          # 全局字体定义

contents/
└── fonts.css          # Content Script 字体定义

tailwind.config.js     # Tailwind 字体配置
style.css              # 全局样式和字体导入
```

## 🔧 实现细节

### 1. 字体定义文件

#### `assets/fonts.css`

使用 Plasmo 推荐的 `data-base64` 方案内联字体：

```css
@font-face {
  font-family: "Jost";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(data-base64:~assets/jost.ttf) format("truetype");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
    U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215,
    U+FEFF, U+FFFD;
}
```

#### `contents/fonts.css`

Content Script 专用字体定义，确保在网页中正确加载。

### 2. Tailwind CSS 配置

在 `tailwind.config.js` 中添加字体族配置：

```javascript
theme: {
  extend: {
    fontFamily: {
      'jost': ['Jost', 'Inter', 'system-ui', 'sans-serif'],
      'sans': ['Jost', 'Inter', 'system-ui', 'sans-serif'], // 默认字体
    },
  }
}
```

### 3. 样式导入策略

#### Popup 和 Sidepanel

```typescript
import "data-text:~assets/fonts.css"
```

#### Content Scripts

```typescript
import type { PlasmoCSConfig } from "plasmo"
import fontsCssText from "data-text:./fonts.css"

export const config: PlasmoCSConfig = {
  css: ["fonts.css"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = fontsCssText + '\n' + cssText
  return style
}
```

#### Tab Pages

```typescript
import "~style.css"
import "data-text:~assets/fonts.css"
```

## 🎨 使用方法

### 1. Tailwind 类名

```jsx
// 使用 Jost 字体
<div className="font-jost">Jost 字体文本</div>

// 使用默认字体（已设为 Jost）
<div className="font-sans">默认字体文本</div>

// 不同字重
<div className="font-normal">正常字重 (400)</div>
<div className="font-medium">中等字重 (500)</div>
<div className="font-semibold">半粗体 (600)</div>
<div className="font-bold">粗体 (700)</div>
```

### 2. 内联样式

```jsx
// 直接指定字体族
<div style={{ fontFamily: 'Jost, Inter, system-ui, sans-serif' }}>
  内联样式文本
</div>
```

### 3. CSS 类

```css
.my-component {
  font-family: 'Jost', 'Inter', system-ui, sans-serif;
}
```

## 🔍 字体加载验证

### 开发者工具检查

1. 打开浏览器开发者工具
2. 前往 **Network** 标签页
3. 刷新扩展，查看是否有字体请求
4. 由于使用 `data-base64` 内联，不会看到网络请求

### 视觉检查

1. 访问字体测试页面：`chrome-extension://[extension-id]/tabs/font-test.html`
2. 对比 Jost 字体和回退字体的显示差异
3. 验证不同字重是否正确显示

### Console 检查

```javascript
// 检查字体是否已加载
document.fonts.check('16px Jost')
// 应该返回 true

// 获取所有已加载字体
[...document.fonts].map(font => font.family)
// 应该包含 'Jost'
```

## 🛡️ 安全性考虑

### 1. 作用域隔离

- **Content Scripts**: 字体通过 Shadow DOM 隔离，不影响网页
- **Popup/Sidepanel**: 在独立的扩展上下文中运行
- **Tab Pages**: 完全独立的扩展页面

### 2. 性能优化

- 使用 `font-display: swap` 优化加载体验
- 限制 `unicode-range` 减少字体文件大小
- 内联字体避免额外的网络请求

## 📊 支持的组件

| 组件类型 | 支持状态 | 配置方式 |
|---------|---------|----------|
| Popup | ✅ 完全支持 | `import "data-text:~assets/fonts.css"` |
| Sidepanel | ✅ 完全支持 | `import "data-text:~assets/fonts.css"` |
| Content Scripts | ✅ 完全支持 | `PlasmoCSConfig.css + getStyle()` |
| Tab Pages | ✅ 完全支持 | `import "data-text:~assets/fonts.css"` |
| Background | ❌ 不适用 | 后台脚本无UI |

## 🐛 故障排除

### 问题 1: 字体未生效

**可能原因**:

- 字体文件路径错误
- 未正确导入字体CSS
- CSS 优先级问题

**解决方案**:

```css
/* 使用 !important 强制应用 */
.force-jost {
  font-family: 'Jost', 'Inter', system-ui, sans-serif !important;
}
```

### 问题 2: Content Script 中字体不显示

**可能原因**:

- 网页CSS覆盖了字体设置
- Shadow DOM 隔离问题

**解决方案**:

```typescript
// 确保在 getStyle 中正确包含字体
export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = `
    @font-face { /* Jost 字体定义 */ }
    
    /* 强制应用到 Shadow DOM */
    :host {
      font-family: 'Jost', 'Inter', system-ui, sans-serif !important;
    }
    
    * {
      font-family: inherit !important;
    }
  ` + cssText
  return style
}
```

### 问题 3: 字重不正确

**可能原因**:

- 只定义了部分字重
- Tailwind 类名与字体定义不匹配

**解决方案**:
确保所有需要的字重都在 `fonts.css` 中定义，并且 `font-weight` 值与 Tailwind 类名匹配。

## 📈 最佳实践

1. **一致性**: 在所有组件中使用相同的字体导入方式
2. **回退方案**: 始终提供回退字体族
3. **性能**: 只加载需要的字重
4. **测试**: 在不同浏览器和设备上测试字体显示
5. **文档**: 保持字体使用文档的更新

## 🔗 相关链接

- [Plasmo 字体文档](https://docs.plasmo.com/framework/content-scripts-ui/styling#custom-font)
- [Tailwind CSS 字体配置](https://tailwindcss.com/docs/font-family)
- [Web 字体最佳实践](https://web.dev/font-best-practices/)

---

🎉 现在你可以在整个 Plasmo 扩展中享受 Jost 字体带来的现代、优雅的用户体验！
