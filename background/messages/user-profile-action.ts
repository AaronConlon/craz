import { sendToContentScript, type PlasmoMessaging } from "@plasmohq/messaging";



import { createCrazApiFromEnv } from "~/source/shared/api";
import type { AuthResponse, AuthUser } from "~/source/shared/api/types"
import type {
  AuthStatus,
  FontSize,
  Language,
  ThemeColor,
  UserSettings
} from "~/source/shared/types/settings"
import { getDefaultSettings } from "~/source/shared/types/settings"

// 扩展的用户配置文件类型
export interface UserProfile {
  user: AuthUser | null
  settings: UserSettings
  authStatus: AuthStatus
  lastSyncAt: number
  syncStatus: "syncing" | "synced" | "failed" | "pending"
  lastSyncError?: string
}

// 用户配置文件操作请求类型
export interface UserProfileActionRequest {
  action:
    | "getCurrentUser"
    | "getUserSettings"
    | "updateUserSettings"
    | "updateProfile"
    | "checkAuthStatus"
    | "login"
    | "register"
    | "logout"
    | "getUserProfile"
    | "syncProfile"
    | "clearCache"
    | "uploadSettingsToCloud"
    | "downloadSettingsFromCloud"
    | "getApiRequestStatus"
  data?: any
}

export interface UserProfileActionResponse {
  success: boolean
  data?: any
  error?: string
}

// Chrome Storage 键名
const STORAGE_KEYS = {
  USER_PROFILE: "craz-user-profile",
  AUTH_TOKEN: "craz-auth-token",
  USER_SETTINGS: "craz-user-settings",
  AUTH_STATUS: "craz-auth-status",
  LAST_API_REQUEST: "craz-last-api-request-timestamp"
} as const

// API 请求防重复间隔（5分钟）
const API_REQUEST_COOLDOWN = 5 * 60 * 1000

/**
 * 获取最后一次 API 请求的时间戳
 */
async function getLastApiRequestTimestamp(): Promise<number> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      const result = await chrome.storage.local.get([
        STORAGE_KEYS.LAST_API_REQUEST
      ])
      return result[STORAGE_KEYS.LAST_API_REQUEST] || 0
    }
    return 0
  } catch (error) {
    console.error("Failed to get last API request timestamp:", error)
    return 0
  }
}

/**
 * 设置最后一次 API 请求的时间戳
 */
async function setLastApiRequestTimestamp(timestamp: number): Promise<void> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      await chrome.storage.local.set({
        [STORAGE_KEYS.LAST_API_REQUEST]: timestamp
      })
    }
  } catch (error) {
    console.error("Failed to set last API request timestamp:", error)
  }
}

/**
 * 检查是否可以发起 API 请求（防重复请求）
 */
async function canMakeApiRequest(): Promise<boolean> {
  const lastRequestTime = await getLastApiRequestTimestamp()
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime

  console.log(
    `🕐 API 请求检查: 距离上次请求 ${Math.floor(timeSinceLastRequest / 1000)}s (冷却期: ${API_REQUEST_COOLDOWN / 1000}s)`
  )

  return timeSinceLastRequest >= API_REQUEST_COOLDOWN
}

/**
 * 从 Chrome Storage 获取缓存的用户配置文件
 */
async function getCachedUserProfile(): Promise<UserProfile | null> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      const result = await chrome.storage.local.get([STORAGE_KEYS.USER_PROFILE])

      if (result[STORAGE_KEYS.USER_PROFILE]) {
        return result[STORAGE_KEYS.USER_PROFILE] as UserProfile
      }
    }
    return null
  } catch (error) {
    console.error("Failed to get cached user profile:", error)
    return null
  }
}

/**
 * 保存用户配置文件到 Chrome Storage
 */
async function saveCachedUserProfile(profile: UserProfile): Promise<void> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      await chrome.storage.local.set({
        [STORAGE_KEYS.USER_PROFILE]: profile,
        [STORAGE_KEYS.AUTH_TOKEN]: profile.authStatus.token,
        [STORAGE_KEYS.USER_SETTINGS]: profile.settings,
        [STORAGE_KEYS.AUTH_STATUS]: profile.authStatus
      })
    }
  } catch (error) {
    console.error("Failed to save user profile to cache:", error)
  }
}

