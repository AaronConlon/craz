/**
 * 测试环境初始化设置
 */

import { afterAll, beforeAll } from "vitest"

import { waitForTestEnvironment } from "./utils/test-env"

// 确保全局fetch可用
if (!global.fetch) {
  console.log("🔧 添加fetch polyfill...")
  const { fetch, Headers, Request, Response } = await import("undici")
  global.fetch = fetch as any
  global.Headers = Headers as any
  global.Request = Request as any
  global.Response = Response as any
}

// 全局测试设置
beforeAll(async () => {
  console.log("🧪 开始集成测试...")
  console.log("⏳ 检查测试环境...")
  console.log("🌐 测试API端点: http://localhost:8787")

  // 测试fetch是否可用
  console.log("🔍 测试fetch可用性...")
  try {
    const testResponse = await fetch("http://localhost:8787/auth/health")
    console.log(`✅ fetch测试成功: ${testResponse.status}`)
  } catch (error) {
    console.error("❌ fetch测试失败:", error)
    throw error
  }

  // 等待API服务启动
  try {
    await waitForTestEnvironment()
  } catch (error) {
    console.error("❌ 测试环境未就绪:", error)
    throw error
  }

  console.log("✅ 测试环境检查完成")
}, 60000) // 60秒超时

afterAll(async () => {
  console.log("🏁 集成测试完成")
})
