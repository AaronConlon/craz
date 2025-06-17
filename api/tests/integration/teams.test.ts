import { beforeEach, describe, expect, test } from "vitest"

import {
  AuthSuccessResponseSchema,
  CreateTeamRequestSchema,
  InviteMemberRequestSchema,
  TeamCreateResponseSchema,
  TeamListResponseSchema,
  TeamMemberListResponseSchema,
  TeamMemberResponseSchema,
  TeamResponseSchema,
  TeamUpdateResponseSchema,
  UpdateMemberRoleRequestSchema,
  UpdateTeamRequestSchema
} from "../schemas/api-responses"
import { MainApiClient, ResponseValidator } from "../utils/api-client"

describe("团队接口测试", () => {
  const client = new MainApiClient()
  let authToken: string
  let secondUserToken: string
  let testUser: any
  let secondUser: any

  // 生成测试用户数据
  const generateTestUser = () => {
    const timestamp = Date.now()
    const shortTimestamp = timestamp.toString().slice(-8) // 只取最后8位
    return {
      username: `test_${shortTimestamp}`,
      email: `test_${timestamp}@example.com`,
      password: "testpassword123",
      receiveOfficialMessages: true
    }
  }

  // 生成测试团队数据
  const generateTestTeam = () => {
    const timestamp = Date.now()
    return {
      name: `测试团队 ${timestamp}`,
      description: `这是一个测试团队，创建于 ${new Date().toISOString()}`,
      settings: {
        allowMemberEdit: true,
        allowMemberInvite: true
      }
    }
  }

  // 在每个测试前准备认证用户
  beforeEach(async () => {
    // 注册并登录第一个用户
    testUser = generateTestUser()
    const registerResponse = await client.auth.register(testUser)
    const registerData = await ResponseValidator.validate(
      registerResponse,
      201,
      AuthSuccessResponseSchema
    )
    authToken = registerData.data.token

    // 注册第二个用户用于团队成员测试
    secondUser = generateTestUser()
    const secondRegisterResponse = await client.auth.register(secondUser)
    const secondRegisterData = await ResponseValidator.validate(
      secondRegisterResponse,
      201,
      AuthSuccessResponseSchema
    )
    secondUserToken = secondRegisterData.data.token
  })

  describe("团队基础操作", () => {
    test("成功创建团队", async () => {
      const testTeam = generateTestTeam()

      // 验证请求数据格式
      const validatedRequest = CreateTeamRequestSchema.parse(testTeam)
      expect(validatedRequest).toBeDefined()

      const response = await client.teams.createTeam(authToken, testTeam)

      const data = await ResponseValidator.validate(
        response,
        200,
        TeamCreateResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.data.id).toBeDefined()
      expect(data.data.team.name).toBe(testTeam.name)
      expect(data.data.team.description).toBe(testTeam.description)
      expect(data.data.team.settings).toEqual(testTeam.settings)
    })

    test("拒绝无效的团队数据", async () => {
      const invalidTeam = {
        name: "", // 空名称
        description: "a".repeat(201) // 描述过长
      }

      const response = await client.teams.createTeam(authToken, invalidTeam)

      await ResponseValidator.validateError(response, 400)
    })

    test("成功获取团队列表", async () => {
      // 先创建几个测试团队
      const testTeams = [
        generateTestTeam(),
        generateTestTeam(),
        generateTestTeam()
      ]

      for (const team of testTeams) {
        await client.teams.createTeam(authToken, team)
      }

      const response = await client.teams.getTeams(authToken)

      const data = await ResponseValidator.validate(
        response,
        200,
        TeamListResponseSchema
      )

      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data.length).toBeGreaterThanOrEqual(3)

      // 验证分页信息
      if (data.pagination) {
        expect(data.pagination.total).toBeGreaterThanOrEqual(3)
        expect(data.pagination.page).toBe(1)
        expect(data.pagination.pageSize).toBeGreaterThan(0)
        expect(typeof data.pagination.hasNextPage).toBe("boolean")
      }
    })

    test("支持分页查询团队", async () => {
      // 创建足够多的团队以测试分页
      const testTeams = Array.from({ length: 15 }, () => generateTestTeam())

      for (const team of testTeams) {
        await client.teams.createTeam(authToken, team)
      }

      // 测试第一页
      const firstPageResponse = await client.teams.getTeams(authToken, {
        page: 1,
        pageSize: 10
      })

      const firstPageData = await ResponseValidator.validate(
        firstPageResponse,
        200,
        TeamListResponseSchema
      )

      expect(firstPageData.data.length).toBeLessThanOrEqual(10)
      expect(firstPageData.pagination?.page).toBe(1)
      expect(firstPageData.pagination?.pageSize).toBe(10)

      // 测试第二页
      const secondPageResponse = await client.teams.getTeams(authToken, {
        page: 2,
        pageSize: 10
      })

      const secondPageData = await ResponseValidator.validate(
        secondPageResponse,
        200,
        TeamListResponseSchema
      )

      expect(secondPageData.data.length).toBeGreaterThan(0)
      expect(secondPageData.pagination?.page).toBe(2)
    })
  })

  describe("团队信息管理", () => {
    let createdTeamId: string

    beforeEach(async () => {
      // 创建一个测试团队用于后续测试
      const testTeam = generateTestTeam()
      const createResponse = await client.teams.createTeam(authToken, testTeam)
      const createData = await ResponseValidator.validate(
        createResponse,
        200,
        TeamCreateResponseSchema
      )
      createdTeamId = createData.data.id
    })

    test("成功获取单个团队信息", async () => {
      const response = await client.teams.getTeam(authToken, createdTeamId)

      const data = await ResponseValidator.validate(
        response,
        200,
        TeamResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.data.id).toBe(createdTeamId)
      expect(data.data.name).toBeDefined()
      expect(data.data.ownerId).toBeDefined()
    })

    test("获取不存在的团队返回404", async () => {
      const response = await client.teams.getTeam(authToken, "nonexistent-id")

      await ResponseValidator.validateError(response, 404, "团队不存在")
    })

    test("成功更新团队信息", async () => {
      const updateData = {
        name: "更新后的团队名称",
        description: "更新后的团队描述",
        settings: {
          allowMemberEdit: false,
          allowMemberInvite: false
        }
      }

      // 验证更新请求数据格式
      const validatedUpdate = UpdateTeamRequestSchema.parse(updateData)
      expect(validatedUpdate).toBeDefined()

      const response = await client.teams.updateTeam(
        authToken,
        createdTeamId,
        updateData
      )

      const data = await ResponseValidator.validate(
        response,
        200,
        TeamUpdateResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.affected).toBeGreaterThan(0)

      // 验证更新后的数据
      const getResponse = await client.teams.getTeam(authToken, createdTeamId)
      const getResponseData = await ResponseValidator.validate(
        getResponse,
        200,
        TeamResponseSchema
      )

      expect(getResponseData.data.name).toBe(updateData.name)
      expect(getResponseData.data.description).toBe(updateData.description)
      expect(getResponseData.data.settings).toEqual(updateData.settings)
    })

    test("拒绝无效的更新数据", async () => {
      const invalidUpdateData = {
        name: "", // 空名称
        description: "a".repeat(201) // 描述过长
      }

      const response = await client.teams.updateTeam(
        authToken,
        createdTeamId,
        invalidUpdateData
      )

      await ResponseValidator.validateError(response, 400)
    })

    test("成功删除团队", async () => {
      const response = await client.teams.deleteTeam(authToken, createdTeamId)

      const data = await ResponseValidator.validate(
        response,
        200,
        TeamUpdateResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.affected).toBeGreaterThan(0)

      // 验证团队已被删除
      const getResponse = await client.teams.getTeam(authToken, createdTeamId)
      await ResponseValidator.validateError(getResponse, 404)
    })

    test("删除不存在的团队", async () => {
      const response = await client.teams.deleteTeam(
        authToken,
        "nonexistent-id"
      )

      await ResponseValidator.validateError(response, 404)
    })
  })

  describe("团队成员管理", () => {
    let createdTeamId: string

    beforeEach(async () => {
      // 创建一个测试团队用于成员管理测试
      const testTeam = generateTestTeam()
      const createResponse = await client.teams.createTeam(authToken, testTeam)
      const createData = await ResponseValidator.validate(
        createResponse,
        200,
        TeamCreateResponseSchema
      )
      createdTeamId = createData.data.id
    })

    test("成功获取团队成员列表", async () => {
      const response = await client.teams.getTeamMembers(
        authToken,
        createdTeamId
      )

      const data = await ResponseValidator.validate(
        response,
        200,
        TeamMemberListResponseSchema
      )

      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data.length).toBe(1) // 创建者自己
      expect(data.data[0].role).toBe("owner")
    })

    test("成功邀请成员加入团队", async () => {
      const inviteData = {
        email: secondUser.email,
        role: "member" as const
      }

      // 验证邀请请求数据格式
      const validatedInvite = InviteMemberRequestSchema.parse(inviteData)
      expect(validatedInvite).toBeDefined()

      const response = await client.teams.inviteMember(
        authToken,
        createdTeamId,
        inviteData
      )

      const data = await ResponseValidator.validate(
        response,
        200,
        TeamMemberResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.data.email).toBe(secondUser.email)
      expect(data.data.role).toBe("member")

      // 验证成员列表已更新
      const membersResponse = await client.teams.getTeamMembers(
        authToken,
        createdTeamId
      )
      const membersData = await ResponseValidator.validate(
        membersResponse,
        200,
        TeamMemberListResponseSchema
      )

      expect(membersData.data.length).toBe(2)
    })

    test("拒绝邀请不存在的用户", async () => {
      const inviteData = {
        email: "nonexistent@example.com",
        role: "member" as const
      }

      const response = await client.teams.inviteMember(
        authToken,
        createdTeamId,
        inviteData
      )

      await ResponseValidator.validateError(response, 404, "用户不存在")
    })

    test("拒绝重复邀请已存在的成员", async () => {
      // 先邀请一次
      const inviteData = {
        email: secondUser.email,
        role: "member" as const
      }

      await client.teams.inviteMember(authToken, createdTeamId, inviteData)

      // 尝试再次邀请
      const response = await client.teams.inviteMember(
        authToken,
        createdTeamId,
        inviteData
      )

      await ResponseValidator.validateError(response, 400, "用户已经是团队成员")
    })

    test("成功更新成员角色", async () => {
      // 先邀请成员
      const inviteData = {
        email: secondUser.email,
        role: "member" as const
      }

      const inviteResponse = await client.teams.inviteMember(
        authToken,
        createdTeamId,
        inviteData
      )
      const inviteResponseData = await ResponseValidator.validate(
        inviteResponse,
        200,
        TeamMemberResponseSchema
      )

      const memberId = inviteResponseData.data.id

      // 更新角色
      const updateRoleData = {
        role: "admin" as const
      }

      // 验证更新角色请求数据格式
      const validatedUpdateRole =
        UpdateMemberRoleRequestSchema.parse(updateRoleData)
      expect(validatedUpdateRole).toBeDefined()

      const response = await client.teams.updateMemberRole(
        authToken,
        createdTeamId,
        memberId,
        updateRoleData
      )

      const data = await ResponseValidator.validate(
        response,
        200,
        TeamUpdateResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.affected).toBeGreaterThan(0)
    })

    test("拒绝修改团队所有者的角色", async () => {
      // 获取团队成员列表找到所有者
      const membersResponse = await client.teams.getTeamMembers(
        authToken,
        createdTeamId
      )
      const membersData = await ResponseValidator.validate(
        membersResponse,
        200,
        TeamMemberListResponseSchema
      )

      const owner = membersData.data.find((member) => member.role === "owner")
      expect(owner).toBeDefined()

      const updateRoleData = {
        role: "admin" as const
      }

      const response = await client.teams.updateMemberRole(
        authToken,
        createdTeamId,
        owner!.id,
        updateRoleData
      )

      await ResponseValidator.validateError(
        response,
        400,
        "不能修改团队所有者的角色"
      )
    })

    test("成功移除团队成员", async () => {
      // 先邀请成员
      const inviteData = {
        email: secondUser.email,
        role: "member" as const
      }

      const inviteResponse = await client.teams.inviteMember(
        authToken,
        createdTeamId,
        inviteData
      )
      const inviteResponseData = await ResponseValidator.validate(
        inviteResponse,
        200,
        TeamMemberResponseSchema
      )

      const memberId = inviteResponseData.data.id

      // 移除成员
      const response = await client.teams.removeMember(
        authToken,
        createdTeamId,
        memberId
      )

      const data = await ResponseValidator.validate(
        response,
        200,
        TeamUpdateResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.affected).toBeGreaterThan(0)

      // 验证成员已被移除
      const membersResponse = await client.teams.getTeamMembers(
        authToken,
        createdTeamId
      )
      const membersData = await ResponseValidator.validate(
        membersResponse,
        200,
        TeamMemberListResponseSchema
      )

      expect(membersData.data.length).toBe(1) // 只剩下所有者
    })

    test("成员可以退出团队", async () => {
      // 先邀请第二个用户
      const inviteData = {
        email: secondUser.email,
        role: "member" as const
      }

      const inviteResponse = await client.teams.inviteMember(
        authToken,
        createdTeamId,
        inviteData
      )
      const inviteResponseData = await ResponseValidator.validate(
        inviteResponse,
        200,
        TeamMemberResponseSchema
      )

      const memberId = inviteResponseData.data.id

      // 第二个用户退出团队
      const response = await client.teams.removeMember(
        secondUserToken,
        createdTeamId,
        memberId
      )

      const data = await ResponseValidator.validate(
        response,
        200,
        TeamUpdateResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.message).toContain("退出团队成功")
    })

    test("拒绝移除团队所有者", async () => {
      // 获取团队成员列表找到所有者
      const membersResponse = await client.teams.getTeamMembers(
        authToken,
        createdTeamId
      )
      const membersData = await ResponseValidator.validate(
        membersResponse,
        200,
        TeamMemberListResponseSchema
      )

      const owner = membersData.data.find((member) => member.role === "owner")
      expect(owner).toBeDefined()

      const response = await client.teams.removeMember(
        authToken,
        createdTeamId,
        owner!.id
      )

      await ResponseValidator.validateError(response, 400, "不能移除团队所有者")
    })
  })

  describe("认证和权限控制", () => {
    test("拒绝无效的认证令牌", async () => {
      const response = await client.teams.getTeams("invalid-token")

      await ResponseValidator.validateError(response, 401)
    })

    test("拒绝缺失的认证令牌", async () => {
      const response = await client.teams.getTeams("")

      await ResponseValidator.validateError(response, 401)
    })

    test("非团队成员无法访问团队信息", async () => {
      // 第一个用户创建团队
      const testTeam = generateTestTeam()
      const createResponse = await client.teams.createTeam(authToken, testTeam)
      const createData = await ResponseValidator.validate(
        createResponse,
        200,
        TeamCreateResponseSchema
      )
      const teamId = createData.data.id

      // 第二个用户尝试访问团队信息
      const response = await client.teams.getTeam(secondUserToken, teamId)

      await ResponseValidator.validateError(response, 403, "您不是该团队的成员")
    })

    test("普通成员无法管理团队", async () => {
      // 创建团队并邀请第二个用户
      const testTeam = generateTestTeam()
      const createResponse = await client.teams.createTeam(authToken, testTeam)
      const createData = await ResponseValidator.validate(
        createResponse,
        200,
        TeamCreateResponseSchema
      )
      const teamId = createData.data.id

      await client.teams.inviteMember(authToken, teamId, {
        email: secondUser.email,
        role: "member"
      })

      // 第二个用户（普通成员）尝试更新团队信息
      const updateData = {
        name: "普通成员尝试更新"
      }

      const response = await client.teams.updateTeam(
        secondUserToken,
        teamId,
        updateData
      )

      await ResponseValidator.validateError(response, 403, "权限不足")
    })

    test("只有团队所有者可以删除团队", async () => {
      // 创建团队并邀请第二个用户为管理员
      const testTeam = generateTestTeam()
      const createResponse = await client.teams.createTeam(authToken, testTeam)
      const createData = await ResponseValidator.validate(
        createResponse,
        200,
        TeamCreateResponseSchema
      )
      const teamId = createData.data.id

      const inviteResponse = await client.teams.inviteMember(
        authToken,
        teamId,
        {
          email: secondUser.email,
          role: "admin"
        }
      )
      const inviteData = await ResponseValidator.validate(
        inviteResponse,
        200,
        TeamMemberResponseSchema
      )

      // 管理员尝试删除团队
      const response = await client.teams.deleteTeam(secondUserToken, teamId)

      await ResponseValidator.validateError(
        response,
        403,
        "只有团队所有者可以执行此操作"
      )
    })
  })

  describe("数据验证", () => {
    test("拒绝过长的团队名称", async () => {
      const longName = "a".repeat(51) // 超过50字符限制
      const team = {
        ...generateTestTeam(),
        name: longName
      }

      const response = await client.teams.createTeam(authToken, team)

      await ResponseValidator.validateError(response, 400)
    })

    test("拒绝过长的团队描述", async () => {
      const longDescription = "a".repeat(201) // 超过200字符限制
      const team = {
        ...generateTestTeam(),
        description: longDescription
      }

      const response = await client.teams.createTeam(authToken, team)

      await ResponseValidator.validateError(response, 400)
    })

    test("拒绝无效的邮箱格式", async () => {
      // 先创建团队
      const testTeam = generateTestTeam()
      const createResponse = await client.teams.createTeam(authToken, testTeam)
      const createData = await ResponseValidator.validate(
        createResponse,
        200,
        TeamCreateResponseSchema
      )
      const teamId = createData.data.id

      const invalidInvite = {
        email: "invalid-email-format",
        role: "member" as const
      }

      const response = await client.teams.inviteMember(
        authToken,
        teamId,
        invalidInvite
      )

      await ResponseValidator.validateError(response, 400)
    })
  })
})