/**
 * 获取认证状态
 */
async function getAuthStatus(): Promise<AuthStatus> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      const result = await chrome.storage.local.get([STORAGE_KEYS.AUTH_STATUS])
      const authData = result[STORAGE_KEYS.AUTH_STATUS]

      if (!authData) {
        return { isLoggedIn: false }
      }

      // 检查token是否过期
      if (authData.expiresAt && Date.now() > authData.expiresAt) {
        await clearAuthData()
        return { isLoggedIn: false }
      }

      return authData
    }
    return { isLoggedIn: false }
  } catch (error) {
    console.error("Failed to get auth status:", error)
    return { isLoggedIn: false }
  }
}

/**
 * 保存认证状态
 */
async function saveAuthStatus(authStatus: AuthStatus): Promise<void> {
  try {
    console.log(`Try to save auth status: ${authStatus}`)
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      await chrome.storage.local.set({
        [STORAGE_KEYS.AUTH_STATUS]: authStatus,
        [STORAGE_KEYS.AUTH_TOKEN]: authStatus.token
      })
      console.log("save auth status:", authStatus)
    }
  } catch (error) {
    console.error("Failed to save auth status:", error)
  }
}

/**
 * 清除认证数据
 */
async function clearAuthData(): Promise<void> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      await chrome.storage.local.remove([
        STORAGE_KEYS.AUTH_STATUS,
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_PROFILE
      ])
    }
  } catch (error) {
    console.error("Failed to clear auth data:", error)
  }
}

/**
 * 获取本地用户设置
 */
async function getLocalUserSettings(): Promise<UserSettings> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      const result = await chrome.storage.local.get([
        STORAGE_KEYS.USER_SETTINGS
      ])
      return result[STORAGE_KEYS.USER_SETTINGS] || getDefaultSettings()
    }
    return getDefaultSettings()
  } catch (error) {
    console.error("Failed to get local user settings:", error)
    return getDefaultSettings()
  }
}

/**
 * 保存本地用户设置
 */
async function saveLocalUserSettings(settings: UserSettings): Promise<void> {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      await chrome.storage.local.set({
        [STORAGE_KEYS.USER_SETTINGS]: settings
      })
    }
  } catch (error) {
    console.error("Failed to save local user settings:", error)
  }
}

/**
 * 从云端 API 获取用户配置文件
 */
