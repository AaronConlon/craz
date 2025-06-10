/**
 * 手动测试 Auth 路由
 * 详细测试认证相关的所有端点并输出详细过程
 */

interface TestResult {
  success: boolean
  status: number
  data?: any
  error?: string
  timestamp: string
}

class AuthTestRunner {
  private baseUrl = "http://localhost:8787"
  private testResults: TestResult[] = []

  private log(message: string, data?: any) {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] ${message}`)
    if (data) {
      console.log(JSON.stringify(data, null, 2))
    }
  }

  private async makeRequest(
    method: string,
    endpoint: string,
    body?: any,
    headers: Record<string, string> = {}
  ): Promise<TestResult> {
    const url = `${this.baseUrl}${endpoint}`
    const timestamp = new Date().toISOString()

    this.log(`🔄 发起请求: ${method} ${url}`)

    if (body) {
      this.log(`📤 请求体:`, body)
      this.log(`📤 请求体JSON长度: ${JSON.stringify(body).length} 字符`)
    }

    const defaultHeaders = {
      "Content-Type": "application/json",
      "User-Agent": "AuthTestRunner/1.0",
      ...headers
    }

    this.log(`📋 请求头:`, defaultHeaders)

    try {
      const response = await fetch(url, {
        method,
        headers: defaultHeaders,
        body: body ? JSON.stringify(body) : undefined
      })

      this.log(`📥 响应状态: ${response.status} ${response.statusText}`)
      this.log(`📋 响应头:`)
      for (const [key, value] of response.headers.entries()) {
        console.log(`    ${key}: ${value}`)
      }

      const responseText = await response.text()
      this.log(`📄 原始响应 (${responseText.length} 字符):`, responseText)

      let responseData
      try {
        responseData = JSON.parse(responseText)
        this.log(`📊 解析后的响应数据:`, responseData)
      } catch (e) {
        this.log(`⚠️  无法解析为JSON，保持为文本`)
        responseData = responseText
      }

      const result: TestResult = {
        success: response.ok,
        status: response.status,
        data: responseData,
        timestamp
      }

      this.testResults.push(result)
      return result
    } catch (error) {
      this.log(`❌ 请求失败:`, error)
      const result: TestResult = {
        success: false,
        status: 0,
        error: error instanceof Error ? error.message : String(error),
        timestamp
      }
      this.testResults.push(result)
      return result
    }
  }

  // 生成测试用户数据
  private generateTestUser() {
    const timestamp = Date.now().toString()
    const randomStr = Math.random().toString(36).substr(2, 4)
    const shortTimestamp = timestamp.slice(-6)

    const userData = {
      username: `test_${shortTimestamp}_${randomStr}`,
      email: `test_${shortTimestamp}_${randomStr}@example.com`,
      password: "password123",
      receiveOfficialMessages: true
    }

    this.log(`🧪 生成的用户数据详情:`)
    this.log(`  - 时间戳: ${timestamp}`)
    this.log(`  - 短时间戳: ${shortTimestamp}`)
    this.log(`  - 随机字符串: ${randomStr}`)
    this.log(
      `  - 用户名: "${userData.username}" (${userData.username.length} 字符)`
    )
    this.log(`  - 邮箱: "${userData.email}" (${userData.email.length} 字符)`)

    return userData
  }

  // 1. 测试服务器连通性
  async testConnectivity() {
    this.log(`\n🌐 ===== 测试服务器连通性 =====`)

    this.log(`\n📍 测试根路径`)
    await this.makeRequest("GET", "/")

    this.log(`\n📍 测试认证服务健康检查`)
    await this.makeRequest("GET", "/auth/health")
  }

  // 2. 测试用户注册（详细版）
  async testUserRegistration() {
    this.log(`\n👤 ===== 测试用户注册（详细版） =====`)

    // 生成测试用户
    const testUser = this.generateTestUser()

    // 验证生成的数据
    this.log(`\n🔍 验证生成的用户数据:`)
    this.log(
      `✓ 用户名长度: ${testUser.username.length}/20 (${testUser.username.length <= 20 ? "符合" : "超出"}限制)`
    )
    this.log(
      `✓ 用户名格式: ${/^[a-zA-Z0-9_]+$/.test(testUser.username) ? "符合" : "不符合"}规范`
    )
    this.log(
      `✓ 邮箱格式: ${/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testUser.email) ? "符合" : "不符合"}规范`
    )
    this.log(
      `✓ 密码长度: ${testUser.password.length}/100 (${testUser.password.length >= 6 ? "符合" : "不符合"}最小长度)`
    )

    // 发起注册请求
    this.log(`\n📍 发起用户注册请求`)
    this.log(`🔍 请求前最终检查:`)
    this.log(`  - URL: ${this.baseUrl}/auth/register`)
    this.log(`  - Method: POST`)
    this.log(`  - Content-Type: application/json`)

    const registerResult = await this.makeRequest(
      "POST",
      "/auth/register",
      testUser
    )

    if (registerResult.success) {
      this.log(`✅ 注册成功! 状态码: ${registerResult.status}`)
      if (registerResult.data?.data?.user) {
        this.log(`👤 返回的用户信息:`, registerResult.data.data.user)
      }
      if (registerResult.data?.data?.token) {
        this.log(
          `🎫 返回的JWT令牌: ${registerResult.data.data.token.substring(0, 30)}...`
        )
      }
      return { user: testUser, result: registerResult }
    } else {
      this.log(`❌ 注册失败! 状态码: ${registerResult.status}`)
      if (registerResult.data?.error) {
        this.log(`📝 错误详情:`, registerResult.data.error)
      }
      if (registerResult.data?.issues) {
        this.log(`📝 验证问题:`, registerResult.data.issues)
      }
      return { user: testUser, result: registerResult }
    }
  }

  // 3. 测试用户登录
  async testUserLogin(userCredentials: any) {
    this.log(`\n🔐 ===== 测试用户登录 =====`)

    const loginData = {
      email: userCredentials.email,
      password: userCredentials.password
    }

    this.log(`\n📍 使用注册的用户凭据登录:`)
    this.log(`  - 邮箱: ${loginData.email}`)
    this.log(`  - 密码: ${"*".repeat(loginData.password.length)}`)

    const loginResult = await this.makeRequest("POST", "/auth/login", loginData)

    if (loginResult.success && loginResult.data?.data?.token) {
      this.log(`✅ 登录成功! 状态码: ${loginResult.status}`)
      this.log(
        `🎫 获得JWT令牌: ${loginResult.data.data.token.substring(0, 30)}...`
      )
      this.log(`🎫 令牌总长度: ${loginResult.data.data.token.length} 字符`)
      return { token: loginResult.data.data.token, result: loginResult }
    } else {
      this.log(`❌ 登录失败! 状态码: ${loginResult.status}`)
      return { token: null, result: loginResult }
    }
  }

  // 4. 测试获取用户信息
  async testGetUserInfo(token: string) {
    this.log(`\n📱 ===== 测试获取用户信息 =====`)

    this.log(`\n📍 使用JWT令牌获取用户信息`)
    this.log(`🎫 令牌: ${token.substring(0, 30)}...`)
    this.log(`🔍 Authorization头: Bearer ${token.substring(0, 20)}...`)

    const result = await this.makeRequest("GET", "/auth/me", undefined, {
      Authorization: `Bearer ${token}`
    })

    if (result.success) {
      this.log(`✅ 获取用户信息成功! 状态码: ${result.status}`)
      if (result.data?.data) {
        this.log(`👤 用户信息:`, result.data.data)
      }
    } else {
      this.log(`❌ 获取用户信息失败! 状态码: ${result.status}`)
    }

    return result
  }

  // 生成详细测试报告
  generateDetailedReport() {
    this.log(`\n📊 ===== 详细测试报告 =====`)

    const successCount = this.testResults.filter((r) => r.success).length
    const totalCount = this.testResults.length
    const failureCount = totalCount - successCount

    this.log(`📈 测试统计:`)
    this.log(`  - 总请求数: ${totalCount}`)
    this.log(`  - 成功请求: ${successCount} ✅`)
    this.log(`  - 失败请求: ${failureCount} ❌`)
    this.log(
      `  - 成功率: ${totalCount > 0 ? ((successCount / totalCount) * 100).toFixed(1) : 0}%`
    )

    this.log(`\n📋 逐请求详细结果:`)
    this.testResults.forEach((result, index) => {
      const status = result.success ? "✅" : "❌"
      const errorInfo = result.error ? ` (${result.error})` : ""
      this.log(`  ${index + 1}. ${status} HTTP ${result.status}${errorInfo}`)
      this.log(`     时间: ${result.timestamp}`)
      if (result.data && typeof result.data === "object") {
        const dataPreview = JSON.stringify(result.data).substring(0, 100)
        this.log(
          `     数据: ${dataPreview}${dataPreview.length >= 100 ? "..." : ""}`
        )
      }
    })

    // 状态码分析
    const statusCodes = this.testResults.reduce(
      (acc, result) => {
        acc[result.status] = (acc[result.status] || 0) + 1
        return acc
      },
      {} as Record<number, number>
    )

    this.log(`\n📊 HTTP状态码分布:`)
    Object.entries(statusCodes).forEach(([code, count]) => {
      this.log(`  - ${code}: ${count}次`)
    })
  }

  // 运行完整测试套件
  async runFullTest() {
    this.log(`🚀 ===============================================`)
    this.log(`🚀 开始完整的 Auth API 手动测试`)
    this.log(`🚀 ===============================================`)
    this.log(`⏰ 测试开始时间: ${new Date().toLocaleString()}`)
    this.log(`🌐 测试目标: ${this.baseUrl}`)

    try {
      // 步骤1: 连通性测试
      await this.testConnectivity()

      // 步骤2: 用户注册测试
      const registrationTest = await this.testUserRegistration()

      // 步骤3: 如果注册成功，继续测试登录
      if (registrationTest.result.success) {
        const loginTest = await this.testUserLogin(registrationTest.user)

        // 步骤4: 如果登录成功，测试获取用户信息
        if (loginTest.token) {
          await this.testGetUserInfo(loginTest.token)
        }
      } else {
        this.log(`⚠️  由于注册失败，跳过后续的登录和用户信息测试`)
      }
    } catch (error) {
      this.log(`❌ 测试过程中发生严重异常:`)
      this.log(
        `   错误类型: ${error instanceof Error ? error.constructor.name : typeof error}`
      )
      this.log(
        `   错误消息: ${error instanceof Error ? error.message : String(error)}`
      )
      if (error instanceof Error && error.stack) {
        this.log(`   错误堆栈: ${error.stack}`)
      }
    }

    // 生成详细报告
    this.generateDetailedReport()

    this.log(`\n🏁 ===============================================`)
    this.log(`🏁 测试完成时间: ${new Date().toLocaleString()}`)
    this.log(`🏁 ===============================================`)
  }
}

// 立即执行测试
console.log("🔧 启动Auth API手动测试...")
const runner = new AuthTestRunner()
runner.runFullTest().catch((error) => {
  console.error("❌ 测试运行器失败:", error)
  process.exit(1)
})
