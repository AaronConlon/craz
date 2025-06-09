import { Hono } from "hono"
import { cors } from "hono/cors"
import { HTTPException } from "hono/http-exception"
import { logger } from "hono/logger"
import { prettyJSON } from "hono/pretty-json"

import { bookmarkRoutes } from "./routes/bookmarks"

export interface Env {
  BOOKMARKS_KV: KVNamespace
  ENVIRONMENT: string
}

const app = new Hono<{ Bindings: Env }>()

// 中间件
app.use("*", logger())
app.use("*", prettyJSON())
app.use(
  "*",
  cors({
    origin: ["chrome-extension://*", "http://localhost:*"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"]
  })
)

// 健康检查
app.get("/", (c) => {
  return c.json({
    message: "Craz API 服务运行中",
    version: "1.0.0",
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString()
  })
})

// API 路由
app.route("/bookmarks", bookmarkRoutes)

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
