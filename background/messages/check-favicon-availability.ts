import type { PlasmoMessaging } from "@plasmohq/messaging"

export interface CheckFaviconAvailabilityRequest {
  url: string
  timeout?: number // 超时时间，默认 5000ms
}

export interface CheckFaviconAvailabilityResponse {
  success: boolean
  available: boolean // 资源是否可用
  statusCode?: number // HTTP 状态码
  contentType?: string // 内容类型
  contentLength?: number // 内容大小
  error?: string
}

/**
 * Background Message Handler: check-favicon-availability
 *
 * 功能：使用 HEAD 请求检测 favicon 资源是否可用
 * 架构说明：
 * - 使用 HEAD 请求减少网络流量
 * - 快速检测资源可用性，不下载实际内容
 * - 返回详细的资源信息用于决策
 * - 支持超时控制，避免长时间等待
 */
const handler: PlasmoMessaging.MessageHandler<
  CheckFaviconAvailabilityRequest,
  CheckFaviconAvailabilityResponse
> = async (req, res) => {
  console.log("[Background] 检测 favicon 可用性请求:", req.body)

  try {
    const { url, timeout = 5000 } = req.body

    if (!url) {
      throw new Error("缺少 favicon URL")
    }

    // 验证 URL 格式
    let targetUrl: string
    try {
      targetUrl = new URL(url).toString()
    } catch {
      throw new Error("无效的 URL 格式")
    }

    // 使用 HEAD 请求检测资源可用性
    const availability = await checkFaviconWithHead(targetUrl, timeout)

    console.log("[Background] Favicon 可用性检测结果:", {
      url: targetUrl,
      available: availability.available,
      statusCode: availability.statusCode
    })

    res.send({
      success: true,
      ...availability
    })
  } catch (error) {
    console.error("[Background] 检测 favicon 可用性失败:", error)
    res.send({
      success: false,
      available: false,
      error: error instanceof Error ? error.message : "检测失败"
    })
  }
}

/**
 * 使用 HEAD 请求检测 favicon 可用性
 */
async function checkFaviconWithHead(
  url: string,
  timeout: number
): Promise<{
  available: boolean
  statusCode?: number
  contentType?: string
  contentLength?: number
}> {
  try {
    // 创建带超时的 AbortController
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      method: "HEAD", // 使用 HEAD 请求
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    })

    clearTimeout(timeoutId)

    const statusCode = response.status
    const contentType = response.headers.get("content-type")
    const contentLength = parseInt(
      response.headers.get("content-length") || "0"
    )

    // 检查状态码
    const available = response.ok && statusCode >= 200 && statusCode < 400

    // 额外检查：如果有 content-type，确保是图片类型
    const isValidImageType =
      !contentType ||
      contentType.startsWith("image/") ||
      contentType.includes("icon") ||
      contentType.includes("octet-stream") // 有些服务器返回这个

    console.log(`[Background] HEAD 请求结果:`, {
      url,
      statusCode,
      contentType,
      contentLength,
      available: available && isValidImageType
    })

    return {
      available: available && isValidImageType,
      statusCode,
      contentType: contentType || undefined,
      contentLength: contentLength || undefined
    }
  } catch (error) {
    console.warn(`[Background] HEAD 请求失败:`, error)

    // 如果是超时错误
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`请求超时 (${timeout}ms)`)
    }

    // 其他网络错误
    throw new Error(
      `网络请求失败: ${error instanceof Error ? error.message : "未知错误"}`
    )
  }
}

export default handler
