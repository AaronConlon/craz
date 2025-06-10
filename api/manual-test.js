#!/usr/bin/env node

/**
 * 手动 API 测试脚本
 * 用于快速验证本地开发服务器是否正常工作
 */

const API_BASE = process.env.TEST_API_URL || "http://localhost:8787"

async function testAPI() {
  console.log("🧪 开始 API 手动测试...")
  console.log(`📡 目标服务器: ${API_BASE}`)
  console.log("")

  let testCount = 0
  let passCount = 0

  // 测试工具函数
  const test = async (name, testFn) => {
    testCount++
    try {
      console.log(`⏳ ${testCount}. ${name}`)
      await testFn()
      passCount++
      console.log(`✅ ${testCount}. ${name} - 通过`)
    } catch (error) {
      console.log(`❌ ${testCount}. ${name} - 失败`)
      console.log(`   错误: ${error.message}`)
    }
    console.log("")
  }

  const request = async (method, path, body = null, headers = {}) => {
    const url = `${API_BASE}${path}`
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers
      }
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)
    const data = await response.json()

    return { response, data }
  }

  // 开始测试
  await test("根路径健康检查", async () => {
    const { response, data } = await request("GET", "/")

    if (response.status !== 200) {
      throw new Error(`期望状态码 200，实际 ${response.status}`)
    }

    if (!data.success) {
      throw new Error(`期望 success: true，实际 ${data.success}`)
    }

    if (!data.message.includes("Craz API 服务运行中")) {
      throw new Error(`期望消息包含 "Craz API 服务运行中"`)
    }
  })

  await test("认证服务健康检查", async () => {
    const { response, data } = await request("GET", "/auth/health")

    if (response.status !== 200) {
      throw new Error(`期望状态码 200，实际 ${response.status}`)
    }

    if (!data.success) {
      throw new Error(`期望 success: true，实际 ${data.success}`)
    }
  })

  await test("团队服务健康检查", async () => {
    const { response, data } = await request("GET", "/teams/health")

    if (response.status !== 200) {
      throw new Error(`期望状态码 200，实际 ${response.status}`)
    }

    if (!data.success) {
      throw new Error(`期望 success: true，实际 ${data.success}`)
    }
  })

  await test("404 错误处理", async () => {
    const { response, data } = await request("GET", "/nonexistent")

    if (response.status !== 404) {
      throw new Error(`期望状态码 404，实际 ${response.status}`)
    }

    if (data.success !== false) {
      throw new Error(`期望 success: false，实际 ${data.success}`)
    }
  })

  // 用户注册测试
  const timestamp = Date.now().toString().slice(-8) // 只取后8位
  const testUser = {
    username: `test_${timestamp}`, // 保持在20字符以内
    email: `test_${timestamp}@example.com`,
    password: "password123",
    receiveOfficialMessages: true
  }

  let userToken = null

  await test("用户注册", async () => {
    const { response, data } = await request("POST", "/auth/register", testUser)

    if (response.status !== 201) {
      throw new Error(`期望状态码 201，实际 ${response.status}`)
    }

    if (!data.success) {
      throw new Error(`期望 success: true，实际 ${data.success}`)
    }

    if (!data.data.user || !data.data.token) {
      throw new Error("缺少用户信息或令牌")
    }

    // 保存令牌供后续测试使用
    userToken = data.data.token
  })

  await test("用户登录", async () => {
    const { response, data } = await request("POST", "/auth/login", {
      email: testUser.email,
      password: testUser.password
    })

    if (response.status !== 200) {
      throw new Error(`期望状态码 200，实际 ${response.status}`)
    }

    if (!data.success) {
      throw new Error(`期望 success: true，实际 ${data.success}`)
    }

    if (!data.data.user || !data.data.token) {
      throw new Error("缺少用户信息或令牌")
    }
  })

  if (userToken) {
    await test("获取用户信息 (需要认证)", async () => {
      const { response, data } = await request("GET", "/auth/me", null, {
        "Authorization": `Bearer ${userToken}`
      })

      if (response.status !== 200) {
        throw new Error(`期望状态码 200，实际 ${response.status}`)
      }

      if (!data.success) {
        throw new Error(`期望 success: true，实际 ${data.success}`)
      }

      if (!data.data) {
        throw new Error("缺少用户信息")
      }
    })
  }

  // 测试总结
  console.log("=".repeat(50))
  console.log(`🎯 测试完成: ${passCount}/${testCount} 通过`)

  if (passCount === testCount) {
    console.log("🎉 所有测试通过！API 服务正常运行")
    process.exit(0)
  } else {
    console.log(`😞 ${testCount - passCount} 个测试失败`)
    process.exit(1)
  }
}

// 运行测试
testAPI().catch(error => {
  console.error("💥 测试运行失败:", error.message)
  process.exit(1)
})