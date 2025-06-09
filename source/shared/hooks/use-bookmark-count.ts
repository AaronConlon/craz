import { useEffect, useState } from "react"

import { sendToBackground } from "@plasmohq/messaging"

/**
 * 获取书签数量的 Hook
 */
export function useBookmarkCount() {
  const [userBookmarkCount, setUserBookmarkCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBookmarkCount = async () => {
      try {
        const response = await sendToBackground({
          name: "get-bookmarks"
        })

        if (response.success && response.bookmarks) {
          // 递归计算所有书签的数量（只计算有 URL 的书签）
          const countBookmarks = (bookmarks: any[]): number => {
            return bookmarks.reduce((count, bookmark) => {
              let currentCount = bookmark.url ? 1 : 0
              if (bookmark.children) {
                currentCount += countBookmarks(bookmark.children)
              }
              return count + currentCount
            }, 0)
          }

          setUserBookmarkCount(countBookmarks(response.bookmarks))
        }
      } catch (error) {
        console.error("Failed to fetch bookmark count:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBookmarkCount()
  }, [])

  return {
    userBookmarkCount,
    teamBookmarkCount: 6, // 模拟团队书签数量
    loading
  }
}