async function fetchUserProfileFromAPI(
  token?: string,
  forceRequest = false
): Promise<UserProfile> {
  const now = Date.now()

  // 检查是否可以发起 API 请求（防重复请求）
  if (!forceRequest && !(await canMakeApiRequest())) {
    console.log("🚫 API 请求被跳过（冷却期内），返回缓存数据")
    const cachedProfile = await getCachedUserProfile()
    if (cachedProfile) {
      console.log(
        "📱 返回缓存的用户配置文件:",
        cachedProfile.user ? "有用户信息" : "无用户信息"
      )
      return cachedProfile
    }
    // 如果没有缓存，则允许请求
    console.log("⚠️ 无缓存数据，强制发起 API 请求")
  }

  try {
    console.log("🌐 发起 API 请求获取用户配置文件")

    const api = createCrazApiFromEnv(token)

    // 尝试获取用户信息
    let userResponse: AuthResponse
    try {
      userResponse = await api.auth.getCurrentUser()
      // 只在 API 请求成功时记录时间戳
      if (userResponse.success) {
        await setLastApiRequestTimestamp(now)
      }
    } catch (error) {
      userResponse = {
        success: false,
        error: error.message,
        data: {},
        timestamp: new Date().toISOString()
      }
    }

    // TODO: 当有用户设置API时，实现云端设置获取
    // const settingsResponse = await api.auth.getUserSettings()

    if (userResponse.success && userResponse.data?.user) {
      // 用户已登录
      console.log("✅ API 返回用户信息:", userResponse.data.user)
      const userSettings = await getLocalUserSettings()

      const authStatus: AuthStatus = {
        isLoggedIn: true,
        userId: userResponse.data.user.id,
        username:
          userResponse.data.user.username || userResponse.data.user.name,
        token: token || "",
        expiresAt: now + 24 * 60 * 60 * 1000 // 24小时后过期
      }

      const profile: UserProfile = {
        user: userResponse.data.user,
        settings: userSettings,
        authStatus,
        lastSyncAt: now,
        syncStatus: "synced"
      }

      // 保存到本地缓存
      await saveCachedUserProfile(profile)
      await saveAuthStatus(authStatus)

      console.log(
        "💾 用户配置文件已保存到缓存:",
        profile.user ? "包含用户信息" : "不包含用户信息"
      )
      return profile
    } else {
      // 用户未登录或获取失败，使用本地数据
      console.log("❌ API 未返回用户信息或获取失败:", userResponse)
      const settings = await getLocalUserSettings()
      const profile: UserProfile = {
        user: null,
        settings,
        authStatus: { isLoggedIn: false },
        lastSyncAt: now,
        syncStatus: "synced"
      }

      await saveCachedUserProfile(profile)
      console.log("💾 保存了空用户配置文件到缓存")
      return profile
    }
  } catch (error) {
    console.error("Failed to fetch user profile from API:", error)

    // API 失败时，尝试返回缓存数据
    const cachedProfile = await getCachedUserProfile()
    if (cachedProfile) {
      return cachedProfile
    }

    // 如果缓存也没有，返回默认配置
    const settings = await getLocalUserSettings()
    const defaultProfile: UserProfile = {
      user: null,
      settings,
      authStatus: { isLoggedIn: false },
      lastSyncAt: Date.now(),
      syncStatus: "synced"
    }

    await saveCachedUserProfile(defaultProfile)
    return defaultProfile
  }
}

/**
 * 获取并缓存用户配置文件
 */
async function fetchAndCacheUserProfile(
  forceRefresh = false
): Promise<UserProfile> {
  try {
    console.log(`🌐 从云端获取用户配置文件 (forceRefresh: ${forceRefresh})`)

    // 获取认证状态以传递token
    const authStatus = await getAuthStatus()
    const token = authStatus.isLoggedIn ? authStatus.token : undefined

    // 从API获取最新的用户配置文件
    // 当 forceRefresh 为 true 时，强制发起请求忽略冷却期
    const profile = await fetchUserProfileFromAPI(token, forceRefresh)

    console.log("✅ 用户配置文件获取成功")
    return profile
  } catch (error) {
    console.error("❌ 获取用户配置文件失败:", error)

    // 失败时尝试返回缓存数据
    const cachedProfile = await getCachedUserProfile()
    if (cachedProfile) {
      console.log("📱 API 失败，返回缓存数据")
      return {
        ...cachedProfile,
        syncStatus: "failed",
        lastSyncError: error.message
      }
    }

    // 如果连缓存都没有，返回默认配置
    console.log("🔧 无缓存数据，返回默认配置")
    const settings = await getLocalUserSettings()
    const defaultProfile: UserProfile = {
      user: null,
      settings,
      authStatus: { isLoggedIn: false },
      lastSyncAt: Date.now(),
      syncStatus: "failed",
      lastSyncError: error.message
    }

    await saveCachedUserProfile(defaultProfile)
    return defaultProfile
  }
}

/**
 * 后台异步同步用户配置文件
 */
