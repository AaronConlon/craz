import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"

import type { Env } from "../index"
import {
  BookmarkQuerySchema,
  CreateBookmarkSchema,
  SearchBookmarkSchema,
  UpdateBookmarkSchema
} from "../schemas/bookmark"
import { BookmarkService } from "../services/bookmark"

export const bookmarkRoutes = new Hono<{ Bindings: Env }>()

// 获取书签列表
bookmarkRoutes.get("/", zValidator("query", BookmarkQuerySchema), async (c) => {
  const query = c.req.valid("query")
  const bookmarkService = new BookmarkService(c.env.BOOKMARKS_KV)

  try {
    const result = await bookmarkService.getBookmarks(query)
    return c.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        hasNextPage: result.hasNextPage
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("获取书签列表失败:", error)
    throw new HTTPException(500, { message: "获取书签列表失败" })
  }
})

// 检查书签是否存在 - 必须在 /:id 路由之前定义
bookmarkRoutes.get("/check", async (c) => {
  const url = c.req.query("url")
  if (!url) {
    throw new HTTPException(400, { message: "URL 参数是必需的" })
  }

  const bookmarkService = new BookmarkService(c.env.BOOKMARKS_KV)

  try {
    const exists = await bookmarkService.checkBookmarkExists(url)
    return c.json({
      success: true,
      data: { exists },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("检查书签失败:", error)
    throw new HTTPException(500, { message: "检查书签失败" })
  }
})

// 搜索书签 - 必须在 /:id 路由之前定义
bookmarkRoutes.get(
  "/search",
  zValidator("query", SearchBookmarkSchema),
  async (c) => {
    const { q: query, tags, limit } = c.req.valid("query")
    const bookmarkService = new BookmarkService(c.env.BOOKMARKS_KV)

    try {
      const bookmarks = await bookmarkService.searchBookmarks(query, {
        tags,
        limit
      })
      return c.json({
        success: true,
        data: bookmarks,
        query,
        total: bookmarks.length,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error("搜索书签失败:", error)
      throw new HTTPException(500, { message: "搜索书签失败" })
    }
  }
)

// 获取所有标签 - 必须在 /:id 路由之前定义
bookmarkRoutes.get("/tags", async (c) => {
  const bookmarkService = new BookmarkService(c.env.BOOKMARKS_KV)

  try {
    const tags = await bookmarkService.getTags()
    return c.json({
      success: true,
      data: tags,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("获取标签失败:", error)
    throw new HTTPException(500, { message: "获取标签失败" })
  }
})

// 获取单个书签 - 通用路由，必须放在具体路由之后
bookmarkRoutes.get("/:id", async (c) => {
  const id = c.req.param("id")
  const bookmarkService = new BookmarkService(c.env.BOOKMARKS_KV)

  try {
    const bookmark = await bookmarkService.getBookmark(id)
    if (!bookmark) {
      throw new HTTPException(404, { message: "书签不存在" })
    }

    return c.json({
      success: true,
      data: bookmark,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    if (error instanceof HTTPException) throw error
    console.error("获取书签失败:", error)
    throw new HTTPException(500, { message: "获取书签失败" })
  }
})

// 创建书签
bookmarkRoutes.post(
  "/",
  zValidator("json", CreateBookmarkSchema),
  async (c) => {
    const data = c.req.valid("json")
    const bookmarkService = new BookmarkService(c.env.BOOKMARKS_KV)

    try {
      // 检查URL是否已存在
      const exists = await bookmarkService.checkBookmarkExists(data.url)
      if (exists) {
        throw new HTTPException(409, { message: "该 URL 已存在书签" })
      }

      const bookmark = await bookmarkService.createBookmark(data)
      return c.json(
        {
          success: true,
          data: bookmark,
          message: "书签创建成功",
          timestamp: new Date().toISOString()
        },
        201
      )
    } catch (error) {
      if (error instanceof HTTPException) throw error
      console.error("创建书签失败:", error)
      throw new HTTPException(500, { message: "创建书签失败" })
    }
  }
)

// 更新书签
bookmarkRoutes.put(
  "/:id",
  zValidator("json", UpdateBookmarkSchema),
  async (c) => {
    const id = c.req.param("id")
    const data = c.req.valid("json")
    const bookmarkService = new BookmarkService(c.env.BOOKMARKS_KV)

    try {
      const updatedBookmark = await bookmarkService.updateBookmark(id, data)
      if (!updatedBookmark) {
        throw new HTTPException(404, { message: "书签不存在" })
      }

      return c.json({
        success: true,
        data: updatedBookmark,
        message: "书签更新成功",
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      if (error instanceof HTTPException) throw error
      console.error("更新书签失败:", error)
      throw new HTTPException(500, { message: "更新书签失败" })
    }
  }
)

// 删除书签
bookmarkRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id")
  const bookmarkService = new BookmarkService(c.env.BOOKMARKS_KV)

  try {
    const deleted = await bookmarkService.deleteBookmark(id)
    if (!deleted) {
      throw new HTTPException(404, { message: "书签不存在" })
    }

    return c.json({
      success: true,
      message: "书签删除成功",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    if (error instanceof HTTPException) throw error
    console.error("删除书签失败:", error)
    throw new HTTPException(500, { message: "删除书签失败" })
  }
})
