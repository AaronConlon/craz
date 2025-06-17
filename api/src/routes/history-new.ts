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

export default app
