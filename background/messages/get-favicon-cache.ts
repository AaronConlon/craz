import type { PlasmoMessaging } from "@plasmohq/messaging"

export interface GetFaviconCacheRequest {
  url: string
}

export interface GetFaviconCacheResponse {
  success: boolean
  cached?: string // base64 数据
  error?: string
}

/**
 * Background Message Handler: get-favicon-cache
 *
 * 功能：从 IndexedDB 获取 favicon 缓存
 * 架构说明：
 * - 统一在 background 中处理 IndexedDB 操作
 * - UI 通过 messaging 请求缓存数据
 * - 支持 24 小时缓存过期机制
 */
const handler: PlasmoMessaging.MessageHandler<
  GetFaviconCacheRequest,
  GetFaviconCacheResponse
> = async (req, res) => {
  console.log("[Background] 获取 favicon 缓存请求:", req.body)

  try {
    const { url } = req.body

    if (!url) {
      throw new Error("缺少 favicon URL")
    }

    // 从 IndexedDB 获取缓存
    const cached = await getCachedFavicon(url)

    if (cached) {
      console.log("[Background] 找到 favicon 缓存:", url)
      res.send({
        success: true,
        cached
      })
    } else {
      console.log("[Background] 未找到 favicon 缓存:", url)
      res.send({
        success: true,
        cached: undefined
      })
    }
  } catch (error) {
    console.error("[Background] 获取 favicon 缓存失败:", error)
    res.send({
      success: false,
      error: error instanceof Error ? error.message : "获取缓存失败"
    })
  }
}

// 从 IndexedDB 获取缓存的 favicon
async function getCachedFavicon(url: string): Promise<string | null> {
  try {
    const request = indexedDB.open("CrazExtensionDB", 1)

    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains("faviconCache")) {
          db.createObjectStore("faviconCache", { keyPath: "url" })
        }
      }

      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction(["faviconCache"], "readonly")
        const store = transaction.objectStore("faviconCache")
        const getRequest = store.get(url)

        getRequest.onsuccess = () => {
          const result = getRequest.result
          if (result && result.data) {
            // 检查缓存是否过期（24小时）
            const now = Date.now()
            const cached = result.data.split("____")
            if (cached.length === 2) {
              const timestamp = parseInt(cached[0])
              const base64 = cached[1]

              if (now - timestamp < 24 * 60 * 60 * 1000) {
                resolve(base64)
              } else {
                resolve(null) // 缓存过期
              }
            } else {
              resolve(null)
            }
          } else {
            resolve(null)
          }
        }

        getRequest.onerror = () => resolve(null)
      }
    })
  } catch (error) {
    console.error("[Background] 从 IndexedDB 获取缓存失败:", error)
    return null
  }
}

export default handler