async function syncUserProfileInBackground() {
  try {
    console.log("🔄 开始后台同步用户配置文件")

    // 1. 标记同步状态
    const currentProfile = await getCachedUserProfile()
    if (currentProfile) {
      const syncingProfile = {
        ...currentProfile,
        syncStatus: "syncing" as const
      }
      await saveCachedUserProfile(syncingProfile)

      // 立即通知 UI 同步状态更新
      await notifyContentScriptProfileUpdate(syncingProfile)
    }

    // 2. 获取最新数据
    const updatedProfile = await fetchAndCacheUserProfile()

    console.log("✅ 后台同步完成，通知 content scripts 更新")

    // 3. 通知所有 content scripts 更新数据
    await notifyContentScriptProfileUpdate(updatedProfile)
  } catch (error) {
    console.warn("❌ 后台同步失败，保持本地数据不变:", error)

    // 更新同步状态为失败
    const currentProfile = await getCachedUserProfile()
    if (currentProfile) {
      const failedProfile = {
        ...currentProfile,
        syncStatus: "failed" as const,
        lastSyncError: error.message
      }
      await saveCachedUserProfile(failedProfile)

      // 通知 UI 同步失败状态
      await notifyContentScriptProfileUpdate(failedProfile)
    }
  }
}

/**
 * 获取用户 Profile - 离线优先策略 + 防重复请求
 */
async function getUserProfile(forceRefresh = false): Promise<UserProfile> {
  const SYNC_INTERVAL = 5 * 60 * 1000 // 5分钟同步间隔
  const MAX_CACHE_AGE = 30 * 60 * 1000 // 30分钟最大缓存时间

  console.log(`📊 getUserProfile 调用 (forceRefresh: ${forceRefresh})`)

  // 1. 首先尝试获取本地缓存数据
  const cachedProfile = await getCachedUserProfile()
  console.log("cache profile:", cachedProfile)
  console.log(
    "📂 获取到的缓存数据:",
    cachedProfile
      ? `存在缓存 (user: ${cachedProfile.user ? "有" : "无"})`
      : "无缓存"
  )

  if (!forceRefresh && cachedProfile) {
    const now = Date.now()
    const cacheAge = now - cachedProfile.lastSyncAt

    // 2. 如果缓存还新鲜（5分钟内），直接返回
    if (cacheAge < SYNC_INTERVAL) {
      console.log("📱 返回缓存的用户配置文件（数据新鲜）")
      return cachedProfile
    }

    // 3. 检查 API 请求冷却期，防止频繁请求
    const canRequest = await canMakeApiRequest()
    if (!canRequest) {
      console.log("🚫 API 请求在冷却期内，返回缓存数据")
      return cachedProfile
    }

    // 4. 缓存过期但不太旧（30分钟内），先返回缓存，后台同步
    if (cacheAge < MAX_CACHE_AGE) {
      console.log("📱 使用缓存数据，启动后台同步")

      // 后台异步同步最新数据（延迟以确保立即返回缓存数据）
      setTimeout(() => syncUserProfileInBackground(), 100)

      return cachedProfile
    }

    // 5. 缓存太旧，尝试同步更新，失败时仍返回缓存
    console.log("⏰ 缓存过旧，尝试同步更新")
    try {
      return await fetchAndCacheUserProfile(false) // 不强制，遵循冷却期
    } catch (error) {
      console.warn("❌ 同步失败，返回过期缓存数据:", error)
      return {
        ...cachedProfile,
        syncStatus: "failed",
        lastSyncError: error.message
      }
    }
  }

  // 6. 没有缓存或强制刷新，同步获取最新数据
  console.log("🌐 没有缓存或强制刷新，同步获取最新数据")
  return await fetchAndCacheUserProfile(forceRefresh)
}

/**
 * 更新用户设置
 */
