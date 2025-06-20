import { Hono } from "hono"
import { bodyLimit } from "hono/body-limit"
import { cors } from "hono/cors"
import { HTTPException } from "hono/http-exception"
import { logger } from "hono/logger"
import { prettyJSON } from "hono/pretty-json"
import { secureHeaders } from "hono/secure-headers"

import { authRoutes } from "./routes/auth"
import bookmarkRoutes from "./routes/bookmarks"
import historyRoutes from "./routes/history"
import { teamRoutes } from "./routes/teams"

export interface Env {
  BOOKMARKS_KV: KVNamespace
  DB: D1Database
  JWT_SECRET: string
  ENVIRONMENT: string
}

const app = new Hono<{ Bindings: Env }>()

// 中间件
app.use("*", logger())
app.use("*", prettyJSON())
app.use("*", secureHeaders())
app.use("*", cors())

// 添加body限制中间件 (1MB)
app.use("*", bodyLimit({ maxSize: 1024 * 1024 }))

// 健康检查
app.get("/", (c) => {
  return c.json({
    success: true,
    message: "Craz API 服务运行中",
    version: "1.0.0",
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString()
  })
})

// API 路由
app.route("/api/auth", authRoutes)
app.route("/api/bookmarks", bookmarkRoutes)
app.route("/api/teams", teamRoutes)
app.route("/api/history", historyRoutes)

// 全局错误处理
app.onError((err, c) => {
  console.error("API Error:", err)

  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        message: err.message,
        status: err.status
      },
      err.status
    )
  }

  return c.json(
    {
      success: false,
      message: "服务器内部错误",
      status: 500
    },
    500
  )
})

// 404 处理
app.notFound((c) => {
  return c.json(
    {
      success: false,
      message: "接口不存在",
      status: 404
    },
    404
  )
})

export default app
