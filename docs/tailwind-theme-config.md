# Tailwind 主题配置文档

## 概述

为Tailwind CSS配置了基于CSS变量的主题系统，使得主题色和字体大小可以动态切换，同时保持Tailwind类名的一致性。

## 新增的Tailwind类

### 主题色类

#### 主色调 (Primary Colors)

```css
/* 文本色 */
text-theme-primary-50   /* var(--theme-primary-50) */
text-theme-primary-100  /* var(--theme-primary-100) */
text-theme-primary-200  /* var(--theme-primary-200) */
text-theme-primary-300  /* var(--theme-primary-300) */
text-theme-primary-400  /* var(--theme-primary-400) */
text-theme-primary-500  /* var(--theme-primary-500) */
text-theme-primary-600  /* var(--theme-primary-600) */
text-theme-primary-700  /* var(--theme-primary-700) */
text-theme-primary-800  /* var(--theme-primary-800) */
text-theme-primary-900  /* var(--theme-primary-900) */

/* 背景色 */
bg-theme-primary-50     /* var(--theme-primary-50) */
bg-theme-primary-100    /* var(--theme-primary-100) */
bg-theme-primary-200    /* var(--theme-primary-200) */
bg-theme-primary-300    /* var(--theme-primary-300) */
bg-theme-primary-400    /* var(--theme-primary-400) */
bg-theme-primary-500    /* var(--theme-primary-500) */
bg-theme-primary-600    /* var(--theme-primary-600) */
bg-theme-primary-700    /* var(--theme-primary-700) */
bg-theme-primary-800    /* var(--theme-primary-800) */
bg-theme-primary-900    /* var(--theme-primary-900) */

/* 边框色 */
border-theme-primary-50   /* var(--theme-primary-50) */
border-theme-primary-100  /* var(--theme-primary-100) */
/* ... 其他色阶 */
border-theme-primary-900  /* var(--theme-primary-900) */
```

#### 语义化颜色

```css
/* 背景色 */
bg-theme-bg-primary     /* var(--theme-bg-primary) */
bg-theme-bg-secondary   /* var(--theme-bg-secondary) */
bg-theme-bg-accent      /* var(--theme-bg-accent) */

/* 文本色 */
text-theme-text-primary     /* var(--theme-text-primary) */
text-theme-text-secondary   /* var(--theme-text-secondary) */
text-theme-text-accent      /* var(--theme-text-accent) */

/* 边框色 */
border-theme-border-primary     /* var(--theme-border-primary) */
border-theme-border-secondary   /* var(--theme-border-secondary) */
```

### 字体大小类

```css
text-theme-xs     /* var(--theme-font-xs) + line-height: var(--theme-line-height-xs) */
text-theme-sm     /* var(--theme-font-sm) + line-height: var(--theme-line-height-sm) */
text-theme-base   /* var(--theme-font-base) + line-height: var(--theme-line-height-base) */
text-theme-lg     /* var(--theme-font-lg) + line-height: var(--theme-line-height-lg) */
text-theme-xl     /* var(--theme-font-xl) + line-height: var(--theme-line-height-xl) */
text-theme-2xl    /* var(--theme-font-2xl) + line-height: var(--theme-line-height-2xl) */
text-theme-3xl    /* var(--theme-font-3xl) + line-height: var(--theme-line-height-3xl) */
```

### 间距类

```css
p-theme-xs        /* padding: var(--theme-spacing-xs) */
p-theme-sm        /* padding: var(--theme-spacing-sm) */
p-theme-base      /* padding: var(--theme-spacing-base) */
p-theme-lg        /* padding: var(--theme-spacing-lg) */
p-theme-xl        /* padding: var(--theme-spacing-xl) */

/* 同样适用于 m-, px-, py-, mx-, my- 等所有间距类 */
m-theme-xs        /* margin: var(--theme-spacing-xs) */
mx-theme-sm       /* margin-left/right: var(--theme-spacing-sm) */
py-theme-base     /* padding-top/bottom: var(--theme-spacing-base) */
```

## 使用示例

### 基础使用

