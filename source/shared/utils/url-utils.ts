// ========== 类型定义 ==========

type URLCheckResult = boolean
type URLProtocol = "http:" | "https:" | string

// ========== 常量定义 ==========

/** 私有 IPv4 地址范围的正则表达式 */
const PRIVATE_IP_RANGES = [
  /^10\./, // 10.0.0.0/8
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
  /^192\.168\./, // 192.168.0.0/16
  /^127\./, // 127.0.0.0/8 (loopback)
  /^169\.254\./, // 169.254.0.0/16 (link-local)
  /^0\.0\.0\.0$/, // 0.0.0.0
  /^255\.255\.255\.255$/ // 255.255.255.255
] as const

/** 本地主机名列表 */
const LOCAL_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "local",
  "internal",
  "0.0.0.0"
])

/** 开发环境主机名列表 */
const DEV_HOSTNAMES = new Set([
  "dev",
  "development",
  "test",
  "testing",
  "staging",
  "local-dev",
  "dev-server"
])

/** 本地域名后缀列表 */
const LOCAL_DOMAIN_SUFFIXES = [".local", ".internal", ".localhost"] as const

/** 常见开发端口 */
const DEVELOPMENT_PORTS = new Set([
  3000, 3001, 4000, 5000, 8000, 8080, 8888, 9000
])

/** 特殊协议前缀 */
const SPECIAL_PROTOCOLS = {
  CHROME: "chrome://",
  CHROME_EXTENSION: "chrome-extension://",
  FILE: "file://",
  DATA: "data:"
} as const

/** 预编译的正则表达式 */
const REGEX_PATTERNS = {
  IPv4: /^(\d{1,3}\.){3}\d{1,3}$/,
  IPv6_LOCAL: /^(::1|fe8)/,
  LOCALHOST_127: /^127\.\d+\.\d+\.\d+$/,
  WWW_PREFIX: /^www\./
} as const

// ========== 工具函数 ==========

/**
 * 检查 IP 地址是否为私有/内网地址
 */
function isPrivateIP(ip: string): URLCheckResult {
  return PRIVATE_IP_RANGES.some((range) => range.test(ip))
}

/**
 * 检查主机名是否为精确匹配的本地地址
 */
function isExactLocalHostname(hostname: string): URLCheckResult {
  return LOCAL_HOSTNAMES.has(hostname) || DEV_HOSTNAMES.has(hostname)
}

/**
 * 检查主机名是否包含本地地址特征
 */
function hasLocalHostnamePattern(hostname: string): URLCheckResult {
  // 包含 localhost 字符串
  if (hostname.includes("localhost")) return true

  // 127.x.x.x 网段
  if (REGEX_PATTERNS.LOCALHOST_127.test(hostname)) return true

  // 本地域名后缀
  return LOCAL_DOMAIN_SUFFIXES.some((suffix) => hostname.endsWith(suffix))
}

/**
 * 检查主机名是否为本地/内网主机名（优化版）
 */
function isLocalHostname(hostname: string): URLCheckResult {
  const lowerHostname = hostname.toLowerCase()

  // 精确匹配检查（最快）
  if (isExactLocalHostname(lowerHostname)) return true

  // 模式匹配检查
  return hasLocalHostnamePattern(lowerHostname)
}

/**
 * 安全地解析 URL
 */
function safeParseURL(url: string): URL | null {
  try {
    return new URL(url)
  } catch {
    return null
  }
}

/**
 * 检查是否为 IPv4 地址
 */
function isIPv4(hostname: string): URLCheckResult {
  return REGEX_PATTERNS.IPv4.test(hostname)
}

/**
 * 检查是否为本地 IPv6 地址
 */
function isLocalIPv6(hostname: string): URLCheckResult {
  if (!hostname.includes(":")) return false

  return (
    hostname === "::1" ||
    hostname.startsWith("::1") ||
    REGEX_PATTERNS.IPv6_LOCAL.test(hostname)
  )
}

/**
 * 检查端口是否为开发端口
 */
function isDevelopmentPort(port: string | undefined): URLCheckResult {
  if (!port) return false

  const portNumber = parseInt(port, 10)
  return !isNaN(portNumber) && DEVELOPMENT_PORTS.has(portNumber)
}

/**
 * 检查协议是否被支持
 */
function isSupportedProtocol(protocol: URLProtocol): URLCheckResult {
  return protocol === "http:" || protocol === "https:"
}

/**
 * 检查 URL 是否为公网地址
 *
 * @param url - 要检查的 URL
 * @returns true 如果是公网地址，false 如果是内网/本地地址
 */