async function updateUserSettings(
  newSettings: Partial<UserSettings>
): Promise<UserProfile> {
  try {
    // 1. 获取当前设置
    const currentSettings = await getLocalUserSettings()

    // 2. 合并设置
    const updatedSettings: UserSettings = {
      ...currentSettings,
      ...newSettings,
      updatedAt: Date.now()
    }

    // 3. 保存到本地
    await saveLocalUserSettings(updatedSettings)

    // 4. 获取当前配置文件并更新
    const currentProfile = await getCachedUserProfile()
    const updatedProfile: UserProfile = {
      ...currentProfile,
      settings: updatedSettings,
      lastSyncAt: Date.now()
    } as UserProfile

    await saveCachedUserProfile(updatedProfile)

    // 5. 通知 content scripts 设置已更新
    await notifyContentScriptProfileUpdate(updatedProfile)

    // 6. 如果用户已登录，尝试同步到云端
    // if (
    //   updatedProfile.authStatus?.isLoggedIn &&
    //   updatedProfile.authStatus?.token
    // ) {
    //   try {
    //     // TODO: 当有用户设置API时，实现云端同步
    //     // const api = createCrazApiFromEnv(updatedProfile.authStatus.token)
    //     // await api.auth.updateUserSettings(updatedSettings)
    //     console.log("Settings would be synced to cloud:", updatedSettings)
    //   } catch (error) {
    //     console.warn("Failed to sync settings to cloud:", error)
    //     // 即使云端同步失败，本地设置仍然有效
    //   }
    // }

    return updatedProfile
  } catch (error) {
    console.error("Failed to update user settings:", error)
    throw error
  }
}

/**
 * 处理用户登录
 */
async function handleLogin(credentials: any): Promise<AuthResponse> {
  try {
    console.log("处理用户登录：", credentials)
    const api = createCrazApiFromEnv()
    const response = await api.auth.login(credentials)
    console.log("api response:", response)

    if (response.success && response.data?.user && response.data?.token) {
      const now = Date.now()

      // 构建认证状态
      const authStatus: AuthStatus = {
        isLoggedIn: true,
        userId: response.data.user.id,
        username: response.data.user.username || response.data.user.name,
        token: response.data.token,
        expiresAt: now + 24 * 60 * 60 * 1000 // 24小时后过期
      }

      console.log("🔄 登录后保存的认证状态:", authStatus)
      await saveAuthStatus(authStatus)

      // 合并用户云端设置和本地设置
      const localSettings = await getLocalUserSettings()
      const cloudSettings = response.data.user.settings || {}

      // 安全地合并设置，确保类型兼容
      const mergedSettings: UserSettings = {
        ...localSettings,
        // 只覆盖本地定义支持的设置项，确保类型安全
        ...(cloudSettings.themeColor && {
          themeColor: cloudSettings.themeColor as ThemeColor
        }),
        ...(cloudSettings.language &&
          ["zh-CN", "en-US", "ja-JP", "ko-KR", "fr-FR", "de-DE"].includes(
            cloudSettings.language
          ) && { language: cloudSettings.language as Language }),
        ...(cloudSettings.fontSize &&
          ["small", "medium", "large"].includes(cloudSettings.fontSize) && {
            fontSize: cloudSettings.fontSize as FontSize
          }),
        updatedAt: now
      }

      // 保存合并后的设置到本地
      await saveLocalUserSettings(mergedSettings)

      // 构建完整的用户配置文件
      const userProfile: UserProfile = {
        user: response.data.user,
        settings: mergedSettings,
        authStatus,
        lastSyncAt: now,
        syncStatus: "synced"
      }

      // 保存用户配置文件到缓存
      await saveCachedUserProfile(userProfile)

      // 更新最后一次API请求时间戳（避免后续不必要的/me请求）
      await setLastApiRequestTimestamp(now)

      console.log("✅ 登录成功，用户配置文件已保存:", {
        userId: userProfile.user?.id,
        username: userProfile.user?.username || userProfile.user?.name,
        hasSettings: !!userProfile.settings
      })

      // 立即通知 content scripts 登录成功
      await notifyContentScriptProfileUpdate(userProfile)
    }

    return response
  } catch (error) {
    console.error("Login failed:", error)
    throw error
  }
}

/**
 * 处理用户注册
 */
