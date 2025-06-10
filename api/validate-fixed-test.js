#!/usr/bin/env node

/**
 * 验证修复后的数据格式
 */

// 使用修复后的逻辑生成测试数据
const timestamp = Date.now().toString().slice(-8) // 只取后8位
const testUser = {
  username: `test_${timestamp}`, // 保持在20字符以内
  email: `test_${timestamp}@example.com`,
  password: "password123",
  receiveOfficialMessages: true
}

console.log("🧪 验证修复后的用户数据...")
console.log("📋 测试数据:")
console.log(JSON.stringify(testUser, null, 2))
console.log()

// 检查用户名长度
console.log(`📏 用户名: "${testUser.username}"`)
console.log(`📏 长度: ${testUser.username.length} 字符`)
console.log(`📏 是否符合要求 (3-20字符): ${testUser.username.length >= 3 && testUser.username.length <= 20 ? "✅ 是" : "❌ 否"}`)
console.log(`📏 格式是否正确: ${/^[a-zA-Z0-9_]+$/.test(testUser.username) ? "✅ 是" : "❌ 否"}`)
console.log()

console.log(`📧 邮箱: "${testUser.email}"`)
console.log(`📧 格式是否正确: ${/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testUser.email) ? "✅ 是" : "❌ 否"}`)
console.log()

console.log(`🔐 密码长度: ${testUser.password.length} 字符`)
console.log(`🔐 是否符合要求 (8-128字符): ${testUser.password.length >= 8 && testUser.password.length <= 128 ? "✅ 是" : "❌ 否"}`)
console.log()

console.log("🎯 修复完成，现在可以重新测试注册接口了！")