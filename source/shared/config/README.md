# 环境变量配置

本项目使用 Plasmo 的环境变量能力来管理不同环境下的配置。

## 环境变量设置

### 1. 创建环境变量文件

**开发环境** - 创建 `.env` 文件：

```bash
# 复制示例文件
cp env.example .env
```

**生产环境** - 创建 `.env.prod` 文件：

```bash
# 复制示例文件
cp env.prod.example .env.prod
```

### 2. 配置环境变量

所有环境变量都必须以 `PLASMO_PUBLIC_` 前缀开头，这样 Plasmo 才会在客户端代码中提供这些变量。

| 变量名 | 说明 | 默认值 | 示例 |
|--------|------|--------|------|
| `PLASMO_PUBLIC_API_BASE_URL` | API 基础 URL | `https://api.craz.com` | `http://localhost:8787` |
| `PLASMO_PUBLIC_API_TIMEOUT` | 请求超时时间(毫秒) | `30000` | `45000` |
| `PLASMO_PUBLIC_API_RETRY_LIMIT` | 重试次数 | `3` | `5` |
| `PLASMO_PUBLIC_ENABLE_API_LOGS` | 是否启用日志 | `false` | `true` |

### 3. 环境文件示例

**开发环境 (.env)**

```env
PLASMO_PUBLIC_API_BASE_URL=http://localhost:8787
PLASMO_PUBLIC_API_TIMEOUT=30000
PLASMO_PUBLIC_API_RETRY_LIMIT=3
PLASMO_PUBLIC_ENABLE_API_LOGS=true
```

**生产环境 (.env.prod)**

```env
PLASMO_PUBLIC_API_BASE_URL=https://api.craz.com
PLASMO_PUBLIC_API_TIMEOUT=45000
PLASMO_PUBLIC_API_RETRY_LIMIT=5
PLASMO_PUBLIC_ENABLE_API_LOGS=false
```

## 使用方式

### 1. 在 API 客户端中使用

```typescript
import { createCrazApiFromEnv } from '~/shared/api'

// 推荐方式：使用环境变量
const api = createCrazApiFromEnv('your-jwt-token')

// 或者让系统自动读取环境变量
const api = createCrazApi({
  token: 'your-jwt-token'
  // 其他配置自动从环境变量读取
})
```

### 2. 直接获取环境配置

```typescript
import { getApiConfig, getEnvironmentInfo } from '~/shared/config/env'

// 获取 API 配置
const config = getApiConfig()
console.log('API Base URL:', config.baseUrl)

// 获取完整环境信息
const envInfo = getEnvironmentInfo()
console.log('Environment:', envInfo)
```

### 3. 环境检测

```typescript
import { isDevelopment, isProduction } from '~/shared/config/env'

if (isDevelopment) {
  console.log('运行在开发环境')
}

if (isProduction) {
  console.log('运行在生产环境')
}
```

## 构建配置

### 开发环境构建

```bash
# 使用 .env 文件
pnpm dev
```

### 生产环境构建

```bash
# 使用 .env.prod 文件
pnpm build --env=prod
```

## 注意事项

1. **环境变量文件不要提交到版本控制**
   - `.env` 和 `.env.prod` 已在 `.gitignore` 中
   - 只提交 `.example` 示例文件

2. **PLASMO_PUBLIC_ 前缀是必需的**
   - 没有此前缀的变量不会在客户端代码中可用
   - 这是 Plasmo 的安全机制

3. **类型安全**
   - 所有环境变量都通过 TypeScript 类型检查
   - 提供默认值确保应用正常运行

4. **调试信息**
   - 开发环境下会自动输出配置信息
   - 生产环境下默认关闭日志

## 故障排除

### 环境变量不生效

1. 检查变量名是否有 `PLASMO_PUBLIC_` 前缀
2. 重启开发服务器
3. 清理构建缓存：`pnpm clean`

### API 请求失败

1. 检查 `PLASMO_PUBLIC_API_BASE_URL` 是否正确
2. 确认 API 服务器是否运行
3. 查看浏览器控制台的网络请求

### 日志不显示

1. 确认 `PLASMO_PUBLIC_ENABLE_API_LOGS=true`
2. 检查是否在开发环境
3. 打开浏览器开发者工具的控制台
