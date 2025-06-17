import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"

import type { Env } from "../index"
import { createJwtMiddleware } from "../middleware/jwt"
import {
  BatchCreateHistorySchema,
  BatchDeleteHistorySchema,
  BatchUpdateHistorySchema,
  CreateHistoryItemSchema,
  DeleteByTimeRangeSchema,
  HistoryQuerySchema,
  HistoryStatsQuerySchema,
  SearchHistorySchema,
  TopSitesQuerySchema,
  UpdateHistoryItemSchema
} from "../schemas/history"
import type { JwtPayload } from "../schemas/user"

const app = new Hono<{ Bindings: Env }>()

// 辅助函数：获取用户ID
const getUserId = (c: any): string => {
  const payload = c.get("jwtPayload") as JwtPayload
  return payload.userId
}

// 辅助函数：生成ID
const generateId = () => crypto.randomUUID()

// 辅助函数：获取当前时间戳
const getCurrentTimestamp = () => new Date().toISOString()

// 健康检查 - 不需要认证
app.get("/health", (c) => {
  return c.json({
    success: true,
    message: "历史记录服务运行中",
    timestamp: getCurrentTimestamp()
  })
})

// 使用统一的 JWT 中间件 - 对除健康检查外的所有路由
const jwtAuth = createJwtMiddleware()
app.use("*", jwtAuth)

// 获取历史记录列表
app.get("/", zValidator("query", HistoryQuerySchema), async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const query = c.req.valid("query")

  try {
    // 计算偏移量
    const offset = (query.page - 1) * query.pageSize

    // 构建查询条件
    let whereClause = "WHERE userId = ?"
    const params: any[] = [userId]

    if (query.search) {
      whereClause += " AND (title LIKE ? OR url LIKE ?)"
      params.push(`%${query.search}%`, `%${query.search}%`)
    }

    if (query.startTime) {
      whereClause += " AND lastVisitTime >= ?"
      params.push(query.startTime.toString())
    }

    if (query.endTime) {
      whereClause += " AND lastVisitTime <= ?"
      params.push(query.endTime.toString())
    }

    // 构建排序
    const sortColumn =
      query.sortBy === "visitTime"
        ? "lastVisitTime"
        : query.sortBy === "lastVisitTime"
          ? "lastVisitTime"
          : query.sortBy === "visitCount"
            ? "visitCount"
            : "title"
    const orderClause = `ORDER BY ${sortColumn} ${query.sortOrder.toUpperCase()}`

    // 获取总数
    const countResult = (await db
      .prepare(`SELECT COUNT(*) as total FROM history_items ${whereClause}`)
      .bind(...params)
      .first()) as { total: number }

    // 获取历史记录数据
    const historyResult = await db
      .prepare(
        `SELECT id, url, title, lastVisitTime, visitCount, typedCount, 
                createdAt, updatedAt
         FROM history_items 
         ${whereClause}
         ${orderClause}
         LIMIT ? OFFSET ?`
      )
      .bind(...params, query.pageSize.toString(), offset.toString())
      .all()

    // 转换字段名为camelCase格式
    const history = (historyResult.results || []).map((item: any) => ({
      id: item.id,
      url: item.url,
      title: item.title,
      visitTime: item.lastVisitTime,
      visitCount: item.visitCount,
      typedCount: item.typedCount,
      lastVisitTime: item.lastVisitTime,
      userId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }))

    const total = countResult?.total || 0
    const hasNextPage = offset + query.pageSize < total

    return c.json({
      success: true,
      message: "获取历史记录列表成功",
      data: {
        items: history,
        pagination: {
          total,
          page: query.page,
          pageSize: query.pageSize,
          hasNextPage
        }
      },
      timestamp: getCurrentTimestamp()
    })
  } catch (error) {
    console.error("获取历史记录列表失败:", error)
    throw new HTTPException(500, { message: "获取历史记录列表失败" })
  }
})

