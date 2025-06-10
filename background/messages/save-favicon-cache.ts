import type { PlasmoMessaging } from "@plasmohq/messaging"

export interface SaveFaviconCacheRequest {
  url: string
  base64: string
}

export interface SaveFaviconCacheResponse {
  success: boolean
  error?: string
}

/**
 * Background Message Handler: save-favicon-cache
 *
 * 功能：将 favicon 缓存保存到 IndexedDB
 * 架构说明：
 * - 统一在 background 中处理 IndexedDB 操作
 * - 使用时间戳格式：timestamp____base64
 * - 自动创建数据库和表结构
 */
const handler: PlasmoMessaging.MessageHandler<
  SaveFaviconCacheRequest,
  SaveFaviconCacheResponse
> = async (req, res) => {
  console.log("[Background] 保存 favicon 缓存请求:", req.body)

  try {
    const { url, base64 } = req.body

    if (!url || !base64) {
      throw new Error("缺少必要参数: url 或 base64")
    }

    // 保存到 IndexedDB, 保存支持 img 可用的 base64 url
    const base64Url = `data:image/png;base64,${base64}`
    await saveFaviconToIndexedDB(url, base64Url)

    console.log("[Background] Favicon 缓存保存成功:", url)
    res.send({
      success: true
    })
  } catch (error) {
    console.error("[Background] 保存 favicon 缓存失败:", error)
    res.send({
      success: false,
      error: error instanceof Error ? error.message : "保存缓存失败"
    })
  }
}

// 保存 favicon 到 IndexedDB
async function saveFaviconToIndexedDB(
  url: string,
  base64: string
): Promise<void> {
  try {
    const request = indexedDB.open("CrazExtensionDB", 1)

    return new Promise<void>((resolve, reject) => {
      request.onerror = () => reject(request.error)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains("faviconCache")) {
          db.createObjectStore("faviconCache", { keyPath: "url" })
        }
      }

      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction(["faviconCache"], "readwrite")
        const store = transaction.objectStore("faviconCache")

        // 使用时间戳格式保存
        const timestamp = Date.now()
        const data = `${timestamp}____${base64}`

        const putRequest = store.put({ url, data })

        putRequest.onsuccess = () => resolve()
        putRequest.onerror = () => reject(putRequest.error)
      }
    })
  } catch (error) {
    console.error("[Background] 保存到 IndexedDB 失败:", error)
    throw error
  }
}

export default handler
