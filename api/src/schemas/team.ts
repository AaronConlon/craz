import { z } from "zod"

// 团队设置 schema
export const TeamSettingsSchema = z.object({
  allowMemberEdit: z.boolean().default(true),
  allowMemberInvite: z.boolean().default(true)
})

// 团队成员角色枚举
export const TeamRoleSchema = z.enum(["owner", "admin", "member"])

// 团队 schema
export const TeamSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "团队名称不能为空").max(50, "团队名称过长"),
  description: z.string().max(200, "团队描述过长").optional(),
  ownerId: z.string(),
  settings: TeamSettingsSchema,
  createdAt: z.string(),
  updatedAt: z.string()
})

// 团队成员 schema
export const TeamMemberSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  userId: z.string(),
  username: z.string().optional(), // 用于响应时包含用户名
  email: z.string().email().optional(), // 用于响应时包含邮箱
  role: TeamRoleSchema,
  joinedAt: z.string()
})

// 创建团队请求 schema
export const CreateTeamSchema = z.object({
  name: z.string().min(1, "团队名称不能为空").max(50, "团队名称过长"),
  description: z.string().max(200, "团队描述过长").optional(),
  settings: TeamSettingsSchema.optional().default({
    allowMemberEdit: true,
    allowMemberInvite: true
  })
})

// 更新团队请求 schema
export const UpdateTeamSchema = z.object({
  name: z
    .string()
    .min(1, "团队名称不能为空")
    .max(50, "团队名称过长")
    .optional(),
  description: z.string().max(200, "团队描述过长").optional(),
  settings: TeamSettingsSchema.optional()
})

// 邀请成员请求 schema
export const InviteMemberSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  role: TeamRoleSchema.default("member")
})

// 更新成员角色请求 schema
export const UpdateMemberRoleSchema = z.object({
  role: TeamRoleSchema
})

// 团队查询参数 schema
export const TeamQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  pageSize: z.coerce.number().min(1).max(50).optional().default(20),
  search: z.string().optional()
})

// 类型导出
export type Team = z.infer<typeof TeamSchema>
export type TeamMember = z.infer<typeof TeamMemberSchema>
export type TeamSettings = z.infer<typeof TeamSettingsSchema>
export type TeamRole = z.infer<typeof TeamRoleSchema>
export type CreateTeamRequest = z.infer<typeof CreateTeamSchema>
export type UpdateTeamRequest = z.infer<typeof UpdateTeamSchema>
export type InviteMemberRequest = z.infer<typeof InviteMemberSchema>
export type UpdateMemberRoleRequest = z.infer<typeof UpdateMemberRoleSchema>
export type TeamQuery = z.infer<typeof TeamQuerySchema>
