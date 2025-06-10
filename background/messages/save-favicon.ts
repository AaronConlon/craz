import type { PlasmoMessaging } from "@plasmohq/messaging";





/**
 * Chrome 扩展架构说明：Background 作为服务中间层
 *
 * 数据流向：UI 组件 → Background (此处) → IndexedDB → Background → UI
 *
 * 职责分离：
 * - UI 负责检测需要缓存的 favicon
 * - Background 负责下载图片并转换为 base64
 * - 下载失败时使用默认 favicon
 * - 通过 @plasmohq/messaging 进行通信
 */

// 默认的 favicon base64 字符串（16x16像素的简单网页图标）
const DEFAULT_FAVICON_BASE64 =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiByeD0iMiIgZmlsbD0iIzk0QTNBRiIvPgo8Y2lyY2xlIGN4PSI4IiBjeT0iOCIgcj0iNCIgZmlsbD0iIzY4NzI4MCIvPgo8L3N2Zz4K"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log("[Background] 保存 favicon 请求:", req.body)

  try {
    const { url } = req.body

    if (!url) {
      throw new Error("缺少 favicon URL")
    }

    // 下载图片
    console.log("[Background] 开始下载 favicon:", url)
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`下载失败: ${response.status} ${response.statusText}`)
    }

    // 获取图片数据
    const arrayBuffer = await response.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // 转换为 base64
    const base64String = btoa(String.fromCharCode(...uint8Array))
    const contentType = response.headers.get("content-type") || "image/png"
    const base64DataUrl = `data:${contentType};base64,${base64String}`

    console.log("[Background] Favicon 转换为 base64 成功:", {
      url,
      size: arrayBuffer.byteLength,
      contentType
    })

    // 返回 base64 数据给前端，让前端保存到 IndexedDB
    res.send({
      success: true,
      url,
      base64: base64DataUrl,
      timestamp: Date.now(),
      size: arrayBuffer.byteLength,
      isDefault: false // 标记为真实下载的图标
    })
  } catch (error) {
    console.warn("[Background] 下载 favicon 失败，使用默认图标:", error)

    // 下载失败时返回默认 favicon
    res.send({
      success: true,
      url: req.body?.url,
      base64: DEFAULT_FAVICON_BASE64,
      timestamp: Date.now(),
      size: DEFAULT_FAVICON_BASE64.length,
      isDefault: true // 标记为默认图标
    })
  }
}

export default handler