// 通用类型定义

// 基础类型
export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

// 响应包装类型
export interface ApiResponse<T = unknown> {
  data: T
  message: string
  success: boolean
  timestamp: number
}

// 分页类型
export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasNextPage: boolean
}

// 组件 Props 类型
export interface ComponentProps {
  className?: string
  children?: React.ReactNode
}
