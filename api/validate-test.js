#!/usr/bin/env node

/**
 * 数据验证测试脚本
 */

// 模拟 RegisterUserSchema 验证
const testUser = {
  username: `testuser_${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  password: "password123",
  receiveOfficialMessages: true
}

console.log("🧪 测试用户数据验证...")
console.log("📋 测试数据:")
console.log(JSON.stringify(testUser, null, 2))
console.log()

// 检查各个字段
const checks = [
  {
    field: "username",
    value: testUser.username,
    tests: [
      { name: "长度 >= 3", pass: testUser.username.length >= 3 },
      { name: "长度 <= 20", pass: testUser.username.length <= 20 },
      { name: "只包含字母数字下划线", pass: /^[a-zA-Z0-9_]+$/.test(testUser.username) }
    ]
  },
  {
    field: "email",
    value: testUser.email,
    tests: [
      { name: "邮箱格式正确", pass: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testUser.email) }
    ]
  },
  {
    field: "password",
    value: testUser.password,
    tests: [
      { name: "长度 >= 8", pass: testUser.password.length >= 8 },
      { name: "长度 <= 128", pass: testUser.password.length <= 128 }
    ]
  },
  {
    field: "receiveOfficialMessages",
    value: testUser.receiveOfficialMessages,
    tests: [
      { name: "是布尔值", pass: typeof testUser.receiveOfficialMessages === "boolean" }
    ]
  }
]

let allPassed = true

checks.forEach(check => {
  console.log(`📝 ${check.field}: ${check.value}`)
  check.tests.forEach(test => {
    const status = test.pass ? "✅" : "❌"
    console.log(`   ${status} ${test.name}`)
    if (!test.pass) allPassed = false
  })
  console.log()
})

console.log(`🎯 验证结果: ${allPassed ? "✅ 全部通过" : "❌ 存在问题"}`)

if (allPassed) {
  console.log("✨ 数据格式正确，问题可能在服务器端")
} else {
  console.log("💥 数据格式有问题，需要修正")
}