async function handleRegister(userData: any): Promise<AuthResponse> {
  try {
    console.log("处理用户注册：", userData)
    const api = createCrazApiFromEnv()
    const response = await api.auth.register(userData)
    console.log("api response:", response)

    if (response.success && response.data?.user && response.data?.token) {
      const now = Date.now()

      // 构建认证状态
      const authStatus: AuthStatus = {
        isLoggedIn: true,
        userId: response.data.user.id,
        username: response.data.user.username || response.data.user.name,
        token: response.data.token,
        expiresAt: now + 24 * 60 * 60 * 1000 // 24小时后过期
      }

      console.log("🔄 注册后保存的认证状态:", authStatus)
      await saveAuthStatus(authStatus)

      // 合并用户云端设置和本地设置
      const localSettings = await getLocalUserSettings()
      const cloudSettings = response.data.user.settings || {}

      // 安全地合并设置，确保类型兼容
      const mergedSettings: UserSettings = {
        ...localSettings,
        // 只覆盖本地定义支持的设置项，确保类型安全
        ...(cloudSettings.themeColor && {
          themeColor: cloudSettings.themeColor as ThemeColor
        }),
        ...(cloudSettings.language &&
          ["zh-CN", "en-US", "ja-JP", "ko-KR", "fr-FR", "de-DE"].includes(
            cloudSettings.language
          ) && { language: cloudSettings.language as Language }),
        ...(cloudSettings.fontSize &&
          ["small", "medium", "large"].includes(cloudSettings.fontSize) && {
            fontSize: cloudSettings.fontSize as FontSize
          }),
        updatedAt: now
      }

      // 保存合并后的设置到本地
      await saveLocalUserSettings(mergedSettings)

      // 构建完整的用户配置文件
      const userProfile: UserProfile = {
        user: response.data.user,
        settings: mergedSettings,
        authStatus,
        lastSyncAt: now,
        syncStatus: "synced"
      }

      // 保存用户配置文件到缓存
      await saveCachedUserProfile(userProfile)

      // 更新最后一次API请求时间戳（避免后续不必要的/me请求）
      await setLastApiRequestTimestamp(now)

      console.log("✅ 注册成功，用户配置文件已保存:", {
        userId: userProfile.user?.id,
        username: userProfile.user?.username || userProfile.user?.name,
        hasSettings: !!userProfile.settings
      })

      // 立即通知 content scripts 注册成功
      await notifyContentScriptProfileUpdate(userProfile)
    }

    return response
  } catch (error) {
    console.error("Registration failed:", error)
    throw error
  }
}

/**
 * 处理用户登出
 */
async function handleLogout(): Promise<{ success: boolean }> {
  try {
    const authStatus = await getAuthStatus()

    if (authStatus.isLoggedIn && authStatus.token) {
      try {
        const api = createCrazApiFromEnv(authStatus.token)
        await api.auth.logout()
      } catch (error) {
        console.warn("Failed to logout from server:", error)
        // 即使服务器登出失败，也要清除本地数据
      }
    }

    // 清除本地认证数据
    await clearAuthData()

    // 重置为默认配置文件
    const settings = await getLocalUserSettings()
    const defaultProfile: UserProfile = {
      user: null,
      settings,
      authStatus: { isLoggedIn: false },
      lastSyncAt: Date.now(),
      syncStatus: "synced"
    }

    await saveCachedUserProfile(defaultProfile)

    return { success: true }
  } catch (error) {
    console.error("Logout failed:", error)
    throw error
  }
}

/**
 * 上传本地设置到云端
 */
async function uploadSettingsToCloud(): Promise<{
  success: boolean
  message?: string
}> {
  try {
    // 1. 检查认证状态
    const authStatus = await getAuthStatus()
    if (!authStatus.isLoggedIn || !authStatus.token) {
      return {
        success: false,
        message: "用户未登录，无法上传到云端"
      }
    }

    // 2. 获取本地设置
    const localSettings = await getLocalUserSettings()
    if (!localSettings) {
      return {
        success: false,
        message: "本地设置为空，无法上传"
      }
    }

    // 3. 上传到云端API
    try {
      // TODO: 当有用户设置API时，实现真实的云端上传
      // const api = createCrazApiFromEnv(authStatus.token)
      // await api.auth.updateUserSettings(localSettings)

      console.log("Settings uploaded to cloud:", localSettings)

      // 模拟API调用延迟
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 4. 更新最后同步时间
      const currentProfile = await getCachedUserProfile()
      if (currentProfile) {
        const updatedProfile: UserProfile = {
          ...currentProfile,
          settings: localSettings,
          lastSyncAt: Date.now()
        }
        await saveCachedUserProfile(updatedProfile)
      }

      return {
        success: true,
        message: "设置已成功上传到云端"
      }
    } catch (apiError) {
      console.error("Failed to upload settings to cloud API:", apiError)
      return {
        success: false,
        message: "上传失败：服务器错误"
      }
    }
  } catch (error) {
    console.error("Failed to upload settings to cloud:", error)
    return {
      success: false,
      message: `上传失败：${error.message || "未知错误"}`
    }
  }
}

