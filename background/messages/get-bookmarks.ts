import type { PlasmoMessaging } from "@plasmohq/messaging"

/**
 * Chrome 扩展架构说明：Background 作为服务中间层
 *
 * 数据流向：UI 组件 → Background (此处) → Chrome Bookmarks API → Background → UI
 *
 * 职责分离：
 * - UI 负责展示和用户交互
 * - Background 负责所有 Chrome API 调用和数据处理
 * - 通过 @plasmohq/messaging 进行通信
 */

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log("[Background] 获取书签请求:", req.body)

  try {
    // 获取所有 Chrome 书签
    const bookmarksTree = await chrome.bookmarks.getTree()

    // 扁平化书签树，只保留有用的书签
    const flattenBookmarks = (
      nodes: chrome.bookmarks.BookmarkTreeNode[]
    ): chrome.bookmarks.BookmarkTreeNode[] => {
      const result: chrome.bookmarks.BookmarkTreeNode[] = []

      nodes.forEach((node) => {
        // 跳过根节点和系统文件夹
        if (node.id === "0" || node.title === "") {
          if (node.children) {
            result.push(...flattenBookmarks(node.children))
          }
          return
        }

        result.push(node)
      })

      return result
    }

    const bookmarks = flattenBookmarks(bookmarksTree)

    console.log("[Background] 获取书签成功:", { count: bookmarks.length })

    res.send({
      success: true,
      bookmarks: bookmarks,
      count: bookmarks.length
    })
  } catch (error) {
    console.error("[Background] 获取书签失败:", error)

    res.send({
      success: false,
      error: error instanceof Error ? error.message : "获取书签失败",
      bookmarks: []
    })
  }
}

export default handler
