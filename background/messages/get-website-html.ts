import type { PlasmoMessaging } from "@plasmohq/messaging"

interface GetWebsiteHtmlRequest {
  url: string
}

interface GetWebsiteHtmlResponse {
  success: boolean
  html?: string
  error?: string
}

const handler: PlasmoMessaging.MessageHandler<
  GetWebsiteHtmlRequest,
  GetWebsiteHtmlResponse
> = async (req, res) => {
  try {
    const { url } = req.body

    if (!url) {
      return res.send({
        success: false,
        error: "URL 不能为空"
      })
    }

    // 添加请求头模拟浏览器
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get("content-type") || ""
    if (!contentType.includes("text/html")) {
      throw new Error("URL 返回的不是 HTML 内容")
    }

    const html = await response.text()
    res.send({
      success: true,
      html
    })
  } catch (error) {
    res.send({
      success: false,
      error: error instanceof Error ? error.message : "未知错误"
    })
  }
}

export default handler
