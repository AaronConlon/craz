# User Profile Action - Background Message Handler

## 概览

`user-profile-action.ts` 是一个 Plasmo background message handler，负责处理所有用户配置文件相关的操作。它作为扩展的用户数据管理中心，提供了完整的用户认证、设置管理和配置文件同步功能。

## 架构设计

遵循项目的 Background 作为服务中间层的设计原则：

```
UI 组件 → Background (user-profile-action) → 云端 API
                 ↓
          Chrome Storage (本地缓存)
```

## 核心功能

### 1. 用户配置文件管理

- **获取用户配置文件**: 优先使用缓存，定期同步云端数据
- **缓存管理**: 自动缓存到 Chrome Storage，提供离线支持
- **智能同步**: 5分钟同步间隔，避免频繁API调用

### 2. 用户认证

- **登录/注册**: 处理用户认证流程
- **Token 管理**: 自动管理认证令牌，检查过期状态
- **登出**: 清理所有本地认证数据

### 3. 用户设置

- **本地设置**: 即时保存，无需网络
- **云端同步**: 登录用户自动同步到云端
- **默认设置**: 智能检测浏览器语言等

## 支持的操作

### getUserProfile

获取完整的用户配置文件

```typescript
const response = await sendToBackground({
  name: "user-profile-action",
  body: {
    action: "getUserProfile",
    data: { forceRefresh: true } // 可选，强制刷新
  }
})
```

### getCurrentUser

获取当前用户信息

```typescript
const response = await sendToBackground({
  name: "user-profile-action", 
  body: { action: "getCurrentUser" }
})
```

### getUserSettings

获取用户设置

```typescript
const response = await sendToBackground({
  name: "user-profile-action",
  body: { action: "getUserSettings" }
})
```

### updateUserSettings

更新用户设置

```typescript
const response = await sendToBackground({
  name: "user-profile-action",
  body: {
    action: "updateUserSettings",
    data: {
      theme: "blue",
      language: "zh-CN",
      fontSize: "medium"
    }
  }
})
```

### updateProfile

更新用户资料

```typescript
const response = await sendToBackground({
  name: "user-profile-action",
  body: {
    action: "updateProfile", 
    data: {
      name: "新用户名",
      avatar: "头像URL"
    }
  }
})
```

### checkAuthStatus

检查认证状态

```typescript
const response = await sendToBackground({
  name: "user-profile-action",
  body: { action: "checkAuthStatus" }
})
```

### login

用户登录

```typescript
const response = await sendToBackground({
  name: "user-profile-action",
  body: {
    action: "login",
    data: {
      email: "user@example.com",
      password: "password123"
    }
  }
})
```

### register

用户注册

```typescript
const response = await sendToBackground({
  name: "user-profile-action",
  body: {
    action: "register",
    data: {
      email: "user@example.com",
      password: "password123", 
      name: "用户名"
    }
  }
})
```

### logout

用户登出

```typescript
const response = await sendToBackground({
  name: "user-profile-action",
  body: { action: "logout" }
})
```

### syncProfile

强制同步配置文件

```typescript
const response = await sendToBackground({
  name: "user-profile-action",
  body: { action: "syncProfile" }
})
```

### clearCache

清理所有缓存

```typescript
const response = await sendToBackground({
  name: "user-profile-action",
  body: { action: "clearCache" }
})
```

## 数据结构

### UserProfile

```typescript
interface UserProfile {
  user: AuthUser | null           // 用户信息
  settings: UserSettings          // 用户设置
  authStatus: AuthStatus          // 认证状态
  lastSyncAt: number             // 上次同步时间
}
```

### AuthStatus

```typescript
interface AuthStatus {
  isLoggedIn: boolean            // 是否已登录
  userId?: string               // 用户ID
  username?: string             // 用户名
  token?: string               // 认证令牌
  expiresAt?: number           // 令牌过期时间
}
```

### UserSettings

```typescript
interface UserSettings {
  theme: Theme                  // 主题
  language: Language           // 语言
  fontSize: FontSize           // 字体大小
  createdAt: number           // 创建时间
  updatedAt: number           // 更新时间
}
```

## Chrome Storage 键名

- `craz-user-profile`: 完整用户配置文件
- `craz-auth-token`: 认证令牌
- `craz-user-settings`: 用户设置
- `craz-auth-status`: 认证状态

## 错误处理

所有操作都包含完整的错误处理：

```typescript
try {
  const response = await sendToBackground({
    name: "user-profile-action",
    body: { action: "getUserProfile" }
  })
  
  if (response.success) {
    const profile = response.data
    // 处理成功结果
  } else {
    console.error("操作失败:", response.error)
  }
} catch (error) {
  console.error("请求失败:", error)
}
```

## 缓存策略

1. **首次访问**: 从 Chrome Storage 获取缓存数据
2. **缓存命中**: 如果数据新鲜（5分钟内），直接返回
3. **后台同步**: 如果数据较旧，后台异步同步新数据
4. **API 失败**: 降级到缓存数据，保证用户体验

## 同步机制

- **登录时**: 立即同步云端数据
- **设置更新**: 本地立即生效，后台同步云端
- **定期同步**: 5分钟间隔检查更新
- **离线支持**: 所有数据都有本地缓存

## 使用示例

### 在 Popup 中使用

```typescript
// popup.tsx
import { sendToBackground } from "@plasmohq/messaging"

export default function Popup() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  
  useEffect(() => {
    // 获取用户配置文件
    sendToBackground({
      name: "user-profile-action",
      body: { action: "getUserProfile" }
    }).then(response => {
      if (response.success) {
        setProfile(response.data)
      }
    })
  }, [])
  
  const updateTheme = async (theme: Theme) => {
    const response = await sendToBackground({
      name: "user-profile-action", 
      body: {
        action: "updateUserSettings",
        data: { theme }
      }
    })
    
    if (response.success) {
      setProfile(prev => ({
        ...prev,
        settings: { ...prev.settings, theme }
      }))
    }
  }
  
  return (
    <div>
      {profile?.user ? (
        <div>欢迎, {profile.user.name}</div>
      ) : (
        <div>未登录</div>
      )}
    </div>
  )
}
```

### 在 Content Script 中使用

```typescript
// contents/index.tsx
import { sendToBackground } from "@plasmohq/messaging"

// 获取用户设置
const getUserSettings = async () => {
  const response = await sendToBackground({
    name: "user-profile-action",
    body: { action: "getUserSettings" }
  })
  
  return response.success ? response.data : null
}

// 应用用户设置
getUserSettings().then(settings => {
  if (settings) {
    document.documentElement.style.fontSize = settings.fontSize
    document.documentElement.className = `theme-${settings.theme}`
  }
})
```

## 注意事项

1. **权限要求**: 需要 `storage` 权限访问 Chrome Storage
2. **网络依赖**: 云端同步需要网络连接，但本地操作始终可用
3. **Token 过期**: 自动检查并处理 Token 过期情况
4. **并发安全**: 使用适当的锁机制避免并发问题

## 扩展功能

未来可以考虑添加：

- **多设备同步**: 跨设备的设置同步
- **设置备份**: 设置的备份和恢复功能
- **高级权限**: 基于角色的权限管理
- **审计日志**: 用户操作的审计追踪
