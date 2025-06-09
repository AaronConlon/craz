import { z } from "zod"

// Chrome BookmarkTreeNode 兼容的 schema
export const BookmarkSchema = z.object({
  id: z.string(),
  parentId: z.string().optional(),
  index: z.number().optional(),
  title: z.string().min(1, "标题不能为空"),
  url: z.string().url("URL 格式不正确").optional(),
  dateAdded: z.number().optional(),
  dateGroupModified: z.number().optional(),
  unmodifiable: z.enum(["managed"]).optional(),
  children: z.array(z.lazy(() => BookmarkSchema)).optional(),
  // 自定义扩展字段
  tags: z.array(z.string()).optional().default([]),
  description: z.string().optional().default(""),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
})

// 创建书签请求 schema
export const CreateBookmarkSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(200, "标题过长"),
  url: z.string().url("URL 格式不正确"),
  tags: z.array(z.string()).optional().default([]),
  description: z.string().max(1000, "描述过长").optional().default("")
})

// 更新书签请求 schema
export const UpdateBookmarkSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(200, "标题过长").optional(),
  url: z.string().url("URL 格式不正确").optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().max(1000, "描述过长").optional()
})

// 查询参数 schema
export const BookmarkQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  pageSize: z.coerce.number().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  tags: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(",").filter(Boolean) : []))
})

// 搜索查询 schema
export const SearchBookmarkSchema = z.object({
  q: z.string().min(1, "搜索关键词不能为空"),
  tags: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(",").filter(Boolean) : [])),
  limit: z.coerce.number().min(1).max(50).optional().default(10)
})

// 类型导出
export type Bookmark = z.infer<typeof BookmarkSchema>
export type CreateBookmarkRequest = z.infer<typeof CreateBookmarkSchema>
export type UpdateBookmarkRequest = z.infer<typeof UpdateBookmarkSchema>
export type BookmarkQuery = z.infer<typeof BookmarkQuerySchema>
export type SearchBookmarkRequest = z.infer<typeof SearchBookmarkSchema>
