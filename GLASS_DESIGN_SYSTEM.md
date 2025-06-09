# 毛玻璃设计系统

这个项目使用了统一的毛玻璃设计系统，所有样式都被抽取到 Tailwind CSS 配置中，便于复用和维护。

## 🎨 可用的毛玻璃样式类

### 基础样式

#### `.glass`

基础毛玻璃效果，适用于一般容器

```tsx
<div className="glass rounded-lg p-4">
  基础毛玻璃容器
</div>
```

- **背景**: `rgba(255, 255, 255, 0.1)`
- **模糊**: `blur(10px)`
- **边框**: `1px solid rgba(255, 255, 255, 0.2)`

#### `.glass-container`

主要容器样式，用于最外层包装

```tsx
<div className="glass-container rounded-2xl p-6">
  主要容器内容
</div>
```

- **背景**: 白色渐变 `(30% → 10%)`
- **模糊**: `blur(20px)`
- **阴影**: 大阴影效果
- **用途**: 模态框、主要卡片

#### `.glass-card`

卡片样式，适用于内容区域

```tsx
<div className="glass-card rounded-lg p-4">
  卡片内容
</div>
```

- **背景**: `rgba(255, 255, 255, 0.2)`
- **模糊**: `blur(8px)`
- **用途**: 内容分区、子组件

### 表单样式

#### `.glass-input`

输入框专用样式

```tsx
<input 
  className="glass-input rounded-md p-2 focus:ring-2 focus:ring-blue-500"
  placeholder="输入内容..."
/>
```

- **背景**: `rgba(255, 255, 255, 0.9)`
- **模糊**: `blur(4px)`
- **特点**: 高透明度，便于输入

### 交互样式

#### `.glass-hover`

悬停效果，包含过渡动画

```tsx
<button className="glass-hover p-2 rounded hover:text-blue-600">
  悬停按钮
</button>
```

- **默认**: 透明背景
- **悬停**: `rgba(255, 255, 255, 0.3)` + `blur(6px)`
- **过渡**: `0.2s ease-in-out`

#### `.glass-active`

激活状态样式

```tsx
<div className={`p-3 ${isActive ? 'glass-active' : 'glass-hover'}`}>
  可激活项目
</div>
```

- **背景**: `rgba(59, 130, 246, 0.2)` (蓝色主题)
- **左边框**: `4px solid rgba(59, 130, 246, 0.8)`
- **用途**: 选中状态、激活标签

### 遮罩样式

#### `.glass-overlay`

遮罩背景，用于模态框背景

```tsx
<div className="fixed inset-0 glass-overlay" onClick={onClose}>
  <!-- 遮罩背景 -->
</div>
```

- **背景**: 黑色渐变 `(10% → 30%)`
- **模糊**: `blur(4px)`
- **用途**: 模态框遮罩、背景模糊

## 🛠️ 使用示例

### 模态框结构

```tsx
{/* 遮罩背景 */}
<div className="fixed inset-0 glass-overlay" onClick={onClose} />

{/* 主容器 */}
<div className="fixed inset-0 flex items-center justify-center p-4">
  <div className="glass-container rounded-2xl max-w-2xl w-full">
    {/* 头部 */}
    <div className="glass-card p-4 border-b border-white/20">
      <h2>标题</h2>
    </div>
    
    {/* 内容 */}
    <div className="p-4">
      <input className="glass-input w-full p-2 rounded" />
      <button className="glass-hover p-2 rounded">按钮</button>
    </div>
  </div>
</div>
```

### 列表项目

```tsx
{items.map(item => (
  <div 
    key={item.id}
    className={`glass-hover p-3 cursor-pointer ${
      item.active ? 'glass-active' : ''
    }`}
    onClick={() => handleClick(item)}
  >
    {item.content}
  </div>
))}
```

## 🎯 设计原则

1. **层次分明**: 不同透明度营造视觉深度
2. **一致性**: 统一的毛玻璃设计语言
3. **可访问性**: 保证文字对比度和可读性
4. **性能优化**: 合理使用模糊效果，避免过度渲染

## 📱 响应式考虑

所有毛玻璃样式都支持响应式设计，可以与 Tailwind 的响应式前缀组合使用：

```tsx
<div className="glass md:glass-container rounded-lg md:rounded-2xl">
  响应式毛玻璃容器
</div>
```

## 🔧 自定义扩展

如需添加新的毛玻璃样式，请在 `tailwind.config.js` 的 plugins 部分添加：

```js
const glassUtils = {
  '.glass-custom': {
    'background': 'rgba(255, 255, 255, 0.15)',
    'backdrop-filter': 'blur(12px)',
    'border': '1px solid rgba(255, 255, 255, 0.25)',
  }
}
```

遵循命名规范：`glass-{用途}` 或 `glass-{状态}`
