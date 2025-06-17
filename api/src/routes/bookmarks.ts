import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { HTTPException } from "hono/http-exception"
import { z } from "zod"

import type { Env } from "../index"
import { createJwtMiddleware } from "../middleware/jwt"
import {
  BookmarkQuerySchema,
  CreateBookmarkSchema,
  SearchBookmarkSchema,
  UpdateBookmarkSchema
} from "../schemas/bookmark"
import type { JwtPayload } from "../schemas/user"
import { AuthService } from "../services/auth"
import { BookmarkService } from "../services/bookmark"

const app = new Hono<{ Bindings: Env }>()

// 使用我们的自定义 JWT 中间件，它支持我们的 payload 结构
const jwtAuth = createJwtMiddleware()
app.use("*", jwtAuth)

// 辅助函数：获取用户ID
const getUserId = (c: any): string => {
  const payload = c.get("jwtPayload") as JwtPayload
  return payload.userId
}

// 创建兼容数据库的验证 schema - 支持两种格式
const bookmarkSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(200, "标题过长"),
  url: z.string().url("URL 格式不正确").nullable(),
  parentId: z.string().nullable(),
  sortOrder: z.number(),
  // 支持扁平格式的字段
  tags: z.array(z.string()).optional(),
  description: z.string().max(1000, "描述过长").optional(),
  // 也支持metadata格式
  metadata: z
    .object({
      tags: z.array(z.string()).optional().default([]),
      description: z.string().max(1000, "描述过长").optional().default("")
    })
    .optional()
})