// 创建历史记录
app.post("/", zValidator("json", CreateHistoryItemSchema), async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const data = c.req.valid("json")

  try {
    const id = generateId()
    const now = getCurrentTimestamp()
    const visitTime = data.visitTime || Date.now()

    // 提取域名
    const domain = new URL(data.url).hostname

    await db
      .prepare(
        `INSERT INTO history_items (
          id, userId, url, title, lastVisitTime, visitCount, typedCount, 
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        userId,
        data.url,
        data.title,
        visitTime.toString(),
        (data.visitCount || 1).toString(),
        (data.typedCount || 0).toString(),
        now,
        now
      )
      .run()

    const createdItem = {
      id,
      url: data.url,
      title: data.title,
      visitTime,
      visitCount: data.visitCount || 1,
      typedCount: data.typedCount || 0,
      lastVisitTime: visitTime,
      userId,
      createdAt: now,
      updatedAt: now
    }

    return c.json({
      success: true,
      message: "创建历史记录成功",
      data: createdItem,
      timestamp: getCurrentTimestamp()
    })
  } catch (error) {
    console.error("创建历史记录失败:", error)

    if (error instanceof Error && error.message.includes("UNIQUE constraint")) {
      throw new HTTPException(409, { message: "该URL的历史记录已存在" })
    }

    throw new HTTPException(500, { message: "创建历史记录失败" })
  }
})

// 搜索历史记录 - 必须在 /:id 之前定义
app.get("/search", zValidator("query", SearchHistorySchema), async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const query = c.req.valid("query")

  try {
    // 使用 FTS5 全文搜索
    const searchResult = await db
      .prepare(
        `SELECT h.id, h.url, h.title, h.lastVisitTime, h.visitCount, h.typedCount,
                h.createdAt, h.updatedAt, f.rank
         FROM history_items h
         JOIN history_fts f ON h.id = f.rowid
         WHERE h.userId = ? AND f.history_fts MATCH ?
         ORDER BY f.rank
         LIMIT ?`
      )
      .bind(userId, query.q, query.limit.toString())
      .all()

    const history = (searchResult.results || []).map((item: any) => ({
      id: item.id,
      url: item.url,
      title: item.title,
      visitTime: item.lastVisitTime,
      visitCount: item.visitCount,
      typedCount: item.typedCount,
      lastVisitTime: item.lastVisitTime,
      userId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      relevanceScore: item.rank
    }))

    return c.json({
      success: true,
      message: "搜索历史记录成功",
      data: {
        items: history,
        query: query.q,
        limit: query.limit
      },
      timestamp: getCurrentTimestamp()
    })
  } catch (error) {
    console.error("搜索历史记录失败:", error)
    throw new HTTPException(500, { message: "搜索历史记录失败" })
  }
})

// 获取单个历史记录
app.get("/:id", async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const id = c.req.param("id")

  try {
    const result = await db
      .prepare(
        `SELECT id, url, title, lastVisitTime, visitCount, typedCount, 
                createdAt, updatedAt
         FROM history_items 
         WHERE id = ? AND userId = ?`
      )
      .bind(id, userId)
      .first()

    if (!result) {
      throw new HTTPException(404, { message: "历史记录不存在" })
    }

    const historyItem = {
      id: result.id,
      url: result.url,
      title: result.title,
      visitTime: result.lastVisitTime,
      visitCount: result.visitCount,
      typedCount: result.typedCount,
      lastVisitTime: result.lastVisitTime,
      userId,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    }

    return c.json({
      success: true,
      message: "获取历史记录成功",
      data: historyItem,
      timestamp: getCurrentTimestamp()
    })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    console.error("获取历史记录失败:", error)
    throw new HTTPException(500, { message: "获取历史记录失败" })
  }
})

// 更新历史记录
app.put("/:id", zValidator("json", UpdateHistoryItemSchema), async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const id = c.req.param("id")
  const data = c.req.valid("json")

  try {
    const now = getCurrentTimestamp()

    const result = await db
      .prepare(
        `UPDATE history_items 
         SET title = ?, visitCount = ?, typedCount = ?, updatedAt = ?
         WHERE id = ? AND userId = ?`
      )
      .bind(
        data.title,
        data.visitCount?.toString() || "1",
        data.typedCount?.toString() || "0",
        now,
        id,
        userId
      )
      .run()

    if (result.meta.changes === 0) {
      throw new HTTPException(404, { message: "历史记录不存在" })
    }

    return c.json({
      success: true,
      message: "更新历史记录成功",
      timestamp: getCurrentTimestamp()
    })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    console.error("更新历史记录失败:", error)
    throw new HTTPException(500, { message: "更新历史记录失败" })
  }
})

// 删除历史记录
app.delete("/:id", async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const id = c.req.param("id")

  try {
    const result = await db
      .prepare(`DELETE FROM history_items WHERE id = ? AND userId = ?`)
      .bind(id, userId)
      .run()

    if (result.meta.changes === 0) {
      throw new HTTPException(404, { message: "历史记录不存在" })
    }

    return c.json({
      success: true,
      message: "删除历史记录成功",
      timestamp: getCurrentTimestamp()
    })
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error
    }
    console.error("删除历史记录失败:", error)
    throw new HTTPException(500, { message: "删除历史记录失败" })
  }
})

// 批量创建历史记录
app.post("/batch", zValidator("json", BatchCreateHistorySchema), async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const { items } = c.req.valid("json")

  try {
    const now = getCurrentTimestamp()
    const statements = []

    for (const item of items) {
      const id = generateId()
      const visitTime = item.visitTime || Date.now()

      statements.push(
        db
          .prepare(
            `INSERT INTO history_items (
              id, userId, url, title, lastVisitTime, visitCount, typedCount,
              createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            id,
            userId,
            item.url,
            item.title,
            visitTime.toString(),
            (item.visitCount || 1).toString(),
            (item.typedCount || 0).toString(),
            now,
            now
          )
      )
    }

    const results = await db.batch(statements)
    const successCount = results.filter((r) => r.success).length

    return c.json({
      success: true,
      message: `批量创建历史记录成功，成功创建 ${successCount} 条记录`,
      data: {
        totalRequested: items.length,
        successCount,
        failedCount: items.length - successCount
      },
      timestamp: getCurrentTimestamp()
    })
  } catch (error) {
    console.error("批量创建历史记录失败:", error)
    throw new HTTPException(500, { message: "批量创建历史记录失败" })
  }
})

