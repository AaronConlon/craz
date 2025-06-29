# Sky 清新天蓝主题色系统

## 🎨 颜色系统概览

基于 Tailwind CSS Sky 色系构建的清新天蓝主题，专为现代界面设计打造。

### 🎯 主色调特性

- **基础色**: `#0ea5e9` (sky-500)
- **色相**: 清新天蓝色调，明亮而现代
- **明度**: 适中偏亮，在深浅色背景上都有良好可读性
- **饱和度**: 高饱和度，充满活力和现代感

## 📊 完整颜色变体系统

### Tailwind Sky 色系 (50-900)

| 级别 | HEX值 | RGB值 | 用途说明 |
|------|-------|-------|----------|
| 50 | `#f0f9ff` | (240, 249, 255) | 最浅背景，深色模式文字 |
| 100 | `#e0f2fe` | (224, 242, 254) | 浅色背景，深色模式次要文字 |
| 200 | `#bae6fd` | (186, 230, 253) | 边框，分隔线 |
| 300 | `#7dd3fc` | (125, 211, 252) | 禁用状态，占位符 |
| 400 | `#38bdf8` | (56, 189, 248) | 次要元素 |
| 500 | `#0ea5e9` | (14, 165, 233) | **主题色，标准亮度** ⭐ |
| 600 | `#0284c7` | (2, 132, 199) | 主要按钮，深色 |
| 700 | `#0369a1` | (3, 105, 161) | 深色背景 |
| 800 | `#075985` | (7, 89, 133) | 更深背景 |
| 900 | `#0c4a6e` | (12, 74, 110) | 最深背景，接近深蓝 |

## 🌓 深浅色模式适配

### 浅色模式使用

```css
/* 主要背景 */
.bg-white { background-color: #ffffff; }

/* 次要背景 */
.bg-sky-50 { background-color: #f0f9ff; }

/* 文字色 */
.text-sky-900 { color: #0c4a6e; }
.text-sky-600 { color: #0284c7; }

/* 边框 */
.border-sky-200 { border-color: #bae6fd; }
```

### 深色模式使用

```css
/* 主要背景 */
.dark:bg-gray-900 { background-color: #111827; }

/* 次要背景 */
.dark:bg-gray-800 { background-color: #1f2937; }

/* 文字色 */
.dark:text-sky-50 { color: #f0f9ff; }
.dark:text-sky-300 { color: #7dd3fc; }

/* 边框 */
.dark:border-sky-700 { border-color: #0369a1; }
```

## 🎨 设计原则

### 清新活力

- **现代感**: 明亮的天蓝色传达创新和活力
- **亲和力**: 天空般的颜色让人感到舒适和信任
- **专业感**: 适合科技产品和现代应用

### 可访问性

- ✅ **WCAG AAA**: 在白色背景上对比度 4.5:1+
- ✅ **深色友好**: 在深色背景上可读性优秀
- ✅ **渐进层次**: 清晰的视觉层次结构

## 🔧 CSS 变量实现

```css
[data-theme="sky"] {
  --theme-primary: #0ea5e9;
  --theme-primary-50: #f0f9ff;
  --theme-primary-100: #e0f2fe;
  --theme-primary-200: #bae6fd;
  --theme-primary-300: #7dd3fc;
  --theme-primary-400: #38bdf8;
  --theme-primary-500: #0ea5e9;  /* 基础色 ⭐ */
  --theme-primary-600: #0284c7;
  --theme-primary-700: #0369a1;
  --theme-primary-800: #075985;
  --theme-primary-900: #0c4a6e;
}
```

## 🌟 使用场景

### 适合的应用类型

- **科技产品**: 软件工具、移动应用
- **创新平台**: 设计工具、创意软件
- **现代服务**: 云服务、SaaS 产品
- **社交媒体**: 社交应用、通讯工具

### 搭配建议

- **强调色**: 可搭配橙色、绿色作为强调
- **语义色**: 红色(错误)、绿色(成功)、黄色(警告)
- **中性色**: 灰色系作为辅助和背景

## ✨ 优势特点

- 🌟 **活力四射**: 明亮的天蓝色充满活力和现代感
- 🌓 **模式友好**: 深浅色模式完美适配
- 🎨 **搭配灵活**: 与多种颜色组合和谐
- 👁️ **视觉舒适**: 清新的颜色让人感到愉悦
- 🚀 **现代感**: 传达创新和前沿的品牌形象

这个 Sky 天蓝主题完美适合现代应用，带来清新活力的用户体验！
