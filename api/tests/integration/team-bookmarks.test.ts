import { beforeEach, describe, expect, test } from "vitest"

import {
  AuthSuccessResponseSchema,
  CreateBookmarkRequestSchema,
  TeamBookmarkListResponseSchema,
  TeamBookmarkResponseSchema,
  TeamBookmarkUpdateResponseSchema,
  TeamCreateResponseSchema,
  TeamMemberListResponseSchema,
  TeamMemberResponseSchema
} from "../schemas/api-responses"
import { MainApiClient, ResponseValidator } from "../utils/api-client"

describe("团队书签接口测试", () => {
  const client = new MainApiClient()
  let authToken: string
  let memberToken: string
  let testUser: any
  let memberUser: any
  let teamId: string

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
      description: `团队书签测试团队`,
      settings: {
        allowMemberEdit: true,
        allowMemberInvite: true
      }
    }
  }

  // 生成测试书签数据
  const generateTestBookmark = () => {
    const timestamp = Date.now()
    return {
      title: `测试书签 ${timestamp}`,
      url: `https://example.com/test-${timestamp}`,
      parentId: null,
      sortOrder: timestamp,
      metadata: {
        tags: ["测试", "团队"],
        description: "这是一个测试书签"
      }
    }
  }

  // 在每个测试前准备环境
  beforeEach(async () => {
    // 注册并登录团队所有者
    testUser = generateTestUser()
    const registerResponse = await client.auth.register(testUser)
    const registerData = await ResponseValidator.validate(
      registerResponse,
      201,
      AuthSuccessResponseSchema
    )
    authToken = registerData.data.token

    // 注册团队成员
    memberUser = generateTestUser()
    const memberRegisterResponse = await client.auth.register(memberUser)
    const memberRegisterData = await ResponseValidator.validate(
      memberRegisterResponse,
      201,
      AuthSuccessResponseSchema
    )
    memberToken = memberRegisterData.data.token

    // 创建测试团队
    const testTeam = generateTestTeam()
    const createTeamResponse = await client.teams.createTeam(
      authToken,
      testTeam
    )
    const createTeamData = await ResponseValidator.validate(
      createTeamResponse,
      200,
      TeamCreateResponseSchema
    )
    teamId = createTeamData.data.id

    // 邀请成员加入团队
    await client.teams.inviteMember(authToken, teamId, {
      email: memberUser.email,
      role: "member"
    })
  })

  describe("团队书签基础操作", () => {
    test("成功创建团队书签", async () => {
      const testBookmark = generateTestBookmark()

      // 验证请求数据格式
      const validatedRequest = CreateBookmarkRequestSchema.parse(testBookmark)
      expect(validatedRequest).toBeDefined()

      const response = await client.teams.createTeamBookmark(
        authToken,
        teamId,
        testBookmark
      )

      const data = await ResponseValidator.validate(
        response,
        200,
        TeamBookmarkResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.data.id).toBeDefined()
    })

    test("团队成员可以创建书签", async () => {
      const testBookmark = generateTestBookmark()

      const response = await client.teams.createTeamBookmark(
        memberToken,
        teamId,
        testBookmark
      )

      const data = await ResponseValidator.validate(
        response,
        200,
        TeamBookmarkResponseSchema
      )

      expect(data.success).toBe(true)
    })

    test("拒绝无效的书签数据", async () => {
      const invalidBookmark = {
        title: "", // 空标题
        url: "invalid-url", // 无效URL
        parentId: null,
        sortOrder: 0
      }

      const response = await client.teams.createTeamBookmark(
        authToken,
        teamId,
        invalidBookmark
      )

      await ResponseValidator.validateError(response, 400)
    })

    test("成功获取团队书签列表", async () => {
      // 先创建几个测试书签
      const testBookmarksData = [
        generateTestBookmark(),
        generateTestBookmark(),
        generateTestBookmark()
      ]

      for (const bookmark of testBookmarksData) {
        await client.teams.createTeamBookmark(authToken, teamId, bookmark)
      }

      const response = await client.teams.getTeamBookmarks(authToken, teamId)

      const data = await ResponseValidator.validate(
        response,
        200,
        TeamBookmarkListResponseSchema
      )

      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data.length).toBeGreaterThanOrEqual(3)
    })

    test("支持分页查询团队书签", async () => {
      // 创建足够多的书签以测试分页
      const testBookmarksData = Array.from({ length: 15 }, () =>
        generateTestBookmark()
      )

      for (const bookmark of testBookmarksData) {
        await client.teams.createTeamBookmark(authToken, teamId, bookmark)
      }

      // 测试第一页
      const firstPageResponse = await client.teams.getTeamBookmarks(
        authToken,
        teamId,
        { page: 1, pageSize: 10 }
      )

      const firstPageData = await ResponseValidator.validate(
        firstPageResponse,
        200,
        TeamBookmarkListResponseSchema
      )

      expect(firstPageData.data.length).toBeLessThanOrEqual(10)
      if (firstPageData.pagination) {
        expect(firstPageData.pagination.page).toBe(1)
        expect(firstPageData.pagination.pageSize).toBe(10)
      }

      // 测试第二页
      const secondPageResponse = await client.teams.getTeamBookmarks(
        authToken,
        teamId,
        { page: 2, pageSize: 10 }
      )

      const secondPageData = await ResponseValidator.validate(
        secondPageResponse,
        200,
        TeamBookmarkListResponseSchema
      )

      expect(secondPageData.data.length).toBeGreaterThan(0)
      if (secondPageData.pagination) {
        expect(secondPageData.pagination.page).toBe(2)
      }
    })
  })

  describe("团队书签更新和删除", () => {
    let createdBookmarkId: string

    beforeEach(async () => {
      // 创建一个测试书签用于后续测试
      const testBookmark = generateTestBookmark()
      const createResponse = await client.teams.createTeamBookmark(
        authToken,
        teamId,
        testBookmark
      )
      const createData = await ResponseValidator.validate(
        createResponse,
        200,
        TeamBookmarkResponseSchema
      )
      createdBookmarkId = createData.data.id
    })

    test("成功更新团队书签", async () => {
      const updateData = {
        title: "更新后的书签标题",
        metadata: {
          tags: ["更新", "测试"],
          description: "更新后的描述"
        }
      }

      const response = await client.teams.updateTeamBookmark(
        authToken,
        teamId,
        createdBookmarkId,
        updateData
      )

      const data = await ResponseValidator.validate(
        response,
        200,
        TeamBookmarkUpdateResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.affected).toBeGreaterThan(0)
    })

    test("团队成员可以更新书签", async () => {
      const updateData = {
        title: "成员更新的书签标题"
      }

      const response = await client.teams.updateTeamBookmark(
        memberToken,
        teamId,
        createdBookmarkId,
        updateData
      )

      const data = await ResponseValidator.validate(
        response,
        200,
        TeamBookmarkUpdateResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.affected).toBeGreaterThan(0)
    })

    test("拒绝无效的更新数据", async () => {
      const invalidUpdateData = {
        title: "", // 空标题
        url: "invalid-url" // 无效URL
      }

      const response = await client.teams.updateTeamBookmark(
        authToken,
        teamId,
        createdBookmarkId,
        invalidUpdateData
      )

      await ResponseValidator.validateError(response, 400)
    })

    test("成功删除团队书签", async () => {
      const response = await client.teams.deleteTeamBookmark(
        authToken,
        teamId,
        createdBookmarkId
      )

      const data = await ResponseValidator.validate(
        response,
        200,
        TeamBookmarkUpdateResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.affected).toBeGreaterThan(0)
    })

    test("团队成员可以删除书签", async () => {
      const response = await client.teams.deleteTeamBookmark(
        memberToken,
        teamId,
        createdBookmarkId
      )

      const data = await ResponseValidator.validate(
        response,
        200,
        TeamBookmarkUpdateResponseSchema
      )

      expect(data.success).toBe(true)
      expect(data.affected).toBeGreaterThan(0)
    })

    test("删除不存在的书签", async () => {
      const response = await client.teams.deleteTeamBookmark(
        authToken,
        teamId,
        "nonexistent-id"
      )

      // 删除不存在的书签应该返回404
      await ResponseValidator.validateError(response, 404, "团队书签不存在")
    })
  })

  describe("团队书签权限控制", () => {
    test("非团队成员无法访问团队书签", async () => {
      // 创建另一个用户，不加入团队
      const outsiderUser = generateTestUser()
      const outsiderRegisterResponse = await client.auth.register(outsiderUser)
      const outsiderRegisterData = await ResponseValidator.validate(
        outsiderRegisterResponse,
        201,
        AuthSuccessResponseSchema
      )
      const outsiderToken = outsiderRegisterData.data.token

      const response = await client.teams.getTeamBookmarks(
        outsiderToken,
        teamId
      )

      await ResponseValidator.validateError(response, 403, "您不是该团队的成员")
    })

    test("非团队成员无法创建团队书签", async () => {
      // 创建另一个用户，不加入团队
      const outsiderUser = generateTestUser()
      const outsiderRegisterResponse = await client.auth.register(outsiderUser)
      const outsiderRegisterData = await ResponseValidator.validate(
        outsiderRegisterResponse,
        201,
        AuthSuccessResponseSchema
      )
      const outsiderToken = outsiderRegisterData.data.token

      const testBookmark = generateTestBookmark()
      const response = await client.teams.createTeamBookmark(
        outsiderToken,
        teamId,
        testBookmark
      )

      await ResponseValidator.validateError(response, 403, "您不是该团队的成员")
    })

    test("当禁用成员编辑时，普通成员无法创建书签", async () => {
      // 更新团队设置，禁用成员编辑
      await client.teams.updateTeam(authToken, teamId, {
        settings: {
          allowMemberEdit: false,
          allowMemberInvite: true
        }
      })

      const testBookmark = generateTestBookmark()
      const response = await client.teams.createTeamBookmark(
        memberToken,
        teamId,
        testBookmark
      )

      await ResponseValidator.validateError(
        response,
        403,
        "普通成员无权创建团队书签"
      )
    })

    test("当禁用成员编辑时，普通成员无法更新书签", async () => {
      // 先创建一个书签
      const testBookmark = generateTestBookmark()
      const createResponse = await client.teams.createTeamBookmark(
        authToken,
        teamId,
        testBookmark
      )
      const createData = await ResponseValidator.validate(
        createResponse,
        200,
        TeamBookmarkResponseSchema
      )
      const bookmarkId = createData.data.id

      // 更新团队设置，禁用成员编辑
      await client.teams.updateTeam(authToken, teamId, {
        settings: {
          allowMemberEdit: false,
          allowMemberInvite: true
        }
      })

      const updateData = {
        title: "尝试更新的标题"
      }

      const response = await client.teams.updateTeamBookmark(
        memberToken,
        teamId,
        bookmarkId,
        updateData
      )

      await ResponseValidator.validateError(
        response,
        403,
        "普通成员无权更新团队书签"
      )
    })

    test("当禁用成员编辑时，普通成员无法删除书签", async () => {
      // 先创建一个书签
      const testBookmark = generateTestBookmark()
      const createResponse = await client.teams.createTeamBookmark(
        authToken,
        teamId,
        testBookmark
      )
      const createData = await ResponseValidator.validate(
        createResponse,
        200,
        TeamBookmarkResponseSchema
      )
      const bookmarkId = createData.data.id

      // 更新团队设置，禁用成员编辑
      await client.teams.updateTeam(authToken, teamId, {
        settings: {
          allowMemberEdit: false,
          allowMemberInvite: true
        }
      })

      const response = await client.teams.deleteTeamBookmark(
        memberToken,
        teamId,
        bookmarkId
      )

      await ResponseValidator.validateError(
        response,
        403,
        "普通成员无权删除团队书签"
      )
    })

    test("团队管理员始终可以管理书签", async () => {
      // 将成员提升为管理员
      const membersResponse = await client.teams.getTeamMembers(
        authToken,
        teamId
      )
      const membersData = await ResponseValidator.validate(
        membersResponse,
        200,
        TeamMemberListResponseSchema
      )

      const member = membersData.data.find((m) => m.email === memberUser.email)
      expect(member).toBeDefined()

      await client.teams.updateMemberRole(authToken, teamId, member!.id, {
        role: "admin"
      })

      // 更新团队设置，禁用成员编辑
      await client.teams.updateTeam(authToken, teamId, {
        settings: {
          allowMemberEdit: false,
          allowMemberInvite: true
        }
      })

      // 管理员应该仍然可以创建书签
      const testBookmark = generateTestBookmark()
      const response = await client.teams.createTeamBookmark(
        memberToken,
        teamId,
        testBookmark
      )

      const data = await ResponseValidator.validate(
        response,
        200,
        TeamBookmarkResponseSchema
      )

      expect(data.success).toBe(true)
    })
  })

  describe("认证和权限验证", () => {
    test("拒绝无效的认证令牌", async () => {
      const response = await client.teams.getTeamBookmarks(
        "invalid-token",
        teamId
      )

      await ResponseValidator.validateError(response, 401)
    })

    test("拒绝缺失的认证令牌", async () => {
      const response = await client.teams.getTeamBookmarks("", teamId)

      await ResponseValidator.validateError(response, 401)
    })

    test("拒绝访问不存在的团队", async () => {
      const response = await client.teams.getTeamBookmarks(
        authToken,
        "nonexistent-team-id"
      )

      await ResponseValidator.validateError(response, 403)
    })
  })

  describe("数据验证", () => {
    test("拒绝过长的书签标题", async () => {
      const longTitle = "a".repeat(201) // 超过200字符限制
      const bookmark = {
        ...generateTestBookmark(),
        title: longTitle
      }

      const response = await client.teams.createTeamBookmark(
        authToken,
        teamId,
        bookmark
      )

      await ResponseValidator.validateError(response, 400)
    })

    test("拒绝过长的书签描述", async () => {
      const longDescription = "a".repeat(1001) // 超过1000字符限制
      const bookmark = {
        ...generateTestBookmark(),
        description: longDescription
      }

      const response = await client.teams.createTeamBookmark(
        authToken,
        teamId,
        bookmark
      )

      await ResponseValidator.validateError(response, 400)
    })

    test("拒绝无效的URL格式", async () => {
      const bookmark = {
        ...generateTestBookmark(),
        url: "invalid-url-format"
      }

      const response = await client.teams.createTeamBookmark(
        authToken,
        teamId,
        bookmark
      )

      await ResponseValidator.validateError(response, 400)
    })
  })
})
