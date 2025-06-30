import type { PlasmoMessaging } from "@plasmohq/messaging"

import { OGCache } from "../../source/shared/utils/og-cache"

interface CleanAppCacheResponse {
  success: boolean
  error?: string
  cleanedCaches: string[]
}

/**
 * 清理应用缓存
 * 当添加新的缓存类型时，在这里添加清理逻辑
 */
const handler: PlasmoMessaging.MessageHandler<
  void,
  CleanAppCacheResponse
> = async (_, res) => {
  try {
    const cleanedCaches: string[] = []

    // 清理 OG 数据缓存
    await OGCache.cleanup(true)
    cleanedCaches.push("OG 数据缓存")

    // TODO: 在这里添加其他缓存的清理逻辑
    // 例如：
    // await OtherCache.cleanup()
    // cleanedCaches.push("其他缓存")

    res.send({
      success: true,
      cleanedCaches
    })
  } catch (error) {
    console.error("清理缓存失败:", error)
    res.send({
      success: false,
      error: error instanceof Error ? error.message : "清理缓存失败",
      cleanedCaches: []
    })
  }
}

export default handler
