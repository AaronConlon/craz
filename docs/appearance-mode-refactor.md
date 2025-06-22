# 界面模式重构：分离主题色和深浅色模式

## 重构概述

将原本混合在一起的"主题"概念分离为两个独立的设置：

- **主题色（ThemeColor）**: 用户选择的品牌颜色
- **界面模式（AppearanceMode）**: 深色/浅色/系统跟随模式

## 重构内容

### 1. 类型定义更新 (`source/shared/types/settings.ts`)

#### 新增类型

```typescript
// 主题色类型 - 品牌颜色选择
export type ThemeColor = "zinc" | "indigo" | "emerald" | "amber" | "rose" | "custom"

// 界面模式类型 - 深浅色模式
export type AppearanceMode = "light" | "dark" | "system"

// 界面模式选项
export const APPEARANCE_MODES: Record<AppearanceMode, string> = {
  light: "浅色",
  dark: "深色", 
  system: "跟随系统"
}
```

#### 更新用户设置接口

```typescript
export interface UserSettings {
  themeColor: ThemeColor        // 主题色（原 theme）
  appearanceMode: AppearanceMode // 界面模式（新增）
  language: Language
  fontSize: FontSize
  createdAt: number
  updatedAt: number
}
```

#### 更新默认设置

```typescript
export const DEFAULT_SETTINGS: UserSettings = {
  themeColor: "amber",      // 默认主题色
  appearanceMode: "system", // 默认跟随系统
  language: "en-US",
  fontSize: "medium",
  createdAt: Date.now(),
  updatedAt: Date.now()
}
```

### 2. 界面模式工具函数 (`source/shared/utils/appearance-utils.ts`)

#### 核心功能

- **系统检测**: `getSystemDarkMode()` - 检测系统深色模式偏好
- **模式监听**: `watchSystemDarkMode()` - 监听系统模式变化
- **实际模式**: `getActualDarkMode()` - 根据设置获取实际深色模式状态
- **DOM应用**: `applyAppearanceMode()` - 将模式应用到DOM
- **持久化**: `getSavedAppearanceMode()` - 获取保存的模式设置
- **初始化**: `initializeAppearanceMode()` - 应用启动时初始化

#### 工作原理

```typescript
// 根据用户设置确定实际的深色模式状态
function getActualDarkMode(appearanceMode: AppearanceMode): boolean {
  switch (appearanceMode) {
    case 'dark': return true           // 强制深色
    case 'light': return false        // 强制浅色  
    case 'system': return getSystemDarkMode() // 跟随系统
  }
}

// 应用到DOM - 添加/移除 'dark' 类
function applyAppearanceMode(appearanceMode: AppearanceMode): void {
  const isDark = getActualDarkMode(appearanceMode)
  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}
```

### 3. 界面模式管理钩子 (`source/shared/hooks/use-appearance-mode.ts`)

#### 提供功能

- 当前模式状态管理
- 系统模式变化监听
- 模式切换函数
- 深色模式状态

```typescript
export function useAppearanceMode(defaultMode: AppearanceMode = 'system') {
  return {
    currentMode,      // 当前设置的模式
    isDark,          // 当前是否为深色模式
    isSystemDark,    // 系统是否为深色模式
    setAppearanceMode, // 设置模式函数
    toggleDarkMode   // 切换深浅色函数
  }
}
```

### 4. 设置界面重构 (`source/features/tab-switcher/ui/settings-view.tsx`)

#### 主要变更

1. **导入更新**: 使用新的类型和工具函数
2. **处理函数**: 分离主题色和界面模式处理
3. **UI组件**: 重新设计界面模式选择器

#### 新的处理逻辑

```typescript
// 主题色变更处理
const handleThemeColorChange = (themeColor: ThemeColor) => {
  handleSettingChange('themeColor', themeColor)
}

// 界面模式变更处理  
const handleAppearanceModeChange = (appearanceMode: AppearanceMode) => {
  handleSettingChange('appearanceMode', appearanceMode)
}

// 统一设置变更处理
const handleSettingChange = (key, value) => {
  if (key === 'themeColor') {
    setTheme(value)  // 应用主题色
  } else if (key === 'appearanceMode') {
    applyAppearanceMode(value)  // 应用界面模式
  }
  // 保存到服务器...
}
```

#### 新的界面模式选择器

- **动态预览**: 根据模式显示不同的预览效果
- **系统跟随**: 支持跟随系统设置
- **视觉反馈**: 清晰的选中状态和悬停效果

### 5. 向后兼容性

#### 类型别名

```typescript
// 保持向后兼容
export type Theme = ThemeColor
```

#### 数据迁移

- 现有的 `theme` 数据会自动映射到 `themeColor`
- 新增的 `appearanceMode` 默认为 `"system"`

### 6. 技术优势

#### 清晰的职责分离

- **主题色**: 纯粹的品牌色彩选择，不影响深浅色模式
- **界面模式**: 专门处理深浅色切换，支持系统跟随

#### 更好的用户体验

- **系统集成**: 自动跟随系统深色模式设置
- **实时响应**: 系统模式变化时自动更新
- **持久化**: 用户选择会被保存和同步

#### 开发友好

- **类型安全**: 完整的 TypeScript 类型定义
- **工具函数**: 封装好的工具函数便于复用
- **钩子封装**: React 钩子简化状态管理

### 7. 使用示例

#### 在组件中使用

```typescript
import { useAppearanceMode } from '~/source/shared/hooks'

function MyComponent() {
  const { currentMode, isDark, setAppearanceMode } = useAppearanceMode()
  
  return (
    <div className={isDark ? 'dark-theme' : 'light-theme'}>
      <button onClick={() => setAppearanceMode('dark')}>
        切换到深色模式
      </button>
    </div>
  )
}
```

#### 在应用启动时初始化

```typescript
import { initializeAppearanceMode } from '~/source/shared/utils'

// 应用启动时调用
initializeAppearanceMode('system')
```

### 8. 测试建议

1. **系统跟随测试**
   - 在系统设置中切换深浅色模式
   - 验证应用是否自动跟随变化

2. **模式切换测试**
   - 测试三种模式的切换
   - 验证设置是否正确保存

3. **主题色独立性测试**
   - 在不同界面模式下切换主题色
   - 验证主题色不受界面模式影响

4. **跨设备同步测试**
   - 验证设置在不同设备间的同步
   - 确保界面模式和主题色都能正确同步

## 总结

这次重构成功将混合的"主题"概念分离为独立的"主题色"和"界面模式"，提供了：

- ✅ 更清晰的概念分离
- ✅ 更好的系统集成
- ✅ 更灵活的用户控制
- ✅ 更友好的开发体验
- ✅ 完整的向后兼容性