```jsx
// 主题色按钮
<button className="bg-theme-primary-600 text-white hover:bg-theme-primary-700">
  主题色按钮
</button>

// 响应式字体大小
<p className="text-theme-base">
  这段文字会根据用户的字体大小设置自动调整
</p>

// 语义化颜色
<div className="bg-theme-bg-secondary border border-theme-border-primary">
  <h3 className="text-theme-text-primary">标题</h3>
  <p className="text-theme-text-secondary">副标题</p>
</div>
```

### 组合使用

```jsx
// 主题感知的卡片组件
<div className="
  bg-theme-bg-accent 
  border border-theme-border-secondary 
  p-theme-base 
  rounded-lg
">
  <h3 className="text-theme-lg text-theme-text-primary mb-theme-sm">
    卡片标题
  </h3>
  <p className="text-theme-base text-theme-text-secondary">
    卡片内容，会根据主题色和字体大小设置自动调整
  </p>
</div>
```

## 配置详情

### Tailwind配置 (tailwind.config.js)

```javascript
theme: {
  extend: {
    colors: {
      theme: {
        // 主色调
        'primary': {
          50: 'var(--theme-primary-50)',
          100: 'var(--theme-primary-100)',
          // ... 其他色阶
          900: 'var(--theme-primary-900)',
        },
        // 语义化颜色
        'bg': {
          'primary': 'var(--theme-bg-primary)',
          'secondary': 'var(--theme-bg-secondary)',
          'accent': 'var(--theme-bg-accent)',
        },
        // 其他语义化颜色...
      }
    },
    fontSize: {
      'theme-xs': ['var(--theme-font-xs)', { lineHeight: 'var(--theme-line-height-xs)' }],
      'theme-sm': ['var(--theme-font-sm)', { lineHeight: 'var(--theme-line-height-sm)' }],
      // ... 其他字体大小
    },
    spacing: {
      'theme-xs': 'var(--theme-spacing-xs)',
      'theme-sm': 'var(--theme-spacing-sm)',
      // ... 其他间距
    },
  }
}
```

### CSS变量映射

```css
:root {
  /* 基础字体大小 */
  --font-size-xs: 0.75rem;     /* 12px */
  --font-size-sm: 0.875rem;    /* 14px */
  --font-size-base: 1rem;      /* 16px */
  --font-size-lg: 1.125rem;    /* 18px */
  
  /* Tailwind兼容变量 */
  --theme-font-xs: var(--font-size-xs);
  --theme-font-sm: var(--font-size-small);
  --theme-font-base: var(--font-size-medium);
  --theme-font-lg: var(--font-size-large);
  
  /* 行高变量 */
  --theme-line-height-xs: 1.2;
  --theme-line-height-sm: var(--line-height-small);
  --theme-line-height-base: var(--line-height-medium);
  --theme-line-height-lg: var(--line-height-large);
}
```

## 动态主题切换

### 主题色切换

当用户选择不同主题时，CSS变量会自动更新：

```css
[data-theme="blue"] {
  --theme-primary-600: #2563EB;
}

[data-theme="purple"] {
  --theme-primary-600: #7C3AED;
}
```

### 字体大小切换

当用户调整字体大小时：

```css
[data-font-size="small"] {
  --font-size-medium: 0.875rem; /* 14px */
}

[data-font-size="large"] {
  --font-size-medium: 1.125rem; /* 18px */
}
```

## 优势

1. **一致性**: 使用标准的Tailwind类名语法
2. **动态性**: 基于CSS变量，支持实时主题切换
3. **语义化**: 提供语义化的颜色名称
4. **响应式**: 字体大小和间距自动适应用户设置
5. **可维护性**: 集中管理主题配置
6. **性能**: CSS变量切换比JavaScript更新样式更高效

## 注意事项

1. 确保CSS变量文件在Tailwind之前导入
2. 使用`text-theme-base`替代`text-sm`等固定大小类
3. 优先使用语义化颜色类而非具体色阶
4. 测试不同主题和字体大小下的视觉效果

这个配置使得整个应用可以通过CSS变量实现完全的主题化，同时保持Tailwind CSS的开发体验。
