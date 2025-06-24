import ky from "ky";





// API 客户端配置
export const apiClient = ky.create({
  prefixUrl: process.env.PLASMO_PUBLIC_API_URL || "https://api.example.com",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json"
  },
  hooks: {
    beforeRequest: [
      async (request) => {
        // 添加认证 token - 从 Chrome Storage 获取
        try {
          if (typeof chrome !== "undefined" && chrome.storage?.local) {
            const result = await chrome.storage.local.get(["auth_token"])
            const token = result.auth_token
            if (token) {
              request.headers.set("Authorization", `Bearer ${token}`)
            }
          }
        } catch (error) {
          console.error("Failed to get auth token from Chrome Storage:", error)
        }
      }
    ],
    afterResponse: [
      async (request, options, response) => {
        // 处理通用错误
        if (!response.ok) {
          const errorData = (await response.json().catch(() => ({}))) as {
            message?: string
          }
          throw new Error(errorData.message || `HTTP ${response.status}`)
        }
        return response
      }
    ]
  }
})

// 导出便捷方法
export const api = {
  get: <T>(url: string, options?: any) => apiClient.get(url, options).json<T>(),
  post: <T>(url: string, data?: any, options?: any) =>
    apiClient.post(url, { json: data, ...options }).json<T>(),
  put: <T>(url: string, data?: any, options?: any) =>
    apiClient.put(url, { json: data, ...options }).json<T>(),
  delete: <T>(url: string, options?: any) =>
    apiClient.delete(url, options).json<T>()
}