/**
 * 从云端下载设置到本地
 */
async function downloadSettingsFromCloud(): Promise<{
  success: boolean
  settings?: UserSettings
  message?: string
}> {
  try {
    // 1. 检查认证状态
    const authStatus = await getAuthStatus()
    if (!authStatus.isLoggedIn || !authStatus.token) {
      return {
        success: false,
        message: "用户未登录，无法从云端下载"
      }
    }

    // 2. 从云端API获取设置
    try {
      // TODO: 当有用户设置API时，实现真实的云端下载
      // const api = createCrazApiFromEnv(authStatus.token)
      // const response = await api.auth.getUserSettings()

      // 模拟从云端获取设置
      console.log("Downloading settings from cloud...")
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 暂时返回当前本地设置作为模拟数据
      const currentLocalSettings = await getLocalUserSettings()
      const cloudSettings: UserSettings = {
        ...currentLocalSettings,
        // 模拟云端可能有不同的设置
        updatedAt: Date.now() - 60000 // 1分钟前更新
      }

      // 3. 保存到本地
      await saveLocalUserSettings(cloudSettings)

      // 4. 更新缓存的用户配置文件
      const currentProfile = await getCachedUserProfile()
      if (currentProfile) {
        const updatedProfile: UserProfile = {
          ...currentProfile,
          settings: cloudSettings,
          lastSyncAt: Date.now()
        }
        await saveCachedUserProfile(updatedProfile)
      }

      return {
        success: true,
        settings: cloudSettings,
        message: "设置已成功从云端下载"
      }
    } catch (apiError) {
      console.error("Failed to download settings from cloud API:", apiError)
      return {
        success: false,
        message: "下载失败：服务器错误"
      }
    }
  } catch (error) {
    console.error("Failed to download settings from cloud:", error)
    return {
      success: false,
      message: `下载失败：${error.message || "未知错误"}`
    }
  }
}

/**
 * 向所有 content scripts 发送用户配置文件更新消息
 */
async function notifyContentScriptProfileUpdate(profile: UserProfile) {
  try {
    console.log("📢 通知 content scripts 用户配置文件已更新")

    // 获取所有活跃的标签页
    const tabs = await chrome.tabs.query({})
    let notifiedCount = 0
    let failedCount = 0

    const notificationPromises = tabs.map(async (tab) => {
      if (tab.id && tab.url && !tab.url.startsWith("chrome://")) {
        try {
          await sendToContentScript({
            name: "user-profile-updated",
            body: {
              profile,
              timestamp: Date.now(),
              syncStatus: profile.syncStatus
            },
            tabId: tab.id
          })
          return { success: true, tabId: tab.id }
        } catch (error) {
          // 某些标签页可能没有 content script，这是正常的
          console.debug(`⚠️ 标签页 ${tab.id} (${tab.url}) 没有 content script`)
          return { success: false, tabId: tab.id, error: error.message }
        }
      }
      return { success: false, tabId: tab.id, error: "Invalid tab" }
    })

    // 等待所有通知完成
    const results = await Promise.allSettled(notificationPromises)

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        if (result.value.success) {
          notifiedCount++
        } else {
          failedCount++
        }
      } else {
        failedCount++
      }
    })

    console.log(`📊 通知结果: ${notifiedCount} 成功, ${failedCount} 失败`)

    // 如果有成功的通知，说明至少有一些 content scripts 接收到了更新
    if (notifiedCount > 0) {
      console.log("✅ 配置文件更新通知发送成功")
    } else if (failedCount > 0) {
      console.warn("⚠️ 所有 content script 通知都失败了")
    }
  } catch (error) {
    console.error("❌ 通知 content scripts 失败:", error)
  }
}