export function isPublicURL(url: string): URLCheckResult {
  const urlObj = safeParseURL(url)
  if (!urlObj) return false

  // 检查协议
  if (!isSupportedProtocol(urlObj.protocol)) return false

  const { hostname, port } = urlObj

  // 检查本地主机名
  if (isLocalHostname(hostname)) return false

  // 检查开发端口
  if (isDevelopmentPort(port)) return false

  // 检查 IPv4 私有地址
  if (isIPv4(hostname)) {
    return !isPrivateIP(hostname)
  }

  // 检查本地 IPv6
  if (isLocalIPv6(hostname)) return false

  // 其他情况认为是公网地址
  return true
}

/**
 * 检查 URL 是否应该直接使用默认图标
 *
 * @param url - 要检查的 URL
 * @returns true 如果应该使用默认图标，false 如果可以尝试加载
 */
export function shouldUseDefaultFavicon(url: string): URLCheckResult {
  // 空 URL
  if (!url?.trim()) return true

  // 特殊协议检查
  if (
    url.includes(SPECIAL_PROTOCOLS.CHROME) ||
    url.includes(SPECIAL_PROTOCOLS.CHROME_EXTENSION)
  ) {
    return true
  }

  if (url.startsWith(SPECIAL_PROTOCOLS.FILE)) return true

  // 数据 URL 可以直接使用
  if (url.startsWith(SPECIAL_PROTOCOLS.DATA)) return false

  // 检查是否为公网地址
  return !isPublicURL(url)
}

/**
 * 从 URL 中提取域名
 */
export function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return null
  }
}

/**
 * 生成 twenty-icons.com 的图标 URL
 * 参考：https://twenty-icons.com/airbnb.com
 */
export function generateTwentyIconsUrl(domain: string): string {
  const cleanDomain = domain.replace(REGEX_PATTERNS.WWW_PREFIX, "")
  return `https://twenty-icons.com/${cleanDomain}`
}

// ========== 调试工具函数 ==========

/**
 * 获取 URL 检查的详细信息（用于调试）
 */
export function getURLCheckDetails(url: string) {
  const urlObj = safeParseURL(url)

  if (!urlObj) {
    return { valid: false, reason: "Invalid URL" }
  }

  const { protocol, hostname, port } = urlObj

  return {
    valid: true,
    url,
    protocol,
    hostname,
    port,
    isPublic: isPublicURL(url),
    shouldUseDefault: shouldUseDefaultFavicon(url),
    checks: {
      isSupportedProtocol: isSupportedProtocol(protocol),
      isLocalHostname: isLocalHostname(hostname),
      isDevelopmentPort: isDevelopmentPort(port),
      isIPv4: isIPv4(hostname),
      isPrivateIP: isIPv4(hostname) ? isPrivateIP(hostname) : false,
      isLocalIPv6: isLocalIPv6(hostname)
    }
  }
}

/**
 * 将相对路径转换为绝对路径
 * @param base 基础 URL
 * @param path 相对路径
 * @returns 绝对路径
 */
export function resolveUrl(base: string, path?: string): string | undefined {
  if (!path) {
    return undefined
  }

  try {
    // 如果已经是绝对 URL，直接返回
    if (path.match(/^https?:\/\//i)) {
      return path
    }

    // 如果是 data: URL，直接返回
    if (path.startsWith("data:")) {
      return path
    }

    // 如果是 // 开头的协议相对 URL，添加当前协议
    if (path.startsWith("//")) {
      const baseUrl = new URL(base)
      return `${baseUrl.protocol}${path}`
    }

    // 处理相对路径
    const baseUrl = new URL(base)
    if (path.startsWith("/")) {
      // 绝对路径，使用域名根路径
      return new URL(path, `${baseUrl.protocol}//${baseUrl.host}`).toString()
    } else {
      // 相对路径，使用当前页面路径
      const basePath = baseUrl.pathname.split("/").slice(0, -1).join("/") + "/"
      return new URL(
        path,
        `${baseUrl.protocol}//${baseUrl.host}${basePath}`
      ).toString()
    }
  } catch (error) {
    console.error("解析 URL 失败:", error)
    return undefined
  }
}

/**
 * 获取网站的根域名
 * @param url URL
 * @returns 根域名
 */
export function getRootDomain(url: string): string {
  try {
    const { hostname } = new URL(url)
    return hostname
  } catch {
    return url
  }
}

/**
 * 获取网站的 favicon URL
 * @param url 网站 URL
 * @returns favicon URL
 */
export function getDefaultFaviconUrl(url: string): string {
  try {
    const { protocol, host } = new URL(url)
    return `${protocol}//${host}/favicon.ico`
  } catch {
    return "/favicon.ico"
  }
}
