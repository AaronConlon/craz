# ProfileView 组件功能文档

## 概述

ProfileView 组件是从 SettingsView 中抽离出来的独立用户个人信息管理组件，实现了现代化的用户界面设计，包括登录/注册状态和已登录用户的详细信息管理。

## 主要功能

### 1. 未登录状态 - 登录/注册界面

**设计特点：**

- 现代化的卡片式布局，居中显示
- 紫色主题色，与 Finnger 品牌保持一致
- 大标题设计："Holla, Welcome Back" 或 "Welcome, Join Us"
- 优雅的表单输入框，带有圆角和悬浮效果
- 密码显示/隐藏切换功能
- "Remember me" 复选框（仅登录模式）
- 登录/注册模式快速切换

**功能：**

- 邮箱和密码登录
- 新用户注册（包含姓名字段）
- 表单验证和错误处理
- 加载状态显示

### 2. 已登录状态 - 用户信息管理界面

**设计特点：**

- 仿照现代 SaaS 应用的用户管理界面
- 头像显示（使用 Dicebear 头像生成器）
- 用户状态标识（Subscribed 徽章）
- 统计信息卡片：First seen, First purchase, Revenue, MRR
- 可编辑的用户信息表单
- 底部操作按钮：Archive, View orders, 登出

**功能：**

- 用户基本信息显示和编辑
- 姓名分离编辑（First Name / Last Name）
- 邮箱验证状态显示
- 国家选择下拉框
- 用户名编辑（带前缀 untitledui.com/）
- 编辑模式切换
- 数据保存和重置功能

## 技术实现

### 组件结构

```typescript
ProfileView
├── LoginRegisterView (未登录状态)
└── UserProfileView (已登录状态)
```

### 核心依赖

- `useUserProfile` Hook：统一的用户配置文件管理
- `lucide-react`：图标库
- `cn` 工具函数：样式类名合并
- React Hook Form 模式：表单状态管理

### 状态管理

```typescript
// 认证表单状态
const [authForm, setAuthForm] = useState<{
  email: string
  password: string
  name: string
}>()

// 编辑表单状态
const [editForm, setEditForm] = useState({
  firstName: string
  lastName: string
  email: string
  country: string
  username: string
})
```

## 使用方法

### 在 TabSwitcher 中使用

```typescript
import { ProfileView } from './profile-view'

// 在渲染逻辑中
case 'profile':
  return <ProfileView />
```

### 独立使用

```typescript
import { ProfileView } from '~/source/features/tab-switcher/ui/profile-view'

function MyComponent() {
  return (
    <div className="container">
      <ProfileView />
    </div>
  )
}
```

## 样式设计

### 设计系统

- **主色调：** 紫色 (`bg-purple-600`)
- **卡片设计：** 圆角 (`rounded-2xl`)，浅阴影 (`shadow-sm`)
- **表单输入：** 灰色背景 (`bg-gray-50`)，紫色焦点环 (`focus:ring-purple-500`)
- **按钮样式：** 圆角，悬浮效果，禁用状态处理

### 响应式设计

- 最大宽度限制：`max-w-md`（登录界面），`max-w-2xl`（用户信息界面）
- 网格布局：统计信息使用 `grid-cols-4`
- 弹性布局：大量使用 Flexbox 进行对齐

## 数据流

```
ProfileView
    ↓
useUserProfile Hook
    ↓
Background Messages (user-profile-action)
    ↓
Chrome Storage + Cloud API
```

## 错误处理

- 加载状态：旋转加载指示器
- 表单验证：必填字段验证
- 网络错误：Toast 消息提示
- 认证失败：错误状态显示

## 可访问性

- 语义化 HTML 标签
- 适当的 ARIA 标签
- 键盘导航支持
- 高对比度设计
- 屏幕阅读器友好

## 后续优化计划

1. **头像上传功能**：支持用户自定义头像
2. **更多用户信息字段**：电话、地址等
3. **账户安全设置**：密码修改、两步验证
4. **主题偏好设置**：与用户个人资料集成
5. **数据导出功能**：用户数据下载
6. **社交账户绑定**：Google、GitHub 等第三方登录

## 注意事项

- 组件依赖 `useUserProfile` Hook，确保已正确配置
- 头像使用外部服务，需要网络连接
- 表单数据在组件卸载时会重置
- 编辑模式下的数据不会自动保存，需要用户手动保存
