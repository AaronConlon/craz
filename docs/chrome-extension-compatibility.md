# Chrome 扩展兼容性改进

## 问题背景

Chrome 扩展无法直接修改 `document.documentElement` 的属性，因此不能使用传统的 `dark` 类名来控制深浅色模式。需要使用传递的容器 ref 来应用样式。

## 解决方案

### 1. 使用 data 属性替代 class

**原方案（不兼容）:**

```javascript
// 直接修改 document.documentElement
document.documentElement.classList.add('dark')
```

**新方案（兼容）:**

```javascript
// 使用传入的容器 ref 和 data 属性
containerRef.current.setAttribute('data-appearance', 'dark')
```

### 2. 统一的容器引用系统

主题色和界面模式共用同一个容器 ref，确保样式应用的一致性。

#### 主题提供者更新

```typescript
// ThemeProvider 组件接收容器 ref
interface ThemeProviderProps {
  children: ReactNode
  containerRef: React.RefObject<HTMLDivElement>
}

// 应用主题到指定容器
function applyThemeToDOM(
  themeColor: ThemeColor, 
  appearanceMode: AppearanceMode,
  fontSize: FontSize, 
  { customColor, containerRef }
) {
  const root = containerRef.current
  if (!root) return

  // 设置主题色属性
  root.setAttribute('data-theme', themeColor)
  
  // 设置界面模式属性
  root.setAttribute('data-appearance', isDark ? 'dark' : 'light')
  root.setAttribute('data-appearance-mode', appearanceMode)
  
  // 设置字体大小属性
  root.setAttribute('data-font-size', fontSize)
}
```

### 3. 界面模式工具函数更新

#### 支持容器 ref 参数

```typescript
// 更新函数签名支持容器 ref
export function applyAppearanceMode(
  appearanceMode: AppearanceMode, 
  containerRef?: React.RefObject<HTMLElement>
): void {
  const isDark = getActualDarkMode(appearanceMode)
  
  // 优先使用容器 ref，回退到 document.documentElement
  const target = containerRef?.current || 
    (typeof document !== 'undefined' ? document.documentElement : null)
  
  if (target) {
    // 使用 data 属性而非 class
    target.setAttribute('data-appearance', isDark ? 'dark' : 'light')
    target.setAttribute('data-appearance-mode', appearanceMode)
  }
}
```

## 总结

通过使用容器 ref 和 data 属性，成功解决了 Chrome 扩展环境下的样式应用限制，同时保持了代码的简洁性和一致性。
