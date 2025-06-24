import type { PlasmoMessaging } from "@plasmohq/messaging"
import type { UserProfile } from "~/background/messages/user-profile-action"

// 监听来自 background 的用户配置文件更新消息
const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log("📨 Content script 收到用户配置文件更新消息:", req.body)

  const { profile, timestamp } = req.body as {
    profile: UserProfile
    timestamp: number
  }

  try {
    // 1. 触发自定义事件，让应用知道数据已更新
    const updateEvent = new CustomEvent('userProfileUpdated', {
      detail: {
        profile,
        timestamp,
        source: 'background-sync'
      }
    })

    window.dispatchEvent(updateEvent)

    // 2. 如果页面有 React Query，可以触发重新获取
    // 这里可以通过 window 对象访问到 React Query 的 invalidateQueries
    // @ts-ignore
    if (window.__REACT_QUERY_CLIENT__) {
      // @ts-ignore
      window.__REACT_QUERY_CLIENT__.invalidateQueries(['userProfile'])
    }

    console.log("✅ 用户配置文件更新事件已触发")

    res.send({
      success: true,
      message: "Profile update received and processed"
    })
  } catch (error) {
    console.error("❌ 处理用户配置文件更新失败:", error)
    res.send({
      success: false,
      error: error.message
    })
  }
}

export default handler