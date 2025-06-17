import { z } from "zod";





// 基础响应结构
export const BaseResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  timestamp: z.string().optional()
})

export const ErrorResponseSchema = BaseResponseSchema.extend({
  success: z.literal(false),
  status: z.number(),
  details: z.any().optional()
})

// 健康检查响应
export const HealthResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  version: z.string().optional(),
  environment: z.string().optional()
})

// 用户相关 schemas
export const UserSettingsSchema = z.object({
  theme: z.enum(["blue", "green", "purple", "orange", "pink"]),
  language: z.enum(["zh-CN", "zh-TW", "en", "ja", "ko", "ru"]),
  fontSize: z.enum(["small", "medium", "large"])
})

export const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email(),
  isSponsored: z.boolean(),
  receiveOfficialMessages: z.boolean(),
  settings: UserSettingsSchema,
  createdAt: z.string(),
  updatedAt: z.string()
})

// 认证响应 schemas
export const AuthDataSchema = z.object({
  user: UserSchema,
  token: z.string().regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/) // JWT 格式
})

export const AuthSuccessResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  data: AuthDataSchema
})

export const UserProfileResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    user: UserSchema
  })
})

// 可用性检查响应
export const AvailabilityResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  message: z.string(),
  data: z.object({
    available: z.boolean()
  })
})

// 设置更新响应（返回完整用户信息）
export const SettingsUpdateResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  data: UserSchema
})

// 注册请求 schema
export const RegisterRequestSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  receiveOfficialMessages: z.boolean().default(true)
})

// 登录请求 schema
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

// 书签相关的 schema
export const BookmarkSchema = z.object({
  id: z.string(),
  parentId: z.string().nullable(),
  index: z.number().optional(),
  title: z.string(),
  url: z.string().nullable(),
  dateAdded: z.number().optional(),
  dateGroupModified: z.number().optional(),
  unmodifiable: z.enum(["managed"]).optional(),
  children: z.array(z.lazy(() => BookmarkSchema)).optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(), // 添加metadata字段
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
})

export const BookmarkListResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  data: z.array(BookmarkSchema),
  pagination: z
    .object({
      total: z.number(),
      page: z.number(),
      pageSize: z.number(),
      hasNextPage: z.boolean()
    })
    .optional()
})

export const BookmarkResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  data: BookmarkSchema
})

export const BookmarkCreateResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  id: z.union([z.string(), z.number()])
})

export const BookmarkUpdateResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  affected: z.number()
})

export const BookmarkExistsResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  data: z.object({
    exists: z.boolean()
  })
})

export const BookmarkSearchResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  data: z.array(BookmarkSchema),
  query: z.string(),
  total: z.number()
})

export const BookmarkTagsResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  data: z.array(z.string())
})

export const CreateBookmarkRequestSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().nullable(),
  parentId: z.string().nullable(),
  sortOrder: z.number(),
  metadata: z.record(z.any()).optional()
})

export const UpdateBookmarkRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  url: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  metadata: z.record(z.any()).optional()
})

// 导出类型
export type BaseResponse = z.infer<typeof BaseResponseSchema>
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>
export type HealthResponse = z.infer<typeof HealthResponseSchema>
export type UserSettings = z.infer<typeof UserSettingsSchema>
export type User = z.infer<typeof UserSchema>
export type AuthData = z.infer<typeof AuthDataSchema>
export type AuthSuccessResponse = z.infer<typeof AuthSuccessResponseSchema>
export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>
export type AvailabilityResponse = z.infer<typeof AvailabilityResponseSchema>
export type SettingsUpdateResponse = z.infer<
  typeof SettingsUpdateResponseSchema
>
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>
export type LoginRequest = z.infer<typeof LoginRequestSchema>
export type Bookmark = z.infer<typeof BookmarkSchema>
export type BookmarkListResponse = z.infer<typeof BookmarkListResponseSchema>
export type BookmarkResponse = z.infer<typeof BookmarkResponseSchema>
export type BookmarkCreateResponse = z.infer<
  typeof BookmarkCreateResponseSchema
