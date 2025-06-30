import { describe, expect, it } from "vitest";



import { extractDomain, generateTwentyIconsUrl, isPublicURL, shouldUseDefaultFavicon } from "./url-utils";


describe("URL Utils", () => {
  describe("isPublicURL", () => {
    it("should return true for public HTTP URLs", () => {
      expect(isPublicURL("http://example.com")).toBe(true)
      expect(isPublicURL("https://google.com")).toBe(true)
      expect(isPublicURL("https://www.github.com")).toBe(true)
    })

    it("should return false for localhost addresses", () => {
      expect(isPublicURL("http://localhost")).toBe(false)
      expect(isPublicURL("http://localhost:3000")).toBe(false)
      expect(isPublicURL("https://127.0.0.1")).toBe(false)
      expect(isPublicURL("http://127.0.0.2")).toBe(false)
      expect(isPublicURL("http://127.255.255.255")).toBe(false)
      expect(isPublicURL("http://0.0.0.0")).toBe(false)
      expect(isPublicURL("http://my.localhost")).toBe(false)
      expect(isPublicURL("http://app.localhost:8080")).toBe(false)
    })

    it("should return false for private IP addresses", () => {
      expect(isPublicURL("http://192.168.1.1")).toBe(false)
      expect(isPublicURL("http://10.0.0.1")).toBe(false)
      expect(isPublicURL("http://172.16.0.1")).toBe(false)
    })

    it("should return true for public IP addresses", () => {
      expect(isPublicURL("http://8.8.8.8")).toBe(true)
      expect(isPublicURL("http://1.1.1.1")).toBe(true)
    })

    it("should return false for .local domains", () => {
      expect(isPublicURL("http://myserver.local")).toBe(false)
      expect(isPublicURL("https://printer.local")).toBe(false)
    })

    it("should return false for development environment hostnames", () => {
      expect(isPublicURL("http://dev")).toBe(false)
      expect(isPublicURL("http://development")).toBe(false)
      expect(isPublicURL("http://test")).toBe(false)
      expect(isPublicURL("http://testing")).toBe(false)
      expect(isPublicURL("http://staging")).toBe(false)
      expect(isPublicURL("http://local-dev")).toBe(false)
      expect(isPublicURL("http://dev-server")).toBe(false)
    })

    it("should return false for development ports", () => {
      expect(isPublicURL("http://example.com:3000")).toBe(false)
      expect(isPublicURL("http://example.com:8080")).toBe(false)
      expect(isPublicURL("http://example.com:5000")).toBe(false)
    })

    it("should return false for non-HTTP protocols", () => {
      expect(isPublicURL("ftp://example.com")).toBe(false)
      expect(isPublicURL("file:///path/to/file")).toBe(false)
      expect(isPublicURL("chrome://settings")).toBe(false)
    })

    it("should return false for invalid URLs", () => {
      expect(isPublicURL("not-a-url")).toBe(false)
      expect(isPublicURL("")).toBe(false)
      expect(isPublicURL("://invalid")).toBe(false)
    })
  })

  describe("shouldUseDefaultFavicon", () => {
    it("should return true for empty URLs", () => {
      expect(shouldUseDefaultFavicon("")).toBe(true)
      expect(shouldUseDefaultFavicon("   ")).toBe(true)
    })

    it("should return true for Chrome internal pages", () => {
      expect(shouldUseDefaultFavicon("chrome://settings")).toBe(true)
      expect(shouldUseDefaultFavicon("chrome-extension://abc123")).toBe(true)
    })

    it("should return true for file URLs", () => {
      expect(shouldUseDefaultFavicon("file:///path/to/file.html")).toBe(true)
    })

    it("should return false for data URLs", () => {
      expect(
        shouldUseDefaultFavicon(
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
        )
      ).toBe(false)
    })

    it("should return true for non-public URLs", () => {
      expect(shouldUseDefaultFavicon("http://localhost")).toBe(true)
      expect(shouldUseDefaultFavicon("http://192.168.1.1")).toBe(true)
      expect(shouldUseDefaultFavicon("http://myserver.local")).toBe(true)
      expect(shouldUseDefaultFavicon("http://127.0.0.2")).toBe(true)
      expect(shouldUseDefaultFavicon("http://my.localhost")).toBe(true)
      expect(shouldUseDefaultFavicon("http://app.localhost:3000")).toBe(true)
      expect(shouldUseDefaultFavicon("http://dev")).toBe(true)
      expect(shouldUseDefaultFavicon("http://staging")).toBe(true)
    })

    it("should return false for public URLs", () => {
      expect(shouldUseDefaultFavicon("https://google.com")).toBe(false)
      expect(shouldUseDefaultFavicon("http://example.com")).toBe(false)
    })
  })

  describe("extractDomain", () => {
    it("should extract domain from valid URLs", () => {
      expect(extractDomain("https://www.google.com/search")).toBe(
        "www.google.com"
      )
      expect(extractDomain("http://example.com:8080/path")).toBe("example.com")
      expect(extractDomain("https://subdomain.example.com")).toBe(
        "subdomain.example.com"
      )
    })

    it("should return null for invalid URLs", () => {
      expect(extractDomain("not-a-url")).toBe(null)
      expect(extractDomain("")).toBe(null)
      expect(extractDomain("://invalid")).toBe(null)
    })
  })

  describe("generateTwentyIconsUrl", () => {
    it("should generate correct twenty-icons URLs", () => {
      expect(generateTwentyIconsUrl("google.com")).toBe(
        "https://twenty-icons.com/google.com"
      )
      expect(generateTwentyIconsUrl("example.com")).toBe(
        "https://twenty-icons.com/example.com"
      )
    })

    it("should remove www prefix", () => {
      expect(generateTwentyIconsUrl("www.google.com")).toBe(
        "https://twenty-icons.com/google.com"
      )
      expect(generateTwentyIconsUrl("www.example.com")).toBe(
        "https://twenty-icons.com/example.com"
      )
    })

    it("should handle domains without www", () => {
      expect(generateTwentyIconsUrl("github.com")).toBe(
        "https://twenty-icons.com/github.com"
      )
      expect(generateTwentyIconsUrl("stackoverflow.com")).toBe(
        "https://twenty-icons.com/stackoverflow.com"
      )
    })
  })
})