import type { PlasmoMessaging } from "@plasmohq/messaging"

import { OGCache } from "../../source/shared/utils/og-cache"

interface OGData {
  url: string
  title?: string
  description?: string
  image?: string
  favicon?: string
  type?: string
  siteName?: string
  locale?: string
  cachedAt: string
  error?: string
}

interface ParseResponse {
  success: boolean
  data: OGData
  error?: string
}

// 从环境变量获取 API 配置
const API_ENDPOINT =
  process.env.PLASMO_PUBLIC_OG_API_ENDPOINT || "http://og-api.i5lin.top/api"
const API_TOKEN = process.env.PLASMO_PUBLIC_OG_API_TOKEN || "your-secret-token"

// 验证环境变量
if (!process.env.PLASMO_PUBLIC_OG_API_ENDPOINT) {
  console.warn("警告: 未设置 PLASMO_PUBLIC_OG_API_ENDPOINT，使用默认值")
}
if (!process.env.PLASMO_PUBLIC_OG_API_TOKEN) {
  console.warn("警告: 未设置 PLASMO_PUBLIC_OG_API_TOKEN，使用默认值")
}

/**
 * 从新的解析 API 获取 OG 数据
 */
async function fetchOGDataFromAPI(url: string): Promise<OGData> {
  try {
    // 从缓存中读取数据
    const cachedData = await OGCache.get(url)
    if (cachedData) {
      console.log("从缓存获取 OG 数据:", url)
      return cachedData
    }

    console.log("开始请求 OG 数据:", url)
    const response = await fetch(`${API_ENDPOINT}/parse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify({ url })
    })

    console.log("API 响应状态:", response.status)
    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`)
    }

    const result: ParseResponse = await response.json()
    console.log("API 响应数据:", result)

    if (!result.success) {
      throw new Error("解析失败: " + (result.error || "未知错误"))
    }

    // 写入缓存
    await OGCache.set(result.data)
    return result.data
  } catch (error) {
    console.error("获取 OG 数据失败:", error)
    // 返回一个基本的数据结构，包含错误信息
    throw error
  }
}

/**
 * 处理 OG 数据获取请求
 */
const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const { url } = req.body

  if (!url) {
    return res.send({
      success: false,
      error: "URL 不能为空"
    })
  }

  try {
    const data = await fetchOGDataFromAPI(url)
    res.send({
      success: true,
      data
    })
  } catch (error) {
    res.send({
      success: false,
      error: error instanceof Error ? error.message : "未知错误"
    })
  }
}

export default handler
