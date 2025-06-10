import type { PlasmoMessaging } from "@plasmohq/messaging"

import type { AuthStatus } from "~source/shared/types/settings"

// 检查登录状态
async function checkAuthStatus(): Promise<AuthStatus> {
  try {
    const result = await chrome.storage.local.get(["craz-auth-status"])
    const authData = result["craz-auth-status"]

    if (!authData) {
      return { isLoggedIn: false }
    }

    // 检查token是否过期
    if (authData.expiresAt && Date.now() > authData.expiresAt) {
      // token已过期，清除认证信息
      await chrome.storage.local.remove(["craz-auth-status"])
      return { isLoggedIn: false }
    }

    return {
      isLoggedIn: true,
      userId: authData.userId,
      username: authData.username,
      token: authData.token,
      expiresAt: authData.expiresAt
    }
  } catch (error) {
    console.error("Error checking auth status:", error)
    return { isLoggedIn: false }
  }
}

// 验证token有效性（模拟实现）
async function validateToken(token: string): Promise<boolean> {
  try {
    // TODO: 实现真实的token验证API调用
    // const response = await fetch('https://api.craz.com/auth/validate', {
    //   headers: { Authorization: `Bearer ${token}` }
    // })
    // return response.ok

    // 暂时返回true，表示token有效
    return true
  } catch (error) {
    console.error("Error validating token:", error)
    return false
  }
}

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    console.log("Checking auth status...")

    const authStatus = await checkAuthStatus()

    // 如果已登录，验证token有效性
    if (authStatus.isLoggedIn && authStatus.token) {
      const isValid = await validateToken(authStatus.token)

      if (!isValid) {
        // token无效，清除认证信息
        await chrome.storage.local.remove(["craz-auth-status"])
        console.log("Token invalid, cleared auth status")

        res.send({
          success: true,
          data: { isLoggedIn: false }
        })
        return
      }
    }

    console.log("Auth status:", authStatus)

    res.send({
      success: true,
      data: authStatus
    })
  } catch (error) {
    console.error("Error in check-auth-status:", error)
    res.send({
      success: false,
      error: error.message || "Failed to check auth status",
      data: { isLoggedIn: false }
    })
  }
}

export default handler
