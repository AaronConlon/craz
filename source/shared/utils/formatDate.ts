import { format, formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"

/**
 * 格式化日期为指定格式
 * @param date - 日期
 * @param pattern - 格式模式，默认为 'yyyy-MM-dd HH:mm:ss'
 * @returns 格式化后的日期字符串
 */
export function formatDate(
  date: Date | string | number,
  pattern = "yyyy-MM-dd HH:mm:ss"
): string {
  const dateObj =
    typeof date === "string" || typeof date === "number" ? new Date(date) : date
  return format(dateObj, pattern, { locale: zhCN })
}

/**
 * 格式化相对时间（多久之前）
 * @param date - 日期
 * @returns 相对时间字符串
 */
export function formatRelativeTime(date: Date | string | number): string {
  const dateObj =
    typeof date === "string" || typeof date === "number" ? new Date(date) : date
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: zhCN })
}