// 批量更新历史记录
app.put("/batch", zValidator("json", BatchUpdateHistorySchema), async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const { items } = c.req.valid("json")

  try {
    const now = getCurrentTimestamp()
    const statements = []

    for (const item of items) {
      statements.push(
        db
          .prepare(
            `UPDATE history_items 
             SET title = ?, visitCount = ?, typedCount = ?, updatedAt = ?
             WHERE id = ? AND userId = ?`
          )
          .bind(
            item.data.title,
            item.data.visitCount?.toString() || "1",
            item.data.typedCount?.toString() || "0",
            now,
            item.id,
            userId
          )
      )
    }

    const results = await db.batch(statements)
    const successCount = results.filter((r) => r.success).length

    return c.json({
      success: true,
      message: `批量更新历史记录成功，成功更新 ${successCount} 条记录`,
      data: {
        totalRequested: items.length,
        successCount,
        failedCount: items.length - successCount
      },
      timestamp: getCurrentTimestamp()
    })
  } catch (error) {
    console.error("批量更新历史记录失败:", error)
    throw new HTTPException(500, { message: "批量更新历史记录失败" })
  }
})

// 批量删除历史记录
app.delete(
  "/batch",
  zValidator("json", BatchDeleteHistorySchema),
  async (c) => {
    const db = c.env.DB
    const userId = getUserId(c)
    const { ids } = c.req.valid("json")

    try {
      const statements = []

      for (const id of ids) {
        statements.push(
          db
            .prepare(`DELETE FROM history_items WHERE id = ? AND userId = ?`)
            .bind(id, userId)
        )
      }

      const results = await db.batch(statements)
      const successCount = results.filter((r) => r.success).length

      return c.json({
        success: true,
        message: `批量删除历史记录成功，成功删除 ${successCount} 条记录`,
        data: {
          totalRequested: ids.length,
          successCount,
          failedCount: ids.length - successCount
        },
        timestamp: getCurrentTimestamp()
      })
    } catch (error) {
      console.error("批量删除历史记录失败:", error)
      throw new HTTPException(500, { message: "批量删除历史记录失败" })
    }
  }
)

// 按时间范围删除历史记录
app.delete(
  "/time-range",
  zValidator("json", DeleteByTimeRangeSchema),
  async (c) => {
    const db = c.env.DB
    const userId = getUserId(c)
    const { startTime, endTime } = c.req.valid("json")

    try {
      const result = await db
        .prepare(
          `DELETE FROM history_items 
         WHERE userId = ? AND lastVisitTime >= ? AND lastVisitTime <= ?`
        )
        .bind(userId, startTime.toString(), endTime.toString())
        .run()

      return c.json({
        success: true,
        message: `成功删除 ${result.meta.changes} 条历史记录`,
        data: {
          deletedCount: result.meta.changes,
          timeRange: {
            startTime,
            endTime
          }
        },
        timestamp: getCurrentTimestamp()
      })
    } catch (error) {
      console.error("按时间范围删除历史记录失败:", error)
      throw new HTTPException(500, { message: "按时间范围删除历史记录失败" })
    }
  }
)