// 获取书签列表
app.get("/", zValidator("query", BookmarkQuerySchema), async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const query = c.req.valid("query")

  try {
    // 计算偏移量
    const offset = (query.page - 1) * query.pageSize

    // 构建查询条件
    let whereClause = "WHERE user_id = ?"
    const params = [userId]

    if (query.search) {
      whereClause += " AND (title LIKE ? OR url LIKE ?)"
      const searchPattern = `%${query.search}%`
      params.push(searchPattern, searchPattern)
    }

    // 获取总数
    const countResult = (await db
      .prepare(`SELECT COUNT(*) as total FROM bookmarks ${whereClause}`)
      .bind(...params)
      .first()) as { total: number }

    // 获取书签数据
    const bookmarksResult = await db
      .prepare(
        `
        SELECT id, url, title, parent_id, sort_order, date_added, 
               metadata, created_at, updated_at
        FROM bookmarks 
        ${whereClause}
        ORDER BY sort_order ASC, created_at DESC
        LIMIT ? OFFSET ?
      `
      )
      .bind(...params, query.pageSize, offset)
      .all()

    // 转换字段名为camelCase格式
    const bookmarks = (bookmarksResult.results || []).map((bookmark: any) => ({
      id: bookmark.id,
      url: bookmark.url,
      title: bookmark.title,
      parentId: bookmark.parent_id,
      index: bookmark.sort_order,
      sortOrder: bookmark.sort_order,
      dateAdded: bookmark.date_added,
      dateGroupModified: bookmark.date_modified,
      tags: bookmark.metadata ? JSON.parse(bookmark.metadata).tags || [] : [],
      description: bookmark.metadata
        ? JSON.parse(bookmark.metadata).description || ""
        : "",
      createdAt: bookmark.created_at,
      updatedAt: bookmark.updated_at
    }))

    const total = countResult?.total || 0
    const hasNextPage = offset + query.pageSize < total

    return c.json({
      success: true,
      message: "获取书签列表成功",
      data: bookmarks,
      pagination: {
        total,
        page: query.page,
        pageSize: query.pageSize,
        hasNextPage
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("获取书签列表失败:", error)
    throw new HTTPException(500, { message: "获取书签列表失败" })
  }
})

// 检查书签是否存在 - 必须在 /:id 路由之前定义
app.get("/check", async (c) => {
  const url = c.req.query("url")
  if (!url) {
    throw new HTTPException(400, { message: "URL 参数是必需的" })
  }

  const db = c.env.DB
  const userId = getUserId(c)

  try {
    const bookmark = await db
      .prepare("SELECT id FROM bookmarks WHERE url = ? AND user_id = ?")
      .bind(url, userId)
      .first()

    const exists = !!bookmark
    return c.json({
      success: true,
      message: "检查书签存在性成功",
      data: { exists },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("检查书签失败:", error)
    throw new HTTPException(500, { message: "检查书签失败" })
  }
})

// 搜索书签 - 必须在 /:id 路由之前定义
app.get("/search", zValidator("query", SearchBookmarkSchema), async (c) => {
  const { q: query, tags, limit } = c.req.valid("query")
  const db = c.env.DB
  const userId = getUserId(c)

  try {
    // 构建搜索条件
    let whereClause = "WHERE user_id = ?"
    const params = [userId]

    // 如果既没有关键词也没有标签，返回空结果
    if (!query && (!tags || tags.length === 0)) {
      return c.json({
        success: true,
        message: "搜索书签成功",
        data: [],
        query: query || "",
        total: 0,
        timestamp: new Date().toISOString()
      })
    }

    // 构建搜索条件数组
    const searchConditions = []

    // 关键词搜索条件
    if (query) {
      searchConditions.push("(title LIKE ? OR url LIKE ?)")
      params.push(`%${query}%`, `%${query}%`)
    }

    // 标签搜索条件
    if (tags && tags.length > 0) {
      const tagConditions = []
      for (const tag of tags) {
        tagConditions.push(
          "(metadata LIKE ? OR metadata LIKE ? OR metadata LIKE ?)"
        )
        // 匹配不同的JSON格式：开头、中间、结尾
        params.push(`%"${tag}"%`, `%"tags":["${tag}"%`, `%,"${tag}"%`)
      }
      searchConditions.push(`(${tagConditions.join(" OR ")})`)
    }

    // 组合搜索条件：使用OR逻辑连接关键词搜索和标签搜索
    if (searchConditions.length > 0) {
      whereClause += ` AND (${searchConditions.join(" OR ")})`
    }

    // 执行搜索查询
    const bookmarksResult = await db
      .prepare(
        `
        SELECT id, url, title, parent_id, sort_order, date_added, 
               metadata, created_at, updated_at
        FROM bookmarks 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ?
      `
      )
      .bind(...params, limit)
      .all()

    // 转换字段名为camelCase格式
    const bookmarks = (bookmarksResult.results || []).map((bookmark: any) => ({
      id: bookmark.id,
      url: bookmark.url,
      title: bookmark.title,
      parentId: bookmark.parent_id,
      index: bookmark.sort_order,
      sortOrder: bookmark.sort_order,
      dateAdded: bookmark.date_added,
      dateGroupModified: bookmark.date_modified,
      tags: bookmark.metadata
        ? JSON.parse(bookmark.metadata as string).tags || []
        : [],
      description: bookmark.metadata
        ? JSON.parse(bookmark.metadata as string).description || ""
        : "",
      createdAt: bookmark.created_at,
      updatedAt: bookmark.updated_at
    }))

    return c.json({
      success: true,
      message: "搜索书签成功",
      data: bookmarks,
      query,
      total: bookmarks.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("搜索书签失败:", error)
    throw new HTTPException(500, { message: "搜索书签失败" })
  }
})

// 获取所有标签 - 必须在 /:id 路由之前定义
app.get("/tags", async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)

  try {
    // 从D1数据库获取所有书签的metadata
    const bookmarksResult = await db
      .prepare(
        `
        SELECT metadata
        FROM bookmarks 
        WHERE user_id = ? AND metadata IS NOT NULL
        ORDER BY created_at DESC
      `
      )
      .bind(userId)
      .all()

    // 提取所有标签
    const allTags = new Set<string>()

    for (const bookmark of bookmarksResult.results || []) {
      try {
        const metadata = JSON.parse((bookmark as any).metadata)
        if (metadata.tags && Array.isArray(metadata.tags)) {
          metadata.tags.forEach((tag: string) => allTags.add(tag))
        }
      } catch (error) {
        // 忽略JSON解析错误
        continue
      }
    }

    const tags = Array.from(allTags).sort()

    return c.json({
      success: true,
      message: "获取标签列表成功",
      data: tags,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("获取标签失败:", error)
    throw new HTTPException(500, { message: "获取标签失败" })
  }
})

// 获取单个书签 - 通用路由，必须放在具体路由之后
app.get("/:id", async (c) => {
  const id = c.req.param("id")
  const db = c.env.DB
  const userId = getUserId(c)

  try {
    const bookmarkData = (await db
      .prepare(
        `
        SELECT id, url, title, parent_id, sort_order, date_added, 
               metadata, created_at, updated_at
        FROM bookmarks 
        WHERE id = ? AND user_id = ?
      `
      )
      .bind(id, userId)
      .first()) as any

    if (!bookmarkData) {
      throw new HTTPException(404, { message: "书签不存在" })
    }

    // 转换字段名为camelCase格式
    const metadata = bookmarkData.metadata
      ? JSON.parse(bookmarkData.metadata as string)
      : {}

    const bookmark = {
      id: bookmarkData.id,
      url: bookmarkData.url,
      title: bookmarkData.title,
      parentId: bookmarkData.parent_id,
      index: bookmarkData.sort_order,
      sortOrder: bookmarkData.sort_order,
      dateAdded: bookmarkData.date_added,
      dateGroupModified: bookmarkData.date_modified,
      tags: metadata.tags || [],
      description: metadata.description || "",
      metadata: metadata, // 保留原始metadata对象
      createdAt: bookmarkData.created_at,
      updatedAt: bookmarkData.updated_at
    }

    return c.json({
      success: true,
      message: "获取书签成功",
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
app.post("/", zValidator("json", bookmarkSchema), async (c) => {
  const db = c.env.DB

  const userId = getUserId(c) // 从JWT中获取真实用户ID

  const data = c.req.valid("json")

  // 处理两种格式：扁平格式和metadata格式
  let metadata: any = data.metadata || {}

  // 如果有扁平格式的字段，合并到metadata中
  if (data.tags || data.description) {
    metadata = {
      ...metadata,
      tags: data.tags || metadata.tags || [],
      description: data.description || metadata.description || ""
    }
  }

  // 生成唯一的书签ID
  const bookmarkId = crypto.randomUUID()
  const now = new Date().toISOString()

  const result = await db
    .prepare(
      `
    INSERT INTO bookmarks (
      id, url, title, parent_id, sort_order, date_added, date_modified,
      metadata, user_id, created_by, updated_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
    )
    .bind(
      bookmarkId,
      data.url,
      data.title,
      data.parentId,
      data.sortOrder,
      Date.now(),
      Date.now(),
      JSON.stringify(metadata),
      userId,
      userId,
      userId,
      now,
      now
    )
    .run()

  return c.json({ success: true, message: "创建书签成功", id: bookmarkId })
})

// 更新书签
app.put("/:id", zValidator("json", UpdateBookmarkSchema), async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const bookmarkId = c.req.param("id") as string
  const data = c.req.valid("json")

  try {
    // 首先获取现有书签数据
    const existingBookmark = (await db
      .prepare(
        `
        SELECT url, title, parent_id, sort_order, metadata
        FROM bookmarks 
        WHERE id = ? AND user_id = ?
      `
      )
      .bind(bookmarkId, userId)
      .first()) as any

    if (!existingBookmark) {
      throw new HTTPException(404, { message: "书签不存在" })
    }

    // 构建更新数据，只更新提供的字段
    const updateData = {
      url: data.url !== undefined ? data.url : existingBookmark.url,
      title: data.title !== undefined ? data.title : existingBookmark.title,
      parentId:
        data.parentId !== undefined
          ? data.parentId
          : existingBookmark.parent_id,
      sortOrder:
        data.sortOrder !== undefined
          ? data.sortOrder
          : existingBookmark.sort_order,
      metadata:
        data.metadata !== undefined
          ? JSON.stringify(data.metadata)
          : existingBookmark.metadata
    }

    const result = await db
      .prepare(
        `
        UPDATE bookmarks 
        SET url = ?, title = ?, parent_id = ?, sort_order = ?,
            date_modified = ?, metadata = ?, updated_by = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
      `
      )
      .bind(
        updateData.url,
        updateData.title,
        updateData.parentId,
        updateData.sortOrder,
        Date.now(),
        updateData.metadata,
        userId,
        new Date().toISOString(),
        bookmarkId,
        userId
      )
      .run()

    return c.json({
      success: true,
      message: "更新书签成功",
      affected: result.meta.changes
    })
  } catch (error) {
    if (error instanceof HTTPException) throw error
    console.error("更新书签失败:", error)
    throw new HTTPException(500, { message: "更新书签失败" })
  }
})

// 删除书签
app.delete("/:id", async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const bookmarkId = c.req.param("id") as string

  const result = await db
    .prepare(
      `
    DELETE FROM bookmarks 
    WHERE id = ? AND user_id = ?
  `
    )
    .bind(bookmarkId, userId)
    .run()

  return c.json({
    success: true,
    message: "删除书签成功",
    affected: result.meta.changes
  })
})

// 团队书签路由
app.get("/api/teams/:teamId/bookmarks", async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const teamId = c.req.param("teamId") as string

  // 检查用户是否有权限访问团队书签
  const member = (await db
    .prepare("SELECT role FROM team_members WHERE team_id = ? AND user_id = ?")
    .bind(teamId, userId)
    .first()) as { role: string } | null

  if (!member) {
    throw new HTTPException(403, { message: "无权访问团队书签" })
  }

  const bookmarks = await db
    .prepare(
      `
    SELECT * FROM bookmarks 
    WHERE team_id = ? 
    ORDER BY sort_order ASC
  `
    )
    .bind(teamId)
    .all()

  return c.json({
    success: true,
    message: "获取团队书签成功",
    data: bookmarks.results
  })
})

app.post(
  "/api/teams/:teamId/bookmarks",
  zValidator("json", bookmarkSchema),
  async (c) => {
    const db = c.env.DB
    const userId = getUserId(c)
    const teamId = c.req.param("teamId") as string
    const data = c.req.valid("json")

    // 检查用户是否有权限创建团队书签
    const member = (await db
      .prepare(
        "SELECT role, t.settings FROM team_members tm JOIN teams t ON t.id = tm.team_id WHERE tm.team_id = ? AND tm.user_id = ?"
      )
      .bind(teamId, userId)
      .first()) as { role: string; settings: string } | null

    if (!member) {
      throw new HTTPException(403, { message: "无权创建团队书签" })
    }

    const settings = JSON.parse(member.settings)
    if (!settings.allowMemberEdit && member.role === "member") {
      throw new HTTPException(403, { message: "普通成员无权创建团队书签" })
    }

    // 生成唯一的书签ID
    const bookmarkId = crypto.randomUUID()
    const now = new Date().toISOString()

    const result = await db
      .prepare(
        `
      INSERT INTO bookmarks (
        id, url, title, parent_id, sort_order, date_added, date_modified,
        metadata, team_id, created_by, updated_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .bind(
        bookmarkId,
        data.url,
        data.title,
        data.parentId,
        data.sortOrder,
        Date.now(),
        Date.now(),
        JSON.stringify(data.metadata || {}),
        teamId,
        userId,
        userId,
        now,
        now
      )
      .run()

    return c.json({
      success: true,
      message: "创建团队书签成功",
      id: bookmarkId
    })
  }
)

app.put(
  "/api/teams/:teamId/bookmarks/:id",
  zValidator("json", bookmarkSchema),
  async (c) => {
    const db = c.env.DB
    const userId = getUserId(c)
    const teamId = c.req.param("teamId") as string
    const bookmarkId = c.req.param("id") as string
    const data = c.req.valid("json")

    // 检查用户是否有权限更新团队书签
    const member = (await db
      .prepare(
        "SELECT role, t.settings FROM team_members tm JOIN teams t ON t.id = tm.team_id WHERE tm.team_id = ? AND tm.user_id = ?"
      )
      .bind(teamId, userId)
      .first()) as { role: string; settings: string } | null

    if (!member) {
      throw new HTTPException(403, { message: "无权更新团队书签" })
    }

    const settings = JSON.parse(member.settings)
    if (!settings.allowMemberEdit && member.role === "member") {
      throw new HTTPException(403, { message: "普通成员无权更新团队书签" })
    }

    const result = await db
      .prepare(
        `
      UPDATE bookmarks 
      SET url = ?, title = ?, parent_id = ?, sort_order = ?,
          date_modified = ?, metadata = ?, updated_by = ?, updated_at = ?
      WHERE id = ? AND team_id = ?
    `
      )
      .bind(
        data.url,
        data.title,
        data.parentId,
        data.sortOrder,
        Date.now(),
        JSON.stringify(data.metadata || {}),
        userId,
        new Date().toISOString(),
        bookmarkId,
        teamId
      )
      .run()

    return c.json({
      success: true,
      message: "更新团队书签成功",
      affected: result.meta.changes
    })
  }
)

app.delete("/api/teams/:teamId/bookmarks/:id", async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const teamId = c.req.param("teamId") as string
  const bookmarkId = c.req.param("id") as string

  // 检查用户是否有权限删除团队书签
  const member = (await db
    .prepare(
      "SELECT role, t.settings FROM team_members tm JOIN teams t ON t.id = tm.team_id WHERE tm.team_id = ? AND tm.user_id = ?"
    )
    .bind(teamId, userId)
    .first()) as { role: string; settings: string } | null

  if (!member) {
    throw new HTTPException(403, { message: "无权删除团队书签" })
  }

  const settings = JSON.parse(member.settings)
  if (!settings.allowMemberEdit && member.role === "member") {
    throw new HTTPException(403, { message: "普通成员无权删除团队书签" })
  }

  const result = await db
    .prepare(
      `
    DELETE FROM bookmarks 
    WHERE id = ? AND team_id = ?
  `
    )
    .bind(bookmarkId, teamId)
    .run()

  return c.json({
    success: true,
    message: "删除团队书签成功",
    affected: result.meta.changes
  })
})

export default app
