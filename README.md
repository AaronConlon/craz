# Craz Chrome Extension

一个基于 Plasmo 框架的智能标签页管理 Chrome 扩展，支持快速切换标签页和书签管理。

## ✨ 功能特性

- 🚀 **快速标签页切换**: 按 `C` 键快速打开标签页管理界面
- 🔍 **智能搜索**: 支持按标题、URL 搜索标签页
- 📚 **书签管理**: 一键添加书签，支持标签分类
- ⚡ **实时同步**: 标签页状态实时更新
- 🎨 **现代 UI**: 基于 Tailwind CSS 的美观界面
- 🔒 **隐私保护**: 仅在需要时显示，不干扰正常浏览

## 🏗️ 技术架构

### 前端 (Chrome Extension)

- **框架**: Plasmo + React + TypeScript
- **状态管理**: React Query (TanStack Query)
- **样式**: Tailwind CSS v3
- **图标**: Lucide React
- **架构**: Feature-Sliced Design (FSD)

### 后端 (API 服务)

- **框架**: Hono.js
- **运行时**: Cloudflare Workers
- **数据存储**: Cloudflare KV
- **数据验证**: Zod

## 📁 项目结构

```
craz/
├── src/                          # 前端源码
│   ├── components/               # 通用组件
│   ├── features/                 # 功能模块
│   │   └── tab-switcher/         # 标签页切换功能
│   │       ├── ui/               # UI 组件
│   │       ├── model/            # 业务逻辑
│   │       └── types.ts          # 类型定义
│   └── shared/                   # 共享资源
│       ├── api/                  # API 服务
│       ├── hooks/                # 自定义 hooks
│       ├── types/                # 通用类型
│       └── utils/                # 工具函数
├── contents/                     # Content Scripts
├── popup/                        # 扩展弹窗
├── api/                          # 后端 API 服务
│   ├── src/
│   │   ├── routes/               # 路由处理
│   │   ├── services/             # 业务服务
│   │   └── schemas/              # 数据验证
│   └── wrangler.toml             # Cloudflare 配置
└── assets/                       # 静态资源
```

## 🚀 快速开始

### 前端开发

1. **安装依赖**:

```bash
pnpm install
```

2. **启动开发服务器**:

```bash
pnpm dev
```

3. **构建扩展**:

```bash
pnpm build
```

### 后端部署

1. **进入 API 目录**:

```bash
cd api
pnpm install
```

2. **创建 KV 存储**:

```bash
wrangler kv:namespace create "BOOKMARKS_KV"
```

3. **更新配置**: 将生成的 KV 命名空间 ID 更新到 `wrangler.toml`

4. **部署到 Cloudflare**:

```bash
pnpm deploy
```

## 🎯 使用方法

1. **安装扩展**: 在 Chrome 中加载解压的扩展程序
2. **激活界面**: 在任意网页按 `C` 键
3. **搜索标签页**: 在搜索框中输入关键词
4. **切换标签页**: 点击标签页项目快速切换
5. **管理书签**: 使用书签按钮添加当前标签页到书签

## 🔧 开发规范

### 代码哲学
>
> 代码是给人看的，只是顺便给机器运行

### 架构原则

- 遵循 Feature-Sliced Design (FSD) 架构
- 单一职责原则，功能模块化
- 类型安全，严格的 TypeScript 检查

### 代码规范

- 使用 ESLint + Prettier 保持代码风格
- 工具函数必须编写 Vitest 测试
- 组件使用 Tailwind CSS 样式
- 时间处理统一使用 date-fns

## 📋 API 接口

### 书签管理

- `GET /bookmarks` - 获取书签列表
- `POST /bookmarks` - 创建书签
- `PUT /bookmarks/:id` - 更新书签
- `DELETE /bookmarks/:id` - 删除书签
- `GET /bookmarks/search` - 搜索书签
- `GET /bookmarks/tags` - 获取标签列表

详细 API 文档请查看 [api/README.md](./api/README.md)

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 提交 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Plasmo](https://www.plasmo.com/) - 优秀的浏览器扩展开发框架
- [Hono](https://hono.dev/) - 轻量级 Web 框架
- [Cloudflare Workers](https://workers.cloudflare.com/) - 边缘计算平台
