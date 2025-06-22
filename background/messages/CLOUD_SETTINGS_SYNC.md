# 云端设置同步功能

## 概述

为用户配置文件系统添加了云端设置同步功能，允许用户将本地设置上传到云端或从云端下载设置到本地。

## 新增 Message Actions

### 1. uploadSettingsToCloud

**功能**：将本地设置上传到云端

**请求格式**：

```typescript
{
  name: "user-profile-action",
  body: {
    action: "uploadSettingsToCloud"
  }
}
```

**响应格式**：

```typescript
{
  success: boolean,
  data?: {
    message: string
  },
  error?: string
}
```

**功能流程**：

1. 检查用户登录状态
2. 获取本地设置
3. 调用云端API上传设置（TODO: 实现真实API）
4. 更新本地缓存的同步时间
5. 返回操作结果

### 2. downloadSettingsFromCloud

**功能**：从云端下载设置到本地

**请求格式**：

```typescript
{
  name: "user-profile-action",
  body: {
    action: "downloadSettingsFromCloud"
  }
}
```

**响应格式**：

```typescript
{
  success: boolean,
  data?: {
    settings: UserSettings,
    message: string
  },
  error?: string
}
```

**功能流程**：

1. 检查用户登录状态
2. 从云端API获取设置（TODO: 实现真实API）
3. 保存到本地存储
4. 更新缓存的用户配置文件
5. 返回下载的设置

## 实现细节

### 认证检查

两个函数都会首先检查用户是否已登录：

```typescript
const authStatus = await getAuthStatus()
if (!authStatus.isLoggedIn || !authStatus.token) {
  return {
    success: false,
    message: "用户未登录，无法操作云端设置"
  }
}
```

### 错误处理

- **网络错误**：API调用失败时返回相应错误信息
- **认证错误**：未登录用户无法进行云端操作
- **数据错误**：本地设置为空时无法上传

### 模拟实现

当前实现包含模拟的API调用：

```typescript
// TODO: 当有用户设置API时，实现真实的云端操作
// const api = createCrazApiFromEnv(authStatus.token)
// await api.auth.updateUserSettings(localSettings)

console.log("Settings uploaded to cloud:", localSettings)
await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟延迟
```

## 前端集成

### 设置页面集成

在 `settings-view.tsx` 中集成了两个按钮：

1. **从云端加载按钮**：
   - 调用 `downloadSettingsFromCloud` action
   - 应用下载的设置到本地状态
   - 更新主题和字体大小
   - 显示成功/失败提示

2. **上传到云端按钮**：
   - 先保存当前设置到本地
   - 调用 `uploadSettingsToCloud` action
   - 显示成功/失败提示

### 使用示例

```typescript
// 从云端下载设置
const response = await chrome.runtime.sendMessage({
  name: "user-profile-action",
  body: {
    action: "downloadSettingsFromCloud"
  }
})

if (response.success) {
  const cloudSettings = response.data.settings
  // 应用设置...
}

// 上传设置到云端
const uploadResponse = await chrome.runtime.sendMessage({
  name: "user-profile-action",
  body: {
    action: "uploadSettingsToCloud"
  }
})
```

## TODO: 真实API集成

当后端API准备就绪时，需要替换模拟实现：

### 上传设置API

```typescript
const api = createCrazApiFromEnv(authStatus.token)
await api.auth.updateUserSettings(localSettings)
```

### 下载设置API

```typescript
const api = createCrazApiFromEnv(authStatus.token)
const response = await api.auth.getUserSettings()
const cloudSettings = response.settings
```

## 安全考虑

1. **认证验证**：所有云端操作都需要有效的用户token
2. **数据验证**：上传前验证设置数据的完整性
3. **错误处理**：妥善处理网络错误和API错误
4. **本地备份**：云端操作失败时保持本地设置不变

## 用户体验

1. **即时反馈**：操作过程中显示加载状态
2. **清晰提示**：成功/失败都有明确的Toast消息
3. **状态保持**：操作过程中按钮显示对应的加载状态
4. **优雅降级**：未登录用户会收到友好的提示信息

这套云端同步系统为用户提供了灵活的设置管理方式，既保证了本地操作的流畅性，又提供了云端数据的持久化和跨设备同步能力。
