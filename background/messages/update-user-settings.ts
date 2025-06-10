import type { PlasmoMessaging } from "@plasmohq/messaging"

import type { AuthStatus, UserSettings } from "~source/shared/types/settings"

interface UpdateSettingsRequest {
  settings: Partial<UserSettings>
}

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
async function getLocalSettings(): Promise<UserSettings> {
  try {
    const result = await chrome.storage.local.get(["craz-user-settings"])
    return result["craz-user-settings"]
  } catch (error) {
    console.error("Error getting local settings:", error)
    throw error
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

// 同步设置到云端（模拟实现）
async function syncSettingsToCloud(
  settings: UserSettings,
  token: string
): Promise<void> {
  try {
    // TODO: 实现真实的云端API调用
    // await fetch('https://api.craz.com/user/settings', {
    //   method: 'PUT',
    //   headers: {
    //     'Authorization': `Bearer ${token}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(settings)
    // })

    console.log("Settings synced to cloud (simulated)")
  } catch (error) {
    console.error("Error syncing settings to cloud:", error)
    throw error
  }
}

const handler: PlasmoMessaging.MessageHandler<UpdateSettingsRequest> = async (
  req,
  res
) => {
  try {
    const { settings: newSettings } = req.body
    console.log("Updating user settings:", newSettings)

    if (!newSettings || Object.keys(newSettings).length === 0) {
      throw new Error("No settings provided")
    }

    // 1. 获取当前设置
    const currentSettings = await getLocalSettings()

    // 2. 合并设置
    const updatedSettings: UserSettings = {
      ...currentSettings,
      ...newSettings,
      updatedAt: Date.now()
    }

    // 3. 保存到本地
    await saveLocalSettings(updatedSettings)
    console.log("Settings saved locally:", updatedSettings)

    // 4. 检查登录状态
    const authStatus = await checkAuthStatus()

    // 5. 如果已登录，同步到云端
    if (authStatus.isLoggedIn && authStatus.token) {
      try {
        await syncSettingsToCloud(updatedSettings, authStatus.token)
        console.log("Settings synced to cloud")
      } catch (error) {
        console.warn("Cloud sync failed, but local save succeeded:", error)
        // 不影响本地保存，继续执行
      }
    }

    res.send({
      success: true,
      data: {
        settings: updatedSettings,
        authStatus
      }
    })
  } catch (error) {
    console.error("Error in update-user-settings:", error)
    res.send({
      success: false,
      error: error.message || "Failed to update user settings"
    })
  }
}

export default handler
