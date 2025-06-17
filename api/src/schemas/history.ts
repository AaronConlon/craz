import { z } from "zod"

// 基础历史记录 Schema
export const HistoryItemSchema = z.object({
  id: z.string(),
  url: z.string().url("无效的URL格式"),
  title: z.string().max(500, "标题过长"),
  visitTime: z.number().int().positive("访问时间必须是正整数"),
  visitCount: z.number().int().min(1, "访问次数至少为1").default(1),
  typedCount: z.number().int().min(0, "输入次数不能为负数").default(0),
  lastVisitTime: z.number().int().positive("最后访问时间必须是正整数"),
  userId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
})

// 创建历史记录 Schema
export const CreateHistoryItemSchema = z.object({
  url: z.string().url("无效的URL格式"),
  title: z.string().min(1, "标题不能为空").max(500, "标题过长"),
  visitTime: z
    .number()
    .int()
    .positive("访问时间必须是正整数")
    .optional()
    .default(() => Date.now()),
  visitCount: z.number().int().min(1, "访问次数至少为1").optional().default(1),
  typedCount: z
    .number()
    .int()
    .min(0, "输入次数不能为负数")
    .optional()
    .default(0)
})

// 更新历史记录 Schema
export const UpdateHistoryItemSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(500, "标题过长").optional(),
  visitCount: z.number().int().min(1, "访问次数至少为1").optional(),
  typedCount: z.number().int().min(0, "输入次数不能为负数").optional(),
  lastVisitTime: z
    .number()
    .int()
    .positive("最后访问时间必须是正整数")
    .optional()
})

// 查询历史记录 Schema
export const HistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1, "页码必须大于0").default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1, "每页大小必须大于0")
    .max(100, "每页最多100条")
    .default(20),
  search: z.string().max(200, "搜索关键词过长").optional(),
  startTime: z.coerce
    .number()
    .int()
    .positive("开始时间必须是正整数")
    .optional(),
  endTime: z.coerce.number().int().positive("结束时间必须是正整数").optional(),
  domain: z.string().max(100, "域名过长").optional(),
  sortBy: z
    .enum(["visitTime", "lastVisitTime", "visitCount", "title"])
    .default("visitTime"),
  sortOrder: z.enum(["asc", "desc"]).default("desc")
})

// 搜索历史记录 Schema
export const SearchHistorySchema = z.object({
  q: z.string().min(1, "搜索关键词不能为空").max(200, "搜索关键词过长"),
  startTime: z.coerce
    .number()
    .int()
    .positive("开始时间必须是正整数")
    .optional(),
  endTime: z.coerce.number().int().positive("结束时间必须是正整数").optional(),
  domain: z.string().max(100, "域名过长").optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1, "限制数量必须大于0")
    .max(100, "最多返回100条")
    .default(20)
})

// 批量创建历史记录 Schema
export const BatchCreateHistorySchema = z.object({
  items: z
    .array(CreateHistoryItemSchema)
    .min(1, "至少需要一条记录")
    .max(100, "最多批量创建100条记录")
})

// 批量更新历史记录 Schema
export const BatchUpdateHistorySchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        data: UpdateHistoryItemSchema
      })
    )
    .min(1, "至少需要一条记录")
    .max(100, "最多批量更新100条记录")
})

// 批量删除历史记录 Schema
export const BatchDeleteHistorySchema = z.object({
  ids: z
    .array(z.string())
    .min(1, "至少需要一个ID")
    .max(100, "最多批量删除100条记录")
})

// 时间范围删除 Schema
export const DeleteByTimeRangeSchema = z
  .object({
    startTime: z.number().int().positive("开始时间必须是正整数"),
    endTime: z.number().int().positive("结束时间必须是正整数"),
    domain: z.string().max(100, "域名过长").optional()
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "结束时间必须大于开始时间",
    path: ["endTime"]
  })

// 统计查询 Schema
export const HistoryStatsQuerySchema = z
  .object({
    startTime: z.coerce
      .number()
      .int()
      .positive("开始时间必须是正整数")
      .optional(),
    endTime: z.coerce
      .number()
      .int()
      .positive("结束时间必须是正整数")
      .optional(),
    domain: z.string().max(100, "域名过长").optional(),
    groupBy: z.enum(["day", "week", "month", "domain"]).default("day")
  })
  .refine(
    (data) => !data.startTime || !data.endTime || data.endTime > data.startTime,
    {
      message: "结束时间必须大于开始时间",
      path: ["endTime"]
    }
  )

// 热门网站查询 Schema
export const TopSitesQuerySchema = z.object({
  startTime: z.coerce
    .number()
    .int()
    .positive("开始时间必须是正整数")
    .optional(),
  endTime: z.coerce.number().int().positive("结束时间必须是正整数").optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1, "限制数量必须大于0")
    .max(50, "最多返回50个网站")
    .default(10),
  sortBy: z.enum(["visitCount", "lastVisitTime"]).default("visitCount")
})

// 导出类型
export type HistoryItem = z.infer<typeof HistoryItemSchema>
export type CreateHistoryItem = z.infer<typeof CreateHistoryItemSchema>
export type UpdateHistoryItem = z.infer<typeof UpdateHistoryItemSchema>
export type HistoryQuery = z.infer<typeof HistoryQuerySchema>
export type SearchHistory = z.infer<typeof SearchHistorySchema>
export type BatchCreateHistory = z.infer<typeof BatchCreateHistorySchema>
export type BatchUpdateHistory = z.infer<typeof BatchUpdateHistorySchema>
export type BatchDeleteHistory = z.infer<typeof BatchDeleteHistorySchema>
export type DeleteByTimeRange = z.infer<typeof DeleteByTimeRangeSchema>
export type HistoryStatsQuery = z.infer<typeof HistoryStatsQuerySchema>
export type TopSitesQuery = z.infer<typeof TopSitesQuerySchema>

// 响应数据 Schema (用于测试和验证)
export const HistoryResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z
    .union([
      HistoryItemSchema,
      z.array(HistoryItemSchema),
      z.object({
        items: z.array(HistoryItemSchema),
        pagination: z.object({
          total: z.number(),
          page: z.number(),
          pageSize: z.number(),
          hasNextPage: z.boolean()
        })
      })
    ])
    .optional(),
  timestamp: z.string()
})

// 统计响应 Schema
export const HistoryStatsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    totalVisits: z.number(),
    uniqueUrls: z.number(),
    topDomains: z.array(
      z.object({
        domain: z.string(),
        visitCount: z.number(),
        lastVisit: z.number()
      })
    ),
    dailyStats: z
      .array(
        z.object({
          date: z.string(),
          visitCount: z.number(),
          uniqueUrls: z.number()
        })
      )
      .optional(),
    weeklyStats: z
      .array(
        z.object({
          week: z.string(),
          visitCount: z.number(),
          uniqueUrls: z.number()
        })
      )
      .optional(),
    monthlyStats: z
      .array(
        z.object({
          month: z.string(),
          visitCount: z.number(),
          uniqueUrls: z.number()
        })
      )
      .optional()
  }),
  timestamp: z.string()
})
