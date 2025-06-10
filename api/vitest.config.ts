import { defineConfig } from "vitest/config";





export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    exclude: ["node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [
        "node_modules/**",
        "src/**/*.test.ts",
        "tests/**/*.test.ts",
        "src/**/*.d.ts",
        "tests/fixtures/**",
        "tests/utils/**"
      ]
    },
    // 设置测试超时时间
    testTimeout: 30000,
    hookTimeout: 30000,
    // 接口测试可以并发执行
    pool: "forks"
  },
  resolve: {
    alias: {
      "@": "./src",
      "@tests": "./tests"
    }
  }
})