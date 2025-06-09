import { describe, expect, it } from "vitest"

import { formatDate, formatRelativeTime } from "./formatDate"

describe("formatDate", () => {
  it("should format date with default pattern", () => {
    const date = new Date("2024-01-01T12:30:45")
    const result = formatDate(date)
    expect(result).toBe("2024-01-01 12:30:45")
  })

  it("should format date with custom pattern", () => {
    const date = new Date("2024-01-01T12:30:45")
    const result = formatDate(date, "yyyy年MM月dd日")
    expect(result).toBe("2024年01月01日")
  })

  it("should handle string input", () => {
    const result = formatDate("2024-01-01T12:30:45")
    expect(result).toBe("2024-01-01 12:30:45")
  })

  it("should handle number input", () => {
    const timestamp = new Date("2024-01-01T12:30:45").getTime()
    const result = formatDate(timestamp)
    expect(result).toBe("2024-01-01 12:30:45")
  })
})

describe("formatRelativeTime", () => {
  it("should format relative time", () => {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const result = formatRelativeTime(oneHourAgo)
    expect(result).toContain("1 小时前")
  })

  it("should handle string input", () => {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString()
    const result = formatRelativeTime(oneHourAgo)
    expect(result).toContain("小时前")
  })
})
