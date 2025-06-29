import { RedisCache } from "../../src/utils/redis-cache"

/**
 * 测试环境配置
 */

export const TEST_CONFIG = {
  // API服务器配置
  API_BASE_URL: process.env.TEST_API_URL || "http://localhost:8787",

  // 请求超时配置
  REQUEST_TIMEOUT: 10000,

  // 重试配置
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,

  // 测试数据配置
  TEST_USER_PREFIX: "test_",
  TEST_EMAIL_DOMAIN: "example.com",

  // JWT配置
  JWT_SECRET: process.env.JWT_SECRET || "test-secret-key",

  // 数据库配置
  DB_NAME: process.env.TEST_DB_NAME || "test.db",

  // 环境标识
  NODE_ENV: process.env.NODE_ENV || "test"
} as const

/**
 * 检查测试环境是否就绪
 */
export async function checkTestEnvironment(): Promise<boolean> {
  try {
    const response = await fetch(`${TEST_CONFIG.API_BASE_URL}/`, {
      method: "GET",
      signal: AbortSignal.timeout(TEST_CONFIG.REQUEST_TIMEOUT)
    })

    return response.ok
  } catch (error) {
    console.error("测试环境检查失败:", error)
    return false
  }
}

/**
 * 等待测试环境就绪
 */
export async function waitForTestEnvironment(maxAttempts = 30): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const isReady = await checkTestEnvironment()

    if (isReady) {
      console.log("✅ 测试环境就绪")
      return
    }

    console.log(`⏳ 等待测试环境就绪... (${i + 1}/${maxAttempts})`)
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  throw new Error("测试环境启动超时")
}

/**
 * 生成测试用的唯一标识
 */
export function generateTestId(): string {
  return Math.random().toString(36).substring(2, 10)
}

/**
 * 生成测试用户数据
 */
export function generateTestUser() {
  const id = generateTestId()
  return {
    username: `${TEST_CONFIG.TEST_USER_PREFIX}${id}`,
    email: `test_${id}@${TEST_CONFIG.TEST_EMAIL_DOMAIN}`,
    password: "password123",
    receiveOfficialMessages: true
  }
}

/**
 * 等待服务可用
 */
async function waitForService(
  check: () => Promise<boolean>,
  timeout: number = 5000,
  interval: number = 500
): Promise<boolean> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    try {
      if (await check()) {
        return true
      }
    } catch (error) {
      console.warn("服务检查失败:", error)
    }
    await new Promise((resolve) => setTimeout(resolve, interval))
  }

  return false
}

/**
 * 检查 Redis 连接
 */
async function checkRedisConnection(): Promise<boolean> {
  const redis = new RedisCache()
  try {
    return await redis.ping()
  } catch (error) {
    console.error("Redis 连接失败:", error)
    return false
  }
}

/**
 * 设置测试环境
 */
export async function setupTestEnv(): Promise<void> {
  console.log("⏳ 正在设置测试环境...")

  // 检查 Redis 连接
  console.log("🔄 检查 Redis 连接...")
  const redisAvailable = await waitForService(checkRedisConnection)
  if (!redisAvailable) {
    throw new Error("Redis 服务不可用")
  }
  console.log("✅ Redis 连接成功")
}

/**
 * 清理测试环境
 */
export async function cleanupTestEnv(): Promise<void> {
  console.log("🧹 正在清理测试环境...")
  // 这里可以添加清理逻辑
  console.log("✅ 环境清理完成")
}
