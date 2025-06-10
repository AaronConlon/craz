import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"
import type { Env } from "../index"

export const teamRoutes = new Hono<{ Bindings: Env }>()

teamRoutes.get("/health", (c) => {
  return c.json({
    success: true,
    message: "团队服务运行中",
    timestamp: new Date().toISOString()
  })
})