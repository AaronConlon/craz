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

// 使用统一的 JWT 中间件
const jwtAuth = createJwtMiddleware()
app.use("*", jwtAuth)

// 辅助函数：获取用户ID
const getUserId = (c: any): string => {
  const payload = c.get("jwtPayload") as JwtPayload
  return payload.userId
}

// 辅助函数：生成ID
const generateId = () => crypto.randomUUID()

// 辅助函数：获取当前时间戳
const getCurrentTimestamp = () => new Date().toISOString()

// 辅助函数：分批处理 (D1 事务限制为100条语句)
const processBatch = async <T>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<any>
): Promise<void> => {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    await processor(batch)
  }
}

// 健康检查
app.get("/health", (c) => {
  return c.json({
    success: true,
    message: "历史记录服务运行中",
    timestamp: getCurrentTimestamp()
  })
})

// 获取历史记录列表
app.get("/", zValidator("query", HistoryQuerySchema), async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const query = c.req.valid("query")

  try {
    // 计算偏移量
    const offset = (query.page - 1) * query.pageSize

    // 构建查询条件
    let whereClause = "WHERE user_id = ?"
    const params: any[] = [userId]

    if (query.search) {
      whereClause += " AND (title LIKE ? OR url LIKE ?)"
      params.push(`%${query.search}%`, `%${query.search}%`)
    }

    if (query.startTime) {
      whereClause += " AND visit_time >= ?"
      params.push(query.startTime.toString())
    }

    if (query.endTime) {
      whereClause += " AND visit_time <= ?"
      params.push(query.endTime.toString())
    }

    if (query.domain) {
      whereClause += " AND domain = ?"
      params.push(query.domain)
    }

    // 构建排序
    const sortColumn =
      query.sortBy === "visitTime"
        ? "visit_time"
        : query.sortBy === "lastVisitTime"
          ? "last_visit_time"
          : query.sortBy === "visitCount"
            ? "visit_count"
            : "title"
    const orderClause = `ORDER BY ${sortColumn} ${query.sortOrder.toUpperCase()}`

    // 获取总数
    const countResult = (await db
      .prepare(`SELECT COUNT(*) as total FROM history ${whereClause}`)
      .bind(...params)
      .first()) as { total: number }

    // 获取历史记录数据
    const historyResult = await db
      .prepare(
        `SELECT id, url, title, visit_time, visit_count, typed_count, 
                last_visit_time, created_at, updated_at
         FROM history 
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
      visitTime: item.visit_time,
      visitCount: item.visit_count,
      typedCount: item.typed_count,
      lastVisitTime: item.last_visit_time,
      userId,
      createdAt: item.created_at,
      updatedAt: item.updated_at
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
        `INSERT INTO history (
          id, user_id, url, title, visit_time, visit_count, typed_count, 
          last_visit_time, domain, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        userId,
        data.url,
        data.title,
        visitTime.toString(),
        (data.visitCount || 1).toString(),
        (data.typedCount || 0).toString(),
        visitTime.toString(),
        domain,
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

// 获取单个历史记录
app.get("/:id", async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const id = c.req.param("id")

  try {
    const historyItem = (await db
      .prepare(
        `SELECT id, url, title, visit_time, visit_count, typed_count, 
                last_visit_time, created_at, updated_at
         FROM history 
         WHERE id = ? AND user_id = ?`
      )
      .bind(id, userId)
      .first()) as any

    if (!historyItem) {
      throw new HTTPException(404, { message: "历史记录不存在" })
    }

    const result = {
      id: historyItem.id,
      url: historyItem.url,
      title: historyItem.title,
      visitTime: historyItem.visit_time,
      visitCount: historyItem.visit_count,
      typedCount: historyItem.typed_count,
      lastVisitTime: historyItem.last_visit_time,
      userId,
      createdAt: historyItem.created_at,
      updatedAt: historyItem.updated_at
    }

    return c.json({
      success: true,
      message: "获取历史记录成功",
      data: result,
      timestamp: getCurrentTimestamp()
    })
  } catch (error) {
    if (error instanceof HTTPException) throw error
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
    // 检查记录是否存在
    const existing = await db
      .prepare("SELECT id FROM history WHERE id = ? AND user_id = ?")
      .bind(id, userId)
      .first()

    if (!existing) {
      throw new HTTPException(404, { message: "历史记录不存在" })
    }

    // 构建更新字段
    const updateFields = []
    const updateParams: any[] = []

    if (data.title !== undefined) {
      updateFields.push("title = ?")
      updateParams.push(data.title)
    }

    if (data.visitCount !== undefined) {
      updateFields.push("visit_count = ?")
      updateParams.push(data.visitCount.toString())
    }

    if (data.typedCount !== undefined) {
      updateFields.push("typed_count = ?")
      updateParams.push(data.typedCount.toString())
    }

    if (data.lastVisitTime !== undefined) {
      updateFields.push("last_visit_time = ?")
      updateParams.push(data.lastVisitTime.toString())
    }

    if (updateFields.length === 0) {
      throw new HTTPException(400, { message: "没有提供需要更新的字段" })
    }

    // 添加更新时间
    updateFields.push("updated_at = ?")
    updateParams.push(getCurrentTimestamp())

    // 添加WHERE条件参数
    updateParams.push(id, userId)

    await db
      .prepare(
        `UPDATE history SET ${updateFields.join(", ")} 
         WHERE id = ? AND user_id = ?`
      )
      .bind(...updateParams)
      .run()

    // 获取更新后的记录
    const updatedItem = (await db
      .prepare(
        `SELECT id, url, title, visit_time, visit_count, typed_count, 
                last_visit_time, created_at, updated_at
         FROM history 
         WHERE id = ? AND user_id = ?`
      )
      .bind(id, userId)
      .first()) as any

    const result = {
      id: updatedItem.id,
      url: updatedItem.url,
      title: updatedItem.title,
      visitTime: updatedItem.visit_time,
      visitCount: updatedItem.visit_count,
      typedCount: updatedItem.typed_count,
      lastVisitTime: updatedItem.last_visit_time,
      userId,
      createdAt: updatedItem.created_at,
      updatedAt: updatedItem.updated_at
    }

    return c.json({
      success: true,
      message: "更新历史记录成功",
      data: result,
      timestamp: getCurrentTimestamp()
    })
  } catch (error) {
    if (error instanceof HTTPException) throw error
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
      .prepare("DELETE FROM history WHERE id = ? AND user_id = ?")
      .bind(id, userId)
      .run()

    if (!result.success) {
      throw new HTTPException(404, { message: "历史记录不存在" })
    }

    return c.json({
      success: true,
      message: "删除历史记录成功",
      timestamp: getCurrentTimestamp()
    })
  } catch (error) {
    if (error instanceof HTTPException) throw error
    console.error("删除历史记录失败:", error)
    throw new HTTPException(500, { message: "删除历史记录失败" })
  }
})

// 搜索历史记录
app.get("/search", zValidator("query", SearchHistorySchema), async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const query = c.req.valid("query")

  try {
    // 构建查询条件
    let whereClause = "WHERE user_id = ? AND (title LIKE ? OR url LIKE ?)"
    const params: any[] = [userId, `%${query.q}%`, `%${query.q}%`]

    if (query.startTime) {
      whereClause += " AND visit_time >= ?"
      params.push(query.startTime.toString())
    }

    if (query.endTime) {
      whereClause += " AND visit_time <= ?"
      params.push(query.endTime.toString())
    }

    if (query.domain) {
      whereClause += " AND domain = ?"
      params.push(query.domain)
    }

    // 进行搜索
    const searchResult = await db
      .prepare(
        `SELECT id, url, title, visit_time, visit_count, typed_count, 
                last_visit_time, created_at, updated_at
         FROM history 
         ${whereClause}
         ORDER BY visit_time DESC
         LIMIT ?`
      )
      .bind(...params, query.limit.toString())
      .all()

    const results = (searchResult.results || []).map((item: any) => ({
      id: item.id,
      url: item.url,
      title: item.title,
      visitTime: item.visit_time,
      visitCount: item.visit_count,
      typedCount: item.typed_count,
      lastVisitTime: item.last_visit_time,
      userId,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }))

    return c.json({
      success: true,
      message: "搜索历史记录成功",
      data: results,
      query: query.q,
      total: results.length,
      timestamp: getCurrentTimestamp()
    })
  } catch (error) {
    console.error("搜索历史记录失败:", error)
    throw new HTTPException(500, { message: "搜索历史记录失败" })
  }
})

// 批量创建历史记录
app.post("/batch", zValidator("json", BatchCreateHistorySchema), async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const { items } = c.req.valid("json")

  try {
    const createdItems: any[] = []

    // 分批处理，每批最多90条 (留一些余量给其他语句)
    await processBatch(items, 90, async (batch) => {
      const statements = batch.map((item) => {
        const id = generateId()
        const now = getCurrentTimestamp()
        const visitTime = item.visitTime || Date.now()
        const domain = new URL(item.url).hostname

        createdItems.push({
          id,
          url: item.url,
          title: item.title,
          visitTime,
          visitCount: item.visitCount || 1,
          typedCount: item.typedCount || 0,
          lastVisitTime: visitTime,
          userId,
          createdAt: now,
          updatedAt: now
        })

        return db
          .prepare(
            `INSERT INTO history (
              id, user_id, url, title, visit_time, visit_count, typed_count, 
              last_visit_time, domain, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            id,
            userId,
            item.url,
            item.title,
            visitTime.toString(),
            (item.visitCount || 1).toString(),
            (item.typedCount || 0).toString(),
            visitTime.toString(),
            domain,
            now,
            now
          )
      })

      await db.batch(statements)
    })

    return c.json({
      success: true,
      message: `批量创建 ${createdItems.length} 条历史记录成功`,
      data: createdItems,
      count: createdItems.length,
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
    const updatedItems: any[] = []

    // 分批处理
    await processBatch(items, 90, async (batch) => {
      const statements = batch.map((item) => {
        const { id, data } = item
        const now = getCurrentTimestamp()

        // 构建更新字段
        const updateFields = ["updated_at = ?"]
        const updateParams: any[] = [now]

        if (data.title !== undefined) {
          updateFields.push("title = ?")
          updateParams.push(data.title)
        }

        if (data.visitCount !== undefined) {
          updateFields.push("visit_count = ?")
          updateParams.push(data.visitCount.toString())
        }

        if (data.typedCount !== undefined) {
          updateFields.push("typed_count = ?")
          updateParams.push(data.typedCount.toString())
        }

        if (data.lastVisitTime !== undefined) {
          updateFields.push("last_visit_time = ?")
          updateParams.push(data.lastVisitTime.toString())
        }

        // 添加WHERE条件参数
        updateParams.push(id, userId)

        updatedItems.push({ id, ...data })

        return db
          .prepare(
            `UPDATE history SET ${updateFields.join(", ")} 
             WHERE id = ? AND user_id = ?`
          )
          .bind(...updateParams)
      })

      await db.batch(statements)
    })

    return c.json({
      success: true,
      message: `批量更新 ${updatedItems.length} 条历史记录成功`,
      data: updatedItems,
      count: updatedItems.length,
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
      let totalDeleted = 0

      // 分批处理
      await processBatch(ids, 90, async (batch) => {
        const statements = batch.map((id) =>
          db
            .prepare("DELETE FROM history WHERE id = ? AND user_id = ?")
            .bind(id, userId)
        )

        const results = await db.batch(statements)
        // 统计成功的删除操作数量
        totalDeleted += results.filter((result) => result.success).length
      })

      return c.json({
        success: true,
        message: `批量删除 ${totalDeleted} 条历史记录成功`,
        deletedCount: totalDeleted,
        timestamp: getCurrentTimestamp()
      })
    } catch (error) {
      console.error("批量删除历史记录失败:", error)
      throw new HTTPException(500, { message: "批量删除历史记录失败" })
    }
  }
)

// 按时间范围删除历史记录
app.delete("/range", zValidator("json", DeleteByTimeRangeSchema), async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const { startTime, endTime, domain } = c.req.valid("json")

  try {
    let whereClause =
      "WHERE user_id = ? AND visit_time >= ? AND visit_time <= ?"
    const params: any[] = [userId, startTime.toString(), endTime.toString()]

    if (domain) {
      whereClause += " AND domain = ?"
      params.push(domain)
    }

    const result = await db
      .prepare(`DELETE FROM history ${whereClause}`)
      .bind(...params)
      .run()

    return c.json({
      success: true,
      message: `删除时间范围内的历史记录成功`,
      deletedCount: result.success ? 1 : 0, // D1 不提供具体删除数量
      timeRange: {
        startTime,
        endTime,
        domain: domain || null
      },
      timestamp: getCurrentTimestamp()
    })
  } catch (error) {
    console.error("按时间范围删除历史记录失败:", error)
    throw new HTTPException(500, { message: "按时间范围删除历史记录失败" })
  }
})

// 获取历史记录统计
app.get("/stats", zValidator("query", HistoryStatsQuerySchema), async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const query = c.req.valid("query")

  try {
    // 构建时间范围条件
    let timeCondition = "WHERE user_id = ?"
    const params: any[] = [userId]

    if (query.startTime) {
      timeCondition += " AND visit_time >= ?"
      params.push(query.startTime.toString())
    }

    if (query.endTime) {
      timeCondition += " AND visit_time <= ?"
      params.push(query.endTime.toString())
    }

    if (query.domain) {
      timeCondition += " AND domain = ?"
      params.push(query.domain)
    }

    // 获取基本统计
    const basicStats = (await db
      .prepare(
        `
        SELECT 
          COUNT(*) as totalVisits,
          COUNT(DISTINCT url) as uniqueUrls
        FROM history ${timeCondition}
      `
      )
      .bind(...params)
      .first()) as any

    // 获取热门域名 (前10个)
    const topDomains = await db
      .prepare(
        `
        SELECT 
          domain,
          COUNT(*) as visitCount,
          MAX(last_visit_time) as lastVisit
        FROM history ${timeCondition}
        GROUP BY domain
        ORDER BY visitCount DESC
        LIMIT 10
      `
      )
      .bind(...params)
      .all()

    const result: any = {
      totalVisits: basicStats?.totalVisits || 0,
      uniqueUrls: basicStats?.uniqueUrls || 0,
      topDomains: (topDomains.results || []).map((item: any) => ({
        domain: item.domain,
        visitCount: item.visitCount,
        lastVisit: item.lastVisit
      }))
    }

    // 根据groupBy参数获取时间分组统计
    if (query.groupBy === "day") {
      const dailyStats = await db
        .prepare(
          `
          SELECT 
            DATE(visit_time / 1000, 'unixepoch') as date,
            COUNT(*) as visitCount,
            COUNT(DISTINCT url) as uniqueUrls
          FROM history ${timeCondition}
          GROUP BY DATE(visit_time / 1000, 'unixepoch')
          ORDER BY date DESC
          LIMIT 30
        `
        )
        .bind(...params)
        .all()

      result.dailyStats = (dailyStats.results || []).map((item: any) => ({
        date: item.date,
        visitCount: item.visitCount,
        uniqueUrls: item.uniqueUrls
      }))
    } else if (query.groupBy === "week") {
      const weeklyStats = await db
        .prepare(
          `
          SELECT 
            STRFTIME('%Y-W%W', visit_time / 1000, 'unixepoch') as week,
            COUNT(*) as visitCount,
            COUNT(DISTINCT url) as uniqueUrls
          FROM history ${timeCondition}
          GROUP BY STRFTIME('%Y-W%W', visit_time / 1000, 'unixepoch')
          ORDER BY week DESC
          LIMIT 12
        `
        )
        .bind(...params)
        .all()

      result.weeklyStats = (weeklyStats.results || []).map((item: any) => ({
        week: item.week,
        visitCount: item.visitCount,
        uniqueUrls: item.uniqueUrls
      }))
    } else if (query.groupBy === "month") {
      const monthlyStats = await db
        .prepare(
          `
          SELECT 
            STRFTIME('%Y-%m', visit_time / 1000, 'unixepoch') as month,
            COUNT(*) as visitCount,
            COUNT(DISTINCT url) as uniqueUrls
          FROM history ${timeCondition}
          GROUP BY STRFTIME('%Y-%m', visit_time / 1000, 'unixepoch')
          ORDER BY month DESC
          LIMIT 12
        `
        )
        .bind(...params)
        .all()

      result.monthlyStats = (monthlyStats.results || []).map((item: any) => ({
        month: item.month,
        visitCount: item.visitCount,
        uniqueUrls: item.uniqueUrls
      }))
    }

    return c.json({
      success: true,
      message: "获取历史记录统计成功",
      data: result,
      timestamp: getCurrentTimestamp()
    })
  } catch (error) {
    console.error("获取历史记录统计失败:", error)
    throw new HTTPException(500, { message: "获取历史记录统计失败" })
  }
})

// 获取热门网站
app.get("/top-sites", zValidator("query", TopSitesQuerySchema), async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const query = c.req.valid("query")

  try {
    // 构建查询条件
    let whereClause = "WHERE user_id = ?"
    const params: any[] = [userId]

    if (query.startTime) {
      whereClause += " AND visit_time >= ?"
      params.push(query.startTime.toString())
    }

    if (query.endTime) {
      whereClause += " AND visit_time <= ?"
      params.push(query.endTime.toString())
    }

    // 根据排序方式构建ORDER BY
    const orderBy =
      query.sortBy === "visitCount"
        ? "visitCount DESC, lastVisitTime DESC"
        : "lastVisitTime DESC, visitCount DESC"

    const topSites = await db
      .prepare(
        `
        SELECT 
          url,
          title,
          domain,
          SUM(visit_count) as visitCount,
          MAX(last_visit_time) as lastVisitTime
        FROM history ${whereClause}
        GROUP BY url
        ORDER BY ${orderBy}
        LIMIT ?
      `
      )
      .bind(...params, query.limit.toString())
      .all()

    const results = (topSites.results || []).map((item: any) => ({
      url: item.url,
      title: item.title,
      domain: item.domain,
      visitCount: item.visitCount,
      lastVisitTime: item.lastVisitTime
    }))

    return c.json({
      success: true,
      message: "获取热门网站成功",
      data: results,
      total: results.length,
      query: {
        startTime: query.startTime,
        endTime: query.endTime,
        limit: query.limit,
        sortBy: query.sortBy
      },
      timestamp: getCurrentTimestamp()
    })
  } catch (error) {
    console.error("获取热门网站失败:", error)
    throw new HTTPException(500, { message: "获取热门网站失败" })
  }
})

export default app
