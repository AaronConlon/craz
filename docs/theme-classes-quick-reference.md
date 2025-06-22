# 主题类名快速参考 🚀

## 🎨 主题色类名

### Tailwind 原生类名 (推荐)

```html
<!-- 背景色 -->
bg-theme-primary-{50|100|200|300|400|500|600|700|800|900}
bg-theme-bg-{primary|secondary|accent}

<!-- 文本色 -->
text-theme-primary-{50|100|200|300|400|500|600|700|800|900}
text-theme-text-{primary|secondary|accent}

<!-- 边框色 -->
border-theme-primary-{50|100|200|300|400|500|600|700|800|900}
border-theme-border-{primary|secondary}
```

### Components 快捷类名

```html
<!-- 文本 -->
theme-primary, theme-text-primary, theme-text-primary-600

<!-- 背景 -->
theme-bg-primary, theme-bg-primary-{50|100|500|600}

<!-- 边框 -->
theme-border-primary, theme-border-primary-500
```

## 📝 字体大小类名

### 自动响应式 (无需修改类名)

```html
text-{xs|sm|base|lg|xl|2xl|3xl}
```

### Components 主题字体

```html
text-theme-{sm|base|lg}, text-responsive
```

## 🔄 过渡动画

```html
theme-transition  <!-- 添加平滑过渡效果 -->
```

## 💡 常用组合

### 主题按钮

```html
<button class="bg-theme-primary-600 text-white hover:bg-theme-primary-700 px-4 py-2 rounded-lg text-base theme-transition">
  按钮
</button>
```

### 主题卡片

```html
<div class="bg-theme-bg-secondary border border-theme-border-primary rounded-lg p-4">
  <h3 class="text-theme-text-primary text-lg font-semibold">标题</h3>
  <p class="text-theme-text-secondary text-base">内容</p>
</div>
```

### 主题输入框

```html
<input class="w-full px-3 py-2 border border-theme-border-primary rounded-lg text-base focus:border-theme-primary-500 theme-transition">
```

## 🎯 关键特性

- ✅ **主题色**：根据 `data-theme` 自动切换
- ✅ **字体大小**：根据 `data-font-size` 自动调整
- ✅ **无需修改**：类名保持不变，CSS变量自动更新
- ✅ **平滑过渡**：添加 `theme-transition` 类实现动画
- ✅ **完整色阶**：支持 50-900 的完整色阶系统

## 🔧 主题切换

```javascript
// JavaScript 切换
document.documentElement.setAttribute('data-theme', 'purple')
document.documentElement.setAttribute('data-font-size', 'large')
```

```typescript
// React Hook 切换
const { setTheme, setFontSize } = useTheme()
setTheme('green')
setFontSize('medium')
```
