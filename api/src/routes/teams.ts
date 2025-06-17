import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"
import { jwt } from "hono/jwt"

import type { Env } from "../index"
import {
  BookmarkQuerySchema,
  CreateBookmarkSchema,
  UpdateBookmarkSchema
} from "../schemas/bookmark"
import {
  CreateTeamSchema,
  InviteMemberSchema,
  TeamQuerySchema,
  UpdateMemberRoleSchema,
  UpdateTeamSchema
} from "../schemas/team"
import {
  checkTeamAdmin,
  checkTeamOwner,
  checkTeamPermission,
  getUserId
} from "../utils/auth"

export const teamRoutes = new Hono<{ Bindings: Env }>()

// JWT中间件
teamRoutes.use("*", async (c, next) => {
  const jwtMiddleware = jwt({
    secret: c.env.JWT_SECRET,
    alg: "HS256"
  })
  return jwtMiddleware(c, next)
})

// 健康检查
teamRoutes.get("/health", (c) => {
  return c.json({
    success: true,
    message: "团队服务运行中",
    timestamp: new Date().toISOString()
  })
})

// 获取用户的团队列表
teamRoutes.get("/", zValidator("query", TeamQuerySchema), async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const query = c.req.valid("query")

  try {
    // 计算偏移量
    const offset = (query.page - 1) * query.pageSize

    // 构建查询条件
    let whereClause = "WHERE tm.user_id = ?"
    const params = [userId]

    if (query.search) {
      whereClause += " AND (t.name LIKE ? OR t.description LIKE ?)"
      const searchPattern = `%${query.search}%`
      params.push(searchPattern, searchPattern)
    }

    // 获取总数
    const countResult = (await db
      .prepare(
        `SELECT COUNT(*) as total 
         FROM team_members tm 
         JOIN teams t ON t.id = tm.team_id 
         ${whereClause}`
      )
      .bind(...params)
      .first()) as { total: number }

    // 获取团队数据
    const teamsResult = await db
      .prepare(
        `SELECT t.id, t.name, t.description, t.owner_id, t.settings, 
                t.created_at, t.updated_at, tm.role
         FROM team_members tm 
         JOIN teams t ON t.id = tm.team_id 
         ${whereClause}
         ORDER BY t.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(...params, query.pageSize, offset)
      .all()

    // 转换数据格式
    const teams = (teamsResult.results || []).map((team: any) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      ownerId: team.owner_id,
      settings: JSON.parse(team.settings),
      createdAt: team.created_at,
      updatedAt: team.updated_at,
      userRole: team.role // 用户在该团队中的角色
    }))

    const total = countResult?.total || 0
    const hasNextPage = offset + query.pageSize < total

    return c.json({
      success: true,
      message: "获取团队列表成功",
      data: teams,
      pagination: {
        total,
        page: query.page,
        pageSize: query.pageSize,
        hasNextPage
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("获取团队列表失败:", error)
    throw new HTTPException(500, { message: "获取团队列表失败" })
  }
})

// 创建团队
teamRoutes.post("/", zValidator("json", CreateTeamSchema), async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const data = c.req.valid("json")

  try {
    const teamId = crypto.randomUUID()
    const memberId = crypto.randomUUID()
    const now = new Date().toISOString()

    // 开始事务
    const teamResult = await db
      .prepare(
        `INSERT INTO teams (id, name, description, owner_id, settings, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        teamId,
        data.name,
        data.description || null,
        userId,
        JSON.stringify(data.settings),
        now,
        now
      )
      .run()

    // 添加创建者为团队所有者
    await db
      .prepare(
        `INSERT INTO team_members (id, team_id, user_id, role, joined_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(memberId, teamId, userId, "owner", now)
      .run()

    // 获取创建的团队信息
    const createdTeam = (await db
      .prepare(
        `SELECT id, name, description, owner_id, settings, created_at, updated_at
         FROM teams WHERE id = ?`
      )
      .bind(teamId)
      .first()) as any

    const team = {
      id: createdTeam.id,
      name: createdTeam.name,
      description: createdTeam.description,
      ownerId: createdTeam.owner_id,
      settings: JSON.parse(createdTeam.settings),
      createdAt: createdTeam.created_at,
      updatedAt: createdTeam.updated_at
    }

    return c.json({
      success: true,
      message: "创建团队成功",
      data: { id: teamId, team },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("创建团队失败:", error)
    throw new HTTPException(500, { message: "创建团队失败" })
  }
})

// 获取单个团队信息
teamRoutes.get("/:id", async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const teamId = c.req.param("id")

  try {
    // 先获取团队信息，检查团队是否存在
    const teamData = (await db
      .prepare(
        `SELECT id, name, description, owner_id, settings, created_at, updated_at
         FROM teams WHERE id = ?`
      )
      .bind(teamId)
      .first()) as any

    if (!teamData) {
      throw new HTTPException(404, { message: "团队不存在" })
    }

    // 检查用户是否为团队成员
    await checkTeamPermission(db, teamId, userId)

    const team = {
      id: teamData.id,
      name: teamData.name,
      description: teamData.description,
      ownerId: teamData.owner_id,
      settings: JSON.parse(teamData.settings),
      createdAt: teamData.created_at,
      updatedAt: teamData.updated_at
    }

    return c.json({
      success: true,
      message: "获取团队信息成功",
      data: team,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    if (error instanceof HTTPException) throw error
    console.error("获取团队信息失败:", error)
    throw new HTTPException(500, { message: "获取团队信息失败" })
  }
})

// 更新团队信息
teamRoutes.put("/:id", zValidator("json", UpdateTeamSchema), async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const teamId = c.req.param("id")
  const data = c.req.valid("json")

  try {
    // 检查用户是否为团队管理员或所有者
    await checkTeamAdmin(db, teamId, userId)

    // 构建更新数据
    const updateFields = []
    const params = []

    if (data.name !== undefined) {
      updateFields.push("name = ?")
      params.push(data.name)
    }

    if (data.description !== undefined) {
      updateFields.push("description = ?")
      params.push(data.description)
    }

    if (data.settings !== undefined) {
      updateFields.push("settings = ?")
      params.push(JSON.stringify(data.settings))
    }

    if (updateFields.length === 0) {
      throw new HTTPException(400, { message: "没有提供要更新的字段" })
    }

    updateFields.push("updated_at = ?")
    params.push(new Date().toISOString())
    params.push(teamId)

    const result = await db
      .prepare(`UPDATE teams SET ${updateFields.join(", ")} WHERE id = ?`)
      .bind(...params)
      .run()

    return c.json({
      success: true,
      message: "更新团队信息成功",
      affected: result.meta.changes,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    if (error instanceof HTTPException) throw error
    console.error("更新团队信息失败:", error)
    throw new HTTPException(500, { message: "更新团队信息失败" })
  }
})

// 删除团队
teamRoutes.delete("/:id", async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const teamId = c.req.param("id")

  try {
    // 检查用户是否为团队所有者
    await checkTeamOwner(db, teamId, userId)

    // 删除团队（级联删除成员和书签）
    const result = await db
      .prepare("DELETE FROM teams WHERE id = ?")
      .bind(teamId)
      .run()

    return c.json({
      success: true,
      message: "删除团队成功",
      affected: result.meta.changes,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    if (error instanceof HTTPException) throw error
    console.error("删除团队失败:", error)
    throw new HTTPException(500, { message: "删除团队失败" })
  }
})

// 获取团队成员列表
teamRoutes.get(
  "/:id/members",
  zValidator("query", TeamQuerySchema),
  async (c) => {
    const db = c.env.DB
    const userId = getUserId(c)
    const teamId = c.req.param("id")
    const query = c.req.valid("query")

    try {
      // 检查用户是否为团队成员
      await checkTeamPermission(db, teamId, userId)

      // 计算偏移量
      const offset = (query.page - 1) * query.pageSize

      // 构建查询条件
      let whereClause = "WHERE tm.team_id = ?"
      const params = [teamId]

      if (query.search) {
        whereClause += " AND (u.username LIKE ? OR u.email LIKE ?)"
        const searchPattern = `%${query.search}%`
        params.push(searchPattern, searchPattern)
      }

      // 获取总数
      const countResult = (await db
        .prepare(
          `SELECT COUNT(*) as total 
         FROM team_members tm 
         JOIN users u ON u.id = tm.user_id 
         ${whereClause}`
        )
        .bind(...params)
        .first()) as { total: number }

      // 获取成员数据
      const membersResult = await db
        .prepare(
          `SELECT tm.id, tm.team_id, tm.user_id, tm.role, tm.joined_at,
                u.username, u.email
         FROM team_members tm 
         JOIN users u ON u.id = tm.user_id 
         ${whereClause}
         ORDER BY tm.joined_at ASC
         LIMIT ? OFFSET ?`
        )
        .bind(...params, query.pageSize, offset)
        .all()

      // 转换数据格式
      const members = (membersResult.results || []).map((member: any) => ({
        id: member.id,
        teamId: member.team_id,
        userId: member.user_id,
        username: member.username,
        email: member.email,
        role: member.role,
        joinedAt: member.joined_at
      }))

      const total = countResult?.total || 0
      const hasNextPage = offset + query.pageSize < total

      return c.json({
        success: true,
        message: "获取团队成员列表成功",
        data: members,
        pagination: {
          total,
          page: query.page,
          pageSize: query.pageSize,
          hasNextPage
        },
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      if (error instanceof HTTPException) throw error
      console.error("获取团队成员列表失败:", error)
      throw new HTTPException(500, { message: "获取团队成员列表失败" })
    }
  }
)

// 邀请成员加入团队
teamRoutes.post(
  "/:id/members",
  zValidator("json", InviteMemberSchema),
  async (c) => {
    const db = c.env.DB
    const userId = getUserId(c)
    const teamId = c.req.param("id")
    const data = c.req.valid("json")

    try {
      // 检查用户权限
      const { settings } = await checkTeamPermission(db, teamId, userId, [
        "owner",
        "admin"
      ])

      // 如果不是管理员，检查是否允许成员邀请
      const userRole = await checkTeamPermission(db, teamId, userId)
      if (userRole.role === "member" && !settings.allowMemberInvite) {
        throw new HTTPException(403, {
          message: "团队设置不允许普通成员邀请新成员"
        })
      }

      // 查找要邀请的用户
      const targetUser = (await db
        .prepare("SELECT id FROM users WHERE email = ?")
        .bind(data.email)
        .first()) as { id: string } | null

      if (!targetUser) {
        throw new HTTPException(404, { message: "用户不存在" })
      }

      // 检查用户是否已经是团队成员
      const existingMember = await db
        .prepare(
          "SELECT id FROM team_members WHERE team_id = ? AND user_id = ?"
        )
        .bind(teamId, targetUser.id)
        .first()

      if (existingMember) {
        throw new HTTPException(400, { message: "用户已经是团队成员" })
      }

      // 添加成员
      const memberId = crypto.randomUUID()
      const now = new Date().toISOString()

      await db
        .prepare(
          `INSERT INTO team_members (id, team_id, user_id, role, joined_at)
         VALUES (?, ?, ?, ?, ?)`
        )
        .bind(memberId, teamId, targetUser.id, data.role, now)
        .run()

      // 获取新添加的成员信息
      const newMember = (await db
        .prepare(
          `SELECT tm.id, tm.team_id, tm.user_id, tm.role, tm.joined_at,
                u.username, u.email
         FROM team_members tm 
         JOIN users u ON u.id = tm.user_id 
         WHERE tm.id = ?`
        )
        .bind(memberId)
        .first()) as any

      const member = {
        id: newMember.id,
        teamId: newMember.team_id,
        userId: newMember.user_id,
        username: newMember.username,
        email: newMember.email,
        role: newMember.role,
        joinedAt: newMember.joined_at
      }

      return c.json({
        success: true,
        message: "邀请成员成功",
        data: member,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      if (error instanceof HTTPException) throw error
      console.error("邀请成员失败:", error)
      throw new HTTPException(500, { message: "邀请成员失败" })
    }
  }
)

// 更新成员角色
teamRoutes.put(
  "/:id/members/:memberId",
  zValidator("json", UpdateMemberRoleSchema),
  async (c) => {
    const db = c.env.DB
    const userId = getUserId(c)
    const teamId = c.req.param("id")
    const memberId = c.req.param("memberId")
    const data = c.req.valid("json")

    try {
      // 检查用户是否为团队管理员或所有者
      await checkTeamAdmin(db, teamId, userId)

      // 获取要更新的成员信息
      const member = (await db
        .prepare(
          `SELECT tm.user_id, tm.role, t.owner_id
         FROM team_members tm 
         JOIN teams t ON t.id = tm.team_id 
         WHERE tm.id = ? AND tm.team_id = ?`
        )
        .bind(memberId, teamId)
        .first()) as { user_id: string; role: string; owner_id: string } | null

      if (!member) {
        throw new HTTPException(404, { message: "团队成员不存在" })
      }

      // 不能修改团队所有者的角色
      if (member.user_id === member.owner_id) {
        throw new HTTPException(400, { message: "不能修改团队所有者的角色" })
      }

      // 更新成员角色
      const result = await db
        .prepare(
          `UPDATE team_members SET role = ? WHERE id = ? AND team_id = ?`
        )
        .bind(data.role, memberId, teamId)
        .run()

      return c.json({
        success: true,
        message: "更新成员角色成功",
        affected: result.meta.changes,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      if (error instanceof HTTPException) throw error
      console.error("更新成员角色失败:", error)
      throw new HTTPException(500, { message: "更新成员角色失败" })
    }
  }
)

// 移除团队成员
teamRoutes.delete("/:id/members/:memberId", async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const teamId = c.req.param("id")
  const memberId = c.req.param("memberId")

  try {
    // 获取要移除的成员信息
    const member = (await db
      .prepare(
        `SELECT tm.user_id, tm.role, t.owner_id
         FROM team_members tm 
         JOIN teams t ON t.id = tm.team_id 
         WHERE tm.id = ? AND tm.team_id = ?`
      )
      .bind(memberId, teamId)
      .first()) as { user_id: string; role: string; owner_id: string } | null

    if (!member) {
      throw new HTTPException(404, { message: "团队成员不存在" })
    }

    // 不能移除团队所有者
    if (member.user_id === member.owner_id) {
      throw new HTTPException(400, { message: "不能移除团队所有者" })
    }

    // 检查权限：管理员可以移除普通成员，所有者可以移除任何人，成员可以退出团队
    if (member.user_id === userId) {
      // 用户退出团队
    } else {
      // 移除其他成员，需要管理员或所有者权限
      await checkTeamAdmin(db, teamId, userId)
    }

    // 移除成员
    const result = await db
      .prepare("DELETE FROM team_members WHERE id = ? AND team_id = ?")
      .bind(memberId, teamId)
      .run()

    return c.json({
      success: true,
      message: member.user_id === userId ? "退出团队成功" : "移除成员成功",
      affected: result.meta.changes,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    if (error instanceof HTTPException) throw error
    console.error("移除团队成员失败:", error)
    throw new HTTPException(500, { message: "移除团队成员失败" })
  }
})

// ==================== 团队书签功能 ====================

// 获取团队书签列表
teamRoutes.get(
  "/:id/bookmarks",
  zValidator("query", BookmarkQuerySchema),
  async (c) => {
    const db = c.env.DB
    const userId = getUserId(c)
    const teamId = c.req.param("id")
    const query = c.req.valid("query")

    try {
      // 检查用户是否为团队成员
      await checkTeamPermission(db, teamId, userId)

      // 计算偏移量
      const offset = (query.page - 1) * query.pageSize

      // 构建查询条件
      let whereClause = "WHERE team_id = ?"
      const params = [teamId]

      if (query.search) {
        whereClause += " AND (title LIKE ? OR url LIKE ?)"
        const searchPattern = `%${query.search}%`
        params.push(searchPattern, searchPattern)
      }

      // 获取总数
      const countResult = (await db
        .prepare(`SELECT COUNT(*) as total FROM bookmarks ${whereClause}`)
        .bind(...params)
        .first()) as { total: number }

      // 获取书签数据
      const bookmarksResult = await db
        .prepare(
          `SELECT id, url, title, parent_id, sort_order, date_added, 
                metadata, team_id, created_by, updated_by, created_at, updated_at
         FROM bookmarks 
         ${whereClause}
         ORDER BY sort_order ASC, created_at DESC
         LIMIT ? OFFSET ?`
        )
        .bind(...params, query.pageSize, offset)
        .all()

      // 转换数据格式
      const bookmarks = (bookmarksResult.results || []).map(
        (bookmark: any) => ({
          id: bookmark.id,
          url: bookmark.url,
          title: bookmark.title,
          parentId: bookmark.parent_id,
          sortOrder: bookmark.sort_order,
          dateAdded: bookmark.date_added,
          tags: bookmark.metadata
            ? JSON.parse(bookmark.metadata).tags || []
            : [],
          description: bookmark.metadata
            ? JSON.parse(bookmark.metadata).description || ""
            : "",
          teamId: bookmark.team_id,
          createdBy: bookmark.created_by,
          updatedBy: bookmark.updated_by,
          createdAt: bookmark.created_at,
          updatedAt: bookmark.updated_at
        })
      )

      const total = countResult?.total || 0
      const hasNextPage = offset + query.pageSize < total

      return c.json({
        success: true,
        message: "获取团队书签列表成功",
        data: bookmarks,
        pagination: {
          total,
          page: query.page,
          pageSize: query.pageSize,
          hasNextPage
        },
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      if (error instanceof HTTPException) throw error
      console.error("获取团队书签列表失败:", error)
      throw new HTTPException(500, { message: "获取团队书签列表失败" })
    }
  }
)

// 创建团队书签
teamRoutes.post(
  "/:id/bookmarks",
  zValidator("json", CreateBookmarkSchema),
  async (c) => {
    const db = c.env.DB
    const userId = getUserId(c)
    const teamId = c.req.param("id")
    const data = c.req.valid("json")

    try {
      // 检查用户权限
      const { settings, role } = await checkTeamPermission(db, teamId, userId)

      // 检查是否允许成员编辑
      if (role === "member" && !settings.allowMemberEdit) {
        throw new HTTPException(403, { message: "普通成员无权创建团队书签" })
      }

      // 生成书签ID
      const bookmarkId = crypto.randomUUID()
      const now = new Date().toISOString()

      // 构建metadata
      const metadata = {
        tags: data.tags || [],
        description: data.description || ""
      }

      const result = await db
        .prepare(
          `INSERT INTO bookmarks (
          id, url, title, parent_id, sort_order, date_added, date_modified,
          metadata, team_id, created_by, updated_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          bookmarkId,
          data.url,
          data.title,
          data.parentId,
          data.sortOrder,
          Date.now(),
          Date.now(),
          JSON.stringify(metadata),
          teamId,
          userId,
          userId,
          now,
          now
        )
        .run()

      return c.json({
        success: true,
        message: "创建团队书签成功",
        data: { id: bookmarkId },
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      if (error instanceof HTTPException) throw error
      console.error("创建团队书签失败:", error)
      throw new HTTPException(500, { message: "创建团队书签失败" })
    }
  }
)

// 获取单个团队书签
teamRoutes.get("/:id/bookmarks/:bookmarkId", async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const teamId = c.req.param("id")
  const bookmarkId = c.req.param("bookmarkId")

  try {
    // 检查用户是否为团队成员
    await checkTeamPermission(db, teamId, userId)

    // 获取书签信息
    const bookmarkData = (await db
      .prepare(
        `SELECT id, url, title, parent_id, sort_order, date_added, 
                metadata, team_id, created_by, updated_by, created_at, updated_at
         FROM bookmarks WHERE id = ? AND team_id = ?`
      )
      .bind(bookmarkId, teamId)
      .first()) as any

    if (!bookmarkData) {
      throw new HTTPException(404, { message: "团队书签不存在" })
    }

    const bookmark = {
      id: bookmarkData.id,
      url: bookmarkData.url,
      title: bookmarkData.title,
      parentId: bookmarkData.parent_id,
      sortOrder: bookmarkData.sort_order,
      dateAdded: bookmarkData.date_added,
      tags: bookmarkData.metadata
        ? JSON.parse(bookmarkData.metadata).tags || []
        : [],
      description: bookmarkData.metadata
        ? JSON.parse(bookmarkData.metadata).description || ""
        : "",
      teamId: bookmarkData.team_id,
      createdBy: bookmarkData.created_by,
      updatedBy: bookmarkData.updated_by,
      createdAt: bookmarkData.created_at,
      updatedAt: bookmarkData.updated_at
    }

    return c.json({
      success: true,
      message: "获取团队书签成功",
      data: bookmark,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    if (error instanceof HTTPException) throw error
    console.error("获取团队书签失败:", error)
    throw new HTTPException(500, { message: "获取团队书签失败" })
  }
})

// 更新团队书签
teamRoutes.put(
  "/:id/bookmarks/:bookmarkId",
  zValidator("json", UpdateBookmarkSchema),
  async (c) => {
    const db = c.env.DB
    const userId = getUserId(c)
    const teamId = c.req.param("id")
    const bookmarkId = c.req.param("bookmarkId")
    const data = c.req.valid("json")

    try {
      // 检查用户权限
      const { settings, role } = await checkTeamPermission(db, teamId, userId)

      // 检查是否允许成员编辑
      if (role === "member" && !settings.allowMemberEdit) {
        throw new HTTPException(403, { message: "普通成员无权更新团队书签" })
      }

      // 检查书签是否存在
      const existingBookmark = await db
        .prepare("SELECT id FROM bookmarks WHERE id = ? AND team_id = ?")
        .bind(bookmarkId, teamId)
        .first()

      if (!existingBookmark) {
        throw new HTTPException(404, { message: "团队书签不存在" })
      }

      // 构建更新数据
      const updateFields = []
      const params = []

      if (data.title !== undefined) {
        updateFields.push("title = ?")
        params.push(data.title)
      }

      if (data.url !== undefined) {
        updateFields.push("url = ?")
        params.push(data.url)
      }

      if (data.parentId !== undefined) {
        updateFields.push("parent_id = ?")
        params.push(data.parentId)
      }

      if (data.sortOrder !== undefined) {
        updateFields.push("sort_order = ?")
        params.push(data.sortOrder)
      }

      if (data.tags !== undefined || data.description !== undefined) {
        // 获取现有metadata
        const currentBookmark = (await db
          .prepare("SELECT metadata FROM bookmarks WHERE id = ?")
          .bind(bookmarkId)
          .first()) as { metadata: string } | null

        const currentMetadata = currentBookmark?.metadata
          ? JSON.parse(currentBookmark.metadata)
          : { tags: [], description: "" }

        const newMetadata = {
          tags: data.tags !== undefined ? data.tags : currentMetadata.tags,
          description:
            data.description !== undefined
              ? data.description
              : currentMetadata.description
        }

        updateFields.push("metadata = ?")
        params.push(JSON.stringify(newMetadata))
      }

      if (updateFields.length === 0) {
        throw new HTTPException(400, { message: "没有提供要更新的字段" })
      }

      // 添加更新时间和更新者
      updateFields.push("date_modified = ?", "updated_by = ?", "updated_at = ?")
      params.push(Date.now(), userId, new Date().toISOString())
      params.push(bookmarkId, teamId)

      const result = await db
        .prepare(
          `UPDATE bookmarks SET ${updateFields.join(", ")} WHERE id = ? AND team_id = ?`
        )
        .bind(...params)
        .run()

      return c.json({
        success: true,
        message: "更新团队书签成功",
        affected: result.meta.changes,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      if (error instanceof HTTPException) throw error
      console.error("更新团队书签失败:", error)
      throw new HTTPException(500, { message: "更新团队书签失败" })
    }
  }
)

// 删除团队书签
teamRoutes.delete("/:id/bookmarks/:bookmarkId", async (c) => {
  const db = c.env.DB
  const userId = getUserId(c)
  const teamId = c.req.param("id")
  const bookmarkId = c.req.param("bookmarkId")

  try {
    // 检查用户权限
    const { settings, role } = await checkTeamPermission(db, teamId, userId)

    // 检查是否允许成员编辑
    if (role === "member" && !settings.allowMemberEdit) {
      throw new HTTPException(403, { message: "普通成员无权删除团队书签" })
    }

    // 检查书签是否存在
    const existingBookmark = await db
      .prepare("SELECT id FROM bookmarks WHERE id = ? AND team_id = ?")
      .bind(bookmarkId, teamId)
      .first()

    if (!existingBookmark) {
      throw new HTTPException(404, { message: "团队书签不存在" })
    }

    // 删除书签
    const result = await db
      .prepare("DELETE FROM bookmarks WHERE id = ? AND team_id = ?")
      .bind(bookmarkId, teamId)
      .run()

    return c.json({
      success: true,
      message: "删除团队书签成功",
      affected: result.meta.changes,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    if (error instanceof HTTPException) throw error
    console.error("删除团队书签失败:", error)
    throw new HTTPException(500, { message: "删除团队书签失败" })
  }
})
