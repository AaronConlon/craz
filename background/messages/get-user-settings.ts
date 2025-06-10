import type { PlasmoMessaging } from "@plasmohq/messaging"

import type {
  AuthStatus,
  SettingsResponse,
  UserSettings
} from "~source/shared/types/settings"
import { getDefaultSettings } from "~source/shared/types/settings"

// 检查登录状态
async function checkAuthStatus(): Promise<AuthStatus> {
  try {
    const result = await chrome.storage.local.get(["craz-auth-status"])
    const authData = result["craz-auth-status"]

    if (!authData) {
      return { isLoggedIn: false }
    }

    // 检查token是否过期
    if (authData.expiresAt && Date.now() > authData.expiresAt) {
      // token已过期，清除认证信息
      await chrome.storage.local.remove(["craz-auth-status"])
      return { isLoggedIn: false }
    }

    return authData
  } catch (error) {
    console.error("Error checking auth status:", error)
    return { isLoggedIn: false }
  }
}

// 获取本地设置
async function getLocalSettings(): Promise<UserSettings | null> {
  try {
    const result = await chrome.storage.local.get(["craz-user-settings"])
    return result["craz-user-settings"] || null
  } catch (error) {
    console.error("Error getting local settings:", error)
    return null
  }
}

// 保存本地设置
async function saveLocalSettings(settings: UserSettings): Promise<void> {
  try {
    await chrome.storage.local.set({ "craz-user-settings": settings })
  } catch (error) {
    console.error("Error saving local settings:", error)
    throw error
  }
}

// 获取云端设置（模拟实现）
async function fetchCloudSettings(token: string): Promise<UserSettings | null> {
  try {
    // TODO: 实现真实的云端API调用
    // const response = await fetch('https://api.craz.com/user/settings', {
    //   headers: { Authorization: `Bearer ${token}` }
    // })
    // return await response.json()

    // 暂时返回null，表示无云端设置
    return null
  } catch (error) {
    console.error("Error fetching cloud settings:", error)
    return null
  }
}

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    console.log("Getting user settings...")

    // 1. 检查登录状态
    const authStatus = await checkAuthStatus()
    console.log("Auth status:", authStatus)

    // 2. 获取本地设置
    let localSettings = await getLocalSettings()
    const isDefault = !localSettings

    // 3. 如果没有本地设置，使用默认设置
    if (!localSettings) {
      localSettings = getDefaultSettings()
      await saveLocalSettings(localSettings)
    }

    let settings = localSettings

    // 4. 如果已登录，尝试同步云端设置
    if (authStatus.isLoggedIn && authStatus.token) {
      try {
        const cloudSettings = await fetchCloudSettings(authStatus.token)
        if (
          cloudSettings &&
          cloudSettings.updatedAt > localSettings.updatedAt
        ) {
          settings = cloudSettings
          await saveLocalSettings(settings)
          console.log("Synced cloud settings")
        }
      } catch (error) {
        console.warn("Cloud sync failed, using local settings:", error)
      }
    }

    const response: SettingsResponse = {
      settings,
      authStatus,
      isDefault
    }

    console.log("Settings response:", response)

    res.send({
      success: true,
      data: response
    })
  } catch (error) {
    console.error("Error in get-user-settings:", error)
    res.send({
      success: false,
      error: error.message || "Failed to get user settings"
    })
  }
}

export default handler
