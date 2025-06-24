/**
 * Chrome Storage 工具函数
 * 处理自定义颜色等需要同步的用户数据
 */

export interface CustomColorSettings {
  customColor?: string
  customColorUpdatedAt?: number
}

export interface ExtendedUserSettings {
  theme: string
  language: string
  fontSize: string
  customColor?: string
  customColorUpdatedAt?: number
  createdAt: number
  updatedAt: number
}

const STORAGE_KEYS = {
  CUSTOM_COLOR: "craz-custom-color",
  USER_SETTINGS: "craz-user-settings"
} as const

/**
 * 保存自定义颜色到Chrome Storage（同时保存到sync和local）
 */
export async function saveCustomColor(color: string): Promise<void> {
  const customColorData: CustomColorSettings = {
    customColor: color,
    customColorUpdatedAt: Date.now()
  }

  try {
    // 保存到 sync storage（Google账户同步）
    if (chrome.storage?.sync) {
      await chrome.storage.sync.set({
        [STORAGE_KEYS.CUSTOM_COLOR]: customColorData
      })
    }

    // 保存到 local storage（本地备份）
    if (chrome.storage?.local) {
      await chrome.storage.local.set({
        [STORAGE_KEYS.CUSTOM_COLOR]: customColorData
      })
    }
  } catch (error) {
    console.error("Failed to save custom color:", error)
    throw error
  }
}

/**
 * 读取自定义颜色（优先从sync读取，fallback到local）
 */
export async function getCustomColor(): Promise<string | null> {
  try {
    let syncData: CustomColorSettings | null = null
    let localData: CustomColorSettings | null = null

    // 尝试从sync storage读取
    if (chrome.storage?.sync) {
      try {
        const syncResult = await chrome.storage.sync.get([
          STORAGE_KEYS.CUSTOM_COLOR
        ])
        syncData = syncResult[STORAGE_KEYS.CUSTOM_COLOR] || null
      } catch (error) {
        console.warn("Failed to read from sync storage:", error)
      }
    }

    // 尝试从local storage读取
    if (chrome.storage?.local) {
      try {
        const localResult = await chrome.storage.local.get([
          STORAGE_KEYS.CUSTOM_COLOR
        ])
        localData = localResult[STORAGE_KEYS.CUSTOM_COLOR] || null
      } catch (error) {
        console.warn("Failed to read from local storage:", error)
      }
    }

    // 优先使用sync数据，如果sync数据更新或local数据不存在
    if (syncData && localData) {
      // 比较时间戳，使用最新的数据
      const syncTime = syncData.customColorUpdatedAt || 0
      const localTime = localData.customColorUpdatedAt || 0

      if (syncTime >= localTime) {
        // sync数据更新，同步到local
        if (syncTime > localTime) {
          await chrome.storage.local.set({
            [STORAGE_KEYS.CUSTOM_COLOR]: syncData
          })
        }
        return syncData.customColor || null
      } else {
        // local数据更新，同步到sync
        await chrome.storage.sync.set({
          [STORAGE_KEYS.CUSTOM_COLOR]: localData
        })
        return localData.customColor || null
      }
    } else if (syncData) {
      // 只有sync数据，同步到local
      await chrome.storage.local.set({
        [STORAGE_KEYS.CUSTOM_COLOR]: syncData
      })
      return syncData.customColor || null
    } else if (localData) {
      // 只有local数据，同步到sync
      await chrome.storage.sync.set({
        [STORAGE_KEYS.CUSTOM_COLOR]: localData
      })
      return localData.customColor || null
    }

    return null
  } catch (error) {
    console.error("Failed to get custom color:", error)
    return null
  }
}

/**
 * 删除自定义颜色
 */
export async function removeCustomColor(): Promise<void> {
  try {
    if (chrome.storage?.sync) {
      await chrome.storage.sync.remove([STORAGE_KEYS.CUSTOM_COLOR])
    }
    if (chrome.storage?.local) {
      await chrome.storage.local.remove([STORAGE_KEYS.CUSTOM_COLOR])
    }
  } catch (error) {
    console.error("Failed to remove custom color:", error)
    throw error
  }
}

/**
 * 监听自定义颜色变化
 */
export function onCustomColorChange(
  callback: (color: string | null) => void
): () => void {
  const handleStorageChange = (
    changes: { [key: string]: chrome.storage.StorageChange },
    namespace: string
  ) => {
    if (changes[STORAGE_KEYS.CUSTOM_COLOR]) {
      const newValue = changes[STORAGE_KEYS.CUSTOM_COLOR]
        .newValue as CustomColorSettings | null
      callback(newValue?.customColor || null)
    }
  }

  if (chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener(handleStorageChange)

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange)
    }
  }

  return () => {}
}

/**
 * 获取扩展的用户设置（包含自定义颜色）
 */
export async function getExtendedUserSettings(): Promise<
  Partial<ExtendedUserSettings>
> {
  try {
    const customColor = await getCustomColor()

    // 从现有的用户设置中读取基本设置
    let baseSettings: any = {}
    if (chrome.storage?.local) {
      const result = await chrome.storage.local.get([
        STORAGE_KEYS.USER_SETTINGS
      ])
      baseSettings = result[STORAGE_KEYS.USER_SETTINGS] || {}
    }

    return {
      ...baseSettings,
      customColor,
      customColorUpdatedAt: customColor ? Date.now() : undefined
    }
  } catch (error) {
    console.error("Failed to get extended user settings:", error)
    return {}
  }
}

/**
 * 保存扩展的用户设置
 */
export async function saveExtendedUserSettings(
  settings: Partial<ExtendedUserSettings>
): Promise<void> {
  try {
    // 如果包含自定义颜色，单独保存
    if (settings.customColor !== undefined) {
      await saveCustomColor(settings.customColor)
    }

    // 保存其他设置到常规存储
    const { customColor, customColorUpdatedAt, ...otherSettings } = settings

    if (Object.keys(otherSettings).length > 0) {
      if (chrome.storage?.local) {
        await chrome.storage.local.set({
          [STORAGE_KEYS.USER_SETTINGS]: {
            ...otherSettings,
            updatedAt: Date.now()
          }
        })
      }
    }
  } catch (error) {
    console.error("Failed to save extended user settings:", error)
    throw error
  }
}

/**
 * 保存认证 token 到 Chrome Storage
 */
export async function saveAuthToken(token: string): Promise<void> {
  try {
    if (chrome.storage?.local) {
      await chrome.storage.local.set({ "auth_token": token })
    }
  } catch (error) {
    console.error("Failed to save auth token:", error)
    throw error
  }
}

/**
 * 获取认证 token 从 Chrome Storage
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    if (chrome.storage?.local) {
      const result = await chrome.storage.local.get(["auth_token"])
      return result.auth_token || null
    }
    return null
  } catch (error) {
    console.error("Failed to get auth token:", error)
    return null
  }
}

/**
 * 删除认证 token
 */
export async function removeAuthToken(): Promise<void> {
  try {
    if (chrome.storage?.local) {
      await chrome.storage.local.remove(["auth_token"])
    }
  } catch (error) {
    console.error("Failed to remove auth token:", error)
    throw error
  }
}

/**
 * 监听认证 token 变化
 */
export function onAuthTokenChange(
  callback: (token: string | null) => void
): () => void {
  const handleStorageChange = (
    changes: { [key: string]: chrome.storage.StorageChange },
    namespace: string
  ) => {
    if (changes["auth_token"]) {
      const newValue = changes["auth_token"].newValue
      callback(newValue || null)
    }
  }

  if (chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener(handleStorageChange)

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange)
    }
  }

  return () => {}
}