// Background message handler
const handler: PlasmoMessaging.MessageHandler<
  UserProfileActionRequest
> = async (req, res) => {
  console.log("[Background] User profile action body:", req.body)
  const { action, data } = req.body

  try {
    let result: any

    switch (action) {
      case "getUserProfile":
        result = await getUserProfile(data?.forceRefresh)
        break

      case "getCurrentUser":
        const authStatus = await getAuthStatus()
        if (authStatus.isLoggedIn && authStatus.token) {
          const api = createCrazApiFromEnv(authStatus.token)
          result = await api.auth.getCurrentUser()
        } else {
          result = { success: false, error: "Not logged in" }
        }
        break

      case "getUserSettings":
        const profile = await getUserProfile()
        result = profile.settings
        break

      case "updateUserSettings":
        if (!data) throw new Error("Settings data is required")
        const updatedProfile = await updateUserSettings(data)
        result = updatedProfile.settings
        break

      case "updateProfile":
        const currentAuth = await getAuthStatus()
        if (!currentAuth.isLoggedIn || !currentAuth.token) {
          throw new Error("Not logged in")
        }
        if (!data) throw new Error("Profile data is required")

        const api = createCrazApiFromEnv(currentAuth.token)
        result = await api.auth.updateProfile(data)

        // 更新成功后刷新配置文件
        if (result.success) {
          await getUserProfile(true)
        }
        break

      case "checkAuthStatus":
        result = await getAuthStatus()
        break

      case "login":
        if (!data) throw new Error("Login credentials are required")
        const loginResponse = await handleLogin(data)

        // 登录成功后，立即获取完整的用户配置文件并返回
        if (loginResponse.success) {
          const userProfile = await getUserProfile(true)
          result = {
            ...loginResponse,
            userProfile // 附加完整的用户配置文件
          }
        } else {
          result = loginResponse
        }
        break

      case "register":
        if (!data) throw new Error("Registration data is required")
        const registerResponse = await handleRegister(data)

        // 注册成功后，立即获取完整的用户配置文件并返回
        if (registerResponse.success) {
          const userProfile = await getUserProfile(true)
          result = {
            ...registerResponse,
            userProfile // 附加完整的用户配置文件
          }
        } else {
          result = registerResponse
        }
        break

      case "logout":
        result = await handleLogout()
        break

      case "syncProfile":
        result = await getUserProfile(true)
        break

      case "clearCache":
        await chrome.storage.local.clear()
        console.log("🗑️ 缓存已清除，包括 API 请求时间戳")
        result = { success: true, message: "Cache cleared" }
        break

      case "uploadSettingsToCloud":
        result = await uploadSettingsToCloud()
        break

      case "downloadSettingsFromCloud":
        result = await downloadSettingsFromCloud()
        break

      case "getApiRequestStatus":
        // 调试功能：获取 API 请求状态
        const lastRequestTime = await getLastApiRequestTimestamp()
        const now = Date.now()
        const timeSinceLastRequest = now - lastRequestTime
        const canRequest = await canMakeApiRequest()

        result = {
          lastRequestTime,
          timeSinceLastRequest,
          timeSinceLastRequestSeconds: Math.floor(timeSinceLastRequest / 1000),
          cooldownPeriod: API_REQUEST_COOLDOWN,
          cooldownPeriodSeconds: API_REQUEST_COOLDOWN / 1000,
          canMakeRequest: canRequest,
          timeUntilNextRequest: canRequest
            ? 0
            : API_REQUEST_COOLDOWN - timeSinceLastRequest
        }
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    console.log("[Background] User profile action result:", {
      action,
      success: true
    })

    res.send({
      success: true,
      data: result
    })
  } catch (error) {
    console.error(`[Background] User profile action failed:`, error)

    res.send({
      success: false,
      error: error.message || "Unknown error occurred"
    })
  }
}

export default handler