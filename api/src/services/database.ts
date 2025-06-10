import type { D1Database } from "@cloudflare/workers-types"

export class DatabaseService {
  constructor(protected db: D1Database) {}

  // 执行查询并返回单个结果
  async queryFirst<T = any>(
    query: string,
    params: any[] = []
  ): Promise<T | null> {
    try {
      const result = await this.db
        .prepare(query)
        .bind(...params)
        .first()
      return result as T | null
    } catch (error) {
      console.error("Database query first error:", error)
      throw new Error("数据库查询失败")
    }
  }

  // 执行查询并返回所有结果
  async queryAll<T = any>(query: string, params: any[] = []): Promise<T[]> {
    try {
      const result = await this.db
        .prepare(query)
        .bind(...params)
        .all()
      return result.results as T[]
    } catch (error) {
      console.error("Database query all error:", error)
      throw new Error("数据库查询失败")
    }
  }

  // 执行写入操作（INSERT, UPDATE, DELETE）
  async execute(query: string, params: any[] = []): Promise<D1Result> {
    try {
      const result = await this.db
        .prepare(query)
        .bind(...params)
        .run()
      return result
    } catch (error) {
      console.error("Database execute error:", error)
      throw new Error("数据库执行失败")
    }
  }

  // 生成UUID（用于ID）
  generateId(): string {
    return crypto.randomUUID()
  }

  // 获取当前时间戳
  getCurrentTimestamp(): string {
    return new Date().toISOString()
  }
}

// 数据库表结构接口
export interface DatabaseUser {
  id: string
  username: string
  email: string
  password_hash: string
  is_sponsored: number // SQLite使用INTEGER存储boolean
  receive_official_messages: number // SQLite使用INTEGER存储boolean
  settings: string // JSON字符串
  created_at: string
  updated_at: string
}
