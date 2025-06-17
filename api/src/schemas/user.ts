import { z } from "zod"

// 用户注册 schema
export const RegisterUserSchema = z.object({
  username: z
    .string()
    .min(3, "用户名至少3个字符")
    .max(20, "用户名最多20个字符")
    .regex(/^[a-zA-Z0-9_]+$/, "用户名只能包含字母、数字和下划线"),
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(8, "密码至少8个字符").max(128, "密码最多128个字符"),
  receiveOfficialMessages: z.boolean().optional().default(true)
})

// 用户登录 schema
export const LoginUserSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(1, "密码不能为空")
})

// 用户设置 schema
export const UserSettingsSchema = z.object({
  theme: z.enum(["blue", "purple", "green", "orange", "pink"]).default("blue"),
  language: z.enum(["zh-CN", "zh-TW", "en", "ja", "ko", "ru"]).default("zh-CN"),
  fontSize: z.enum(["small", "medium", "large"]).default("medium")
})

// 更新用户设置 schema（包含用户级别的设置）
export const UpdateUserSettingsSchema = UserSettingsSchema.partial().extend({
  receiveOfficialMessages: z.boolean().optional()
})

// 更新用户信息 schema
export const UpdateUserSchema = z.object({
  username: z
    .string()
    .min(3, "用户名至少3个字符")
    .max(20, "用户名最多20个字符")
    .regex(/^[a-zA-Z0-9_]+$/, "用户名只能包含字母、数字和下划线")
    .optional(),
  receiveOfficialMessages: z.boolean().optional()
})

// JWT payload schema
export const JwtPayloadSchema = z.object({
  userId: z.string(),
  email: z.string(),
  username: z.string(),
  isSponsored: z.boolean(),
  iat: z.number(),
  exp: z.number(),
  nbf: z.number().optional()
})

// 用户响应 schema（不包含密码）
export const UserResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  isSponsored: z.boolean(),
  receiveOfficialMessages: z.boolean(),
  settings: UserSettingsSchema,
  createdAt: z.string(),
  updatedAt: z.string()
})

// 类型导出
export type RegisterUser = z.infer<typeof RegisterUserSchema>
export type LoginUser = z.infer<typeof LoginUserSchema>
export type UserSettings = z.infer<typeof UserSettingsSchema>
export type UpdateUserSettings = z.infer<typeof UpdateUserSettingsSchema>
export type UpdateUser = z.infer<typeof UpdateUserSchema>
export type JwtPayload = z.infer<typeof JwtPayloadSchema>
export type UserResponse = z.infer<typeof UserResponseSchema>
