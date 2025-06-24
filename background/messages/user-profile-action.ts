import type { PlasmoMessaging } from "@plasmohq/messaging";



import { createCrazApiFromEnv } from "~/source/shared/api";
import type { AuthResponse, AuthUser } from "~/source/shared/api/types";
import type { AuthStatus, UserSettings } from "~/source/shared/types/settings";
import { getDefaultSettings } from "~/source/shared/types/settings";





// 扩展的用户配置文件类型
export interface UserProfile {
  user: AuthUser | null
  settings: UserSettings
  authStatus: AuthStatus
  lastSyncAt: number
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
  AUTH_STATUS: "craz-auth-status"
} as const

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
async function fetchUserProfileFromAPI(token?: string): Promise<UserProfile> {
  try {
    const api = createCrazApiFromEnv(token)
    const now = Date.now()

    // 尝试获取用户信息
    let userResponse: AuthResponse
    try {
      userResponse = await api.auth.getCurrentUser()
    } catch (error) {
      userResponse = { success: false, error: error.message }
    }

    // TODO: 当有用户设置API时，实现云端设置获取
    // const settingsResponse = await api.auth.getUserSettings()

    if (userResponse.success && userResponse.user) {
      // 用户已登录
      const userSettings = await getLocalUserSettings()

      const authStatus: AuthStatus = {
        isLoggedIn: true,
        userId: userResponse.user.id,
        username: userResponse.user.name,
        token: token || "",
        expiresAt: now + 24 * 60 * 60 * 1000 // 24小时后过期
      }

      const profile: UserProfile = {
        user: userResponse.user,
        settings: userSettings,
        authStatus,
        lastSyncAt: now
      }

      // 保存到本地缓存
      await saveCachedUserProfile(profile)
      await saveAuthStatus(authStatus)

      return profile
    } else {
      // 用户未登录或获取失败，使用本地数据
      const settings = await getLocalUserSettings()
      const profile: UserProfile = {
        user: null,
        settings,
        authStatus: { isLoggedIn: false },
        lastSyncAt: now
      }

      await saveCachedUserProfile(profile)
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
      lastSyncAt: Date.now()
    }

    await saveCachedUserProfile(defaultProfile)
    return defaultProfile
  }
}

/**
 * 用户配置文件查询函数
 * 优先返回缓存数据，然后在后台同步云端数据
 */
async function getUserProfile(forceRefresh = false): Promise<UserProfile> {
  const SYNC_INTERVAL = 5 * 60 * 1000 // 5分钟同步间隔

  if (!forceRefresh) {
    // 1. 首先尝试获取缓存数据
    const cachedProfile = await getCachedUserProfile()

    if (cachedProfile) {
      const now = Date.now()

      // 2. 检查是否需要后台同步
      if (now - cachedProfile.lastSyncAt < SYNC_INTERVAL) {
        return cachedProfile
      }
    }
  }

  // 3. 获取token并刷新数据
  const authStatus = await getAuthStatus()
  return await fetchUserProfileFromAPI(authStatus.token)
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

    // 5. 如果用户已登录，尝试同步到云端
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
    const api = createCrazApiFromEnv()
    const response = await api.auth.login(credentials)

    if (response.success && response.user && response.token) {
      const authStatus: AuthStatus = {
        isLoggedIn: true,
        userId: response.user.id,
        username: response.user.name,
        token: response.token,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000
      }

      await saveAuthStatus(authStatus)

      // 登录后立即获取完整配置文件
      await getUserProfile(true)
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
    const api = createCrazApiFromEnv()
    const response = await api.auth.register(userData)

    if (response.success && response.user && response.token) {
      const authStatus: AuthStatus = {
        isLoggedIn: true,
        userId: response.user.id,
        username: response.user.name,
        token: response.token,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000
      }

      await saveAuthStatus(authStatus)

      // 注册后立即获取完整配置文件
      await getUserProfile(true)
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
      lastSyncAt: Date.now()
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

// Background message handler
const handler: PlasmoMessaging.MessageHandler<
  UserProfileActionRequest
> = async (req, res) => {
  const { action, data } = req.body

  console.log("[Background] User profile action:", action)

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
        result = await handleLogin(data)
        break

      case "register":
        if (!data) throw new Error("Registration data is required")
        result = await handleRegister(data)
        break

      case "logout":
        result = await handleLogout()
        break

      case "syncProfile":
        result = await getUserProfile(true)
        break

      case "clearCache":
        await chrome.storage.local.clear()
        result = { success: true, message: "Cache cleared" }
        break

      case "uploadSettingsToCloud":
        result = await uploadSettingsToCloud()
        break

      case "downloadSettingsFromCloud":
        result = await downloadSettingsFromCloud()
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