>
export type BookmarkUpdateResponse = z.infer<
  typeof BookmarkUpdateResponseSchema
>
export type BookmarkExistsResponse = z.infer<
  typeof BookmarkExistsResponseSchema
>
export type BookmarkSearchResponse = z.infer<
  typeof BookmarkSearchResponseSchema
>
export type BookmarkTagsResponse = z.infer<typeof BookmarkTagsResponseSchema>
export type CreateBookmarkRequest = z.infer<typeof CreateBookmarkRequestSchema>
export type UpdateBookmarkRequest = z.infer<typeof UpdateBookmarkRequestSchema>

// 团队相关 schemas
export const TeamSettingsSchema = z.object({
  allowMemberEdit: z.boolean(),
  allowMemberInvite: z.boolean()
})

export const TeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  ownerId: z.string(),
  settings: TeamSettingsSchema,
  createdAt: z.string(),
  updatedAt: z.string()
})

export const TeamMemberSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  userId: z.string(),
  username: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(["owner", "admin", "member"]),
  joinedAt: z.string()
})

export const TeamListResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  data: z.array(TeamSchema),
  pagination: z
    .object({
      total: z.number(),
      page: z.number(),
      pageSize: z.number(),
      hasNextPage: z.boolean()
    })
    .optional()
})

export const TeamResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  data: TeamSchema
})

export const TeamCreateResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  data: z.object({
    id: z.string(),
    team: TeamSchema
  })
})

export const TeamUpdateResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  affected: z.number()
})

export const TeamMemberListResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  data: z.array(TeamMemberSchema),
  pagination: z
    .object({
      total: z.number(),
      page: z.number(),
      pageSize: z.number(),
      hasNextPage: z.boolean()
    })
    .optional()
})

export const TeamMemberResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  data: TeamMemberSchema
})

export const CreateTeamRequestSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  settings: TeamSettingsSchema.optional()
})

export const UpdateTeamRequestSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).optional(),
  settings: TeamSettingsSchema.optional()
})

export const InviteMemberRequestSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).default("member")
})

export const UpdateMemberRoleRequestSchema = z.object({
  role: z.enum(["admin", "member"])
})

// 团队书签响应schema
export const TeamBookmarkResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  data: z.object({
    id: z.string()
  })
})

export const TeamBookmarkUpdateResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  affected: z.number()
})

export const TeamBookmarkListResponseSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  data: z.array(BookmarkSchema),
  pagination: z
    .object({
      total: z.number(),
      page: z.number(),
      pageSize: z.number(),
      hasNextPage: z.boolean()
    })
    .optional()
})

// 团队相关类型导出
export type TeamSettings = z.infer<typeof TeamSettingsSchema>
export type Team = z.infer<typeof TeamSchema>
export type TeamMember = z.infer<typeof TeamMemberSchema>
export type TeamListResponse = z.infer<typeof TeamListResponseSchema>
export type TeamResponse = z.infer<typeof TeamResponseSchema>
export type TeamCreateResponse = z.infer<typeof TeamCreateResponseSchema>
export type TeamUpdateResponse = z.infer<typeof TeamUpdateResponseSchema>
export type TeamMemberListResponse = z.infer<
  typeof TeamMemberListResponseSchema
>
export type TeamMemberResponse = z.infer<typeof TeamMemberResponseSchema>
export type CreateTeamRequest = z.infer<typeof CreateTeamRequestSchema>
export type UpdateTeamRequest = z.infer<typeof UpdateTeamRequestSchema>
export type InviteMemberRequest = z.infer<typeof InviteMemberRequestSchema>
export type UpdateMemberRoleRequest = z.infer<
  typeof UpdateMemberRoleRequestSchema
>
export type TeamBookmarkResponse = z.infer<typeof TeamBookmarkResponseSchema>
export type TeamBookmarkUpdateResponse = z.infer<
  typeof TeamBookmarkUpdateResponseSchema
>
export type TeamBookmarkListResponse = z.infer<
  typeof TeamBookmarkListResponseSchema
>