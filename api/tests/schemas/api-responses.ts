import { z } from "zod"

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
