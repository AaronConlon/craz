import ky from "ky"

// API 客户端配置
export const apiClient = ky.create({
  prefixUrl: process.env.PLASMO_PUBLIC_API_URL || "https://api.example.com",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json"
  },
  hooks: {
    beforeRequest: [
      (request) => {
        // 添加认证 token
        const token = localStorage.getItem("auth_token")
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`)
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