// 获取统计信息
app.get("/stats", zValidator("query", HistoryStatsQuerySchema), async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const query = c.req.valid("query")

  try {
    // 基本统计
    const basicStats = await db
      .prepare(
        `SELECT 
           COUNT(*) as totalItems,
           SUM(visitCount) as totalVisits,
           AVG(visitCount) as avgVisitsPerItem,
           COUNT(DISTINCT substr(url, 1, instr(url || '/', '/') - 1)) as uniqueDomains
         FROM history_items 
         WHERE userId = ?`
      )
      .bind(userId)
      .first()

    let groupedStats: any[] = []

    if (query.groupBy) {
      let groupByClause = ""
      let selectClause = ""

      switch (query.groupBy) {
        case "day":
          groupByClause = "date(lastVisitTime / 1000, 'unixepoch')"
          selectClause = `${groupByClause} as period`
          break
        case "week":
          groupByClause = "strftime('%Y-%W', lastVisitTime / 1000, 'unixepoch')"
          selectClause = `${groupByClause} as period`
          break
        case "month":
          groupByClause = "strftime('%Y-%m', lastVisitTime / 1000, 'unixepoch')"
          selectClause = `${groupByClause} as period`
          break
        case "domain":
          groupByClause = "substr(url, 1, instr(url || '/', '/') - 1)"
          selectClause = `${groupByClause} as period`
          break
      }

      if (groupByClause) {
        const groupedResult = await db
          .prepare(
            `SELECT 
               ${selectClause},
               COUNT(*) as itemCount,
               SUM(visitCount) as totalVisits,
               AVG(visitCount) as avgVisits
             FROM history_items 
             WHERE userId = ?
             GROUP BY ${groupByClause}
             ORDER BY totalVisits DESC
             LIMIT 50`
          )
          .bind(userId)
          .all()

        groupedStats = groupedResult.results || []
      }
    }

    return c.json({
      success: true,
      message: "获取统计信息成功",
      data: {
        basic: {
          totalItems: basicStats?.totalItems || 0,
          totalVisits: basicStats?.totalVisits || 0,
          avgVisitsPerItem: basicStats?.avgVisitsPerItem || 0,
          uniqueDomains: basicStats?.uniqueDomains || 0
        },
        grouped: groupedStats
      },
      timestamp: getCurrentTimestamp()
    })
  } catch (error) {
    console.error("获取统计信息失败:", error)
    throw new HTTPException(500, { message: "获取统计信息失败" })
  }
})

// 获取热门网站
app.get("/top-sites", zValidator("query", TopSitesQuerySchema), async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const query = c.req.valid("query")

  try {
    let whereClause = "WHERE userId = ?"
    const params: any[] = [userId]

    if (query.startTime) {
      whereClause += " AND lastVisitTime >= ?"
      params.push(query.startTime.toString())
    }

    if (query.endTime) {
      whereClause += " AND lastVisitTime <= ?"
      params.push(query.endTime.toString())
    }

    const orderBy =
      query.sortBy === "lastVisitTime"
        ? "MAX(lastVisitTime) DESC"
        : "SUM(visitCount) DESC"

    const result = await db
      .prepare(
        `SELECT 
           substr(url, 1, instr(url || '/', '/') - 1) as domain,
           COUNT(*) as pageCount,
           SUM(visitCount) as totalVisits,
           MAX(lastVisitTime) as lastVisit,
           GROUP_CONCAT(title, ' | ') as sampleTitles
         FROM history_items 
         ${whereClause}
         GROUP BY domain
         ORDER BY ${orderBy}
         LIMIT ?`
      )
      .bind(...params, query.limit.toString())
      .all()

    const topSites = (result.results || []).map((item: any) => ({
      domain: item.domain,
      pageCount: item.pageCount,
      totalVisits: item.totalVisits,
      lastVisit: item.lastVisit,
      sampleTitles: item.sampleTitles?.split(" | ").slice(0, 3) || []
    }))

    return c.json({
      success: true,
      message: "获取热门网站成功",
      data: {
        sites: topSites,
        query: {
          limit: query.limit,
          sortBy: query.sortBy,
          timeRange:
            query.startTime && query.endTime
              ? {
                  startTime: query.startTime,
                  endTime: query.endTime
                }
              : null
        }
      },
      timestamp: getCurrentTimestamp()
    })
  } catch (error) {
    console.error("获取热门网站失败:", error)
    throw new HTTPException(500, { message: "获取热门网站失败" })
  }
})

export default app
