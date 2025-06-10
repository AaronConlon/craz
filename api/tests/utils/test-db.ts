import { D1Database } from "@cloudflare/workers-types"

// 模拟 D1 数据库
export class MockD1Database implements Partial<D1Database> {
  private data: Map<string, any[]> = new Map()

  constructor() {
    // 初始化空表
    this.data.set("users", [])
    this.data.set("teams", [])
    this.data.set("team_members", [])
    this.data.set("bookmarks", [])
  }

  prepare(query: string) {
    return {
      bind: (...params: any[]) => ({
        first: async (): Promise<any> => {
          // 简单的查询解析和执行
          const result = this.executeQuery(query, params)
          return result ? result[0] : null
        },
        all: async (): Promise<{ results: any[] }> => {
          const results = this.executeQuery(query, params)
          return { results: results || [] }
        },
        run: async (): Promise<{ changes: number; success: boolean }> => {
          const changes = this.executeWriteQuery(query, params)
          return { changes, success: true }
        }
      })
    }
  }

  private executeQuery(query: string, params: any[]): any[] {
    const normalizedQuery = query.toLowerCase().trim()

    // SELECT 查询
    if (normalizedQuery.startsWith("select")) {
      if (normalizedQuery.includes("from users")) {
        const users = this.data.get("users") || []

        if (normalizedQuery.includes("where email =")) {
          return users.filter((user) => user.email === params[0])
        }
        if (normalizedQuery.includes("where username =")) {
          return users.filter((user) => user.username === params[0])
        }
        if (normalizedQuery.includes("where id =")) {
          return users.filter((user) => user.id === params[0])
        }

        return users
      }

      if (normalizedQuery.includes("from sqlite_master")) {
        return [
          { name: "users" },
          { name: "teams" },
          { name: "team_members" },
          { name: "bookmarks" }
        ]
      }
    }

    return []
  }

  private executeWriteQuery(query: string, params: any[]): number {
    const normalizedQuery = query.toLowerCase().trim()

    // INSERT 查询
    if (normalizedQuery.startsWith("insert into users")) {
      const users = this.data.get("users") || []
      const newUser = {
        id: params[0],
        username: params[1],
        email: params[2],
        password_hash: params[3],
        is_sponsored: params[4],
        receive_official_messages: params[5],
        settings: params[6],
        created_at: params[7],
        updated_at: params[8]
      }
      users.push(newUser)
      this.data.set("users", users)
      return 1
    }

    // UPDATE 查询
    if (normalizedQuery.startsWith("update users")) {
      const users = this.data.get("users") || []
      let updated = 0

      if (normalizedQuery.includes("where id =")) {
        const userId = params[params.length - 1] // 最后一个参数通常是 WHERE 条件的值

        for (let i = 0; i < users.length; i++) {
          if (users[i].id === userId) {
            if (normalizedQuery.includes("settings =")) {
              users[i].settings = params[0]
              users[i].updated_at = params[1]
            }
            updated++
            break
          }
        }
      }

      this.data.set("users", users)
      return updated
    }

    return 0
  }

  // 清空所有数据（用于测试重置）
  reset() {
    this.data.clear()
    this.data.set("users", [])
    this.data.set("teams", [])
    this.data.set("team_members", [])
    this.data.set("bookmarks", [])
  }

  // 获取表数据（用于测试验证）
  getTable(name: string): any[] {
    return this.data.get(name) || []
  }

  // 直接插入数据（用于测试设置）
  insertData(table: string, data: any) {
    const tableData = this.data.get(table) || []
    tableData.push(data)
    this.data.set(table, tableData)
  }
}
