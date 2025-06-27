import avatar from "data-base64:~assets/avatar.png"
import {
  CheckCircle,
  LogOut,
  Mail,
  MessageCircle,
  Share,
  Twitter
} from 'lucide-react'
import type { AuthUser } from '~/source/shared/api/types'
import { getShareConfig, getSocialMediaConfig } from '~/source/shared/config/env'
import { Button, Tooltip } from '~source/shared/components'
// 用户信息视图
interface UserProfileViewProps {
  user: AuthUser | null
  onLogout: () => void
}

export function UserProfileView({ user, onLogout }: UserProfileViewProps) {

  if (!user) return null

  // 构建分享 URL 和文本
  const shareConfig = getShareConfig()
  const socialMediaConfig = getSocialMediaConfig()
  const shareUrl = `${shareConfig.baseUrl}/${user.username || user.id}`
  const shareText = "我正在使用 Craz Chrome 扩展来管理我的标签页和书签，快来看看我的档案吧！🚀"

  // 分享到 X (Twitter)
  const handleShare = () => {
    const twitterUrl = `${shareConfig.twitterIntentUrl}?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    window.open(twitterUrl, '_blank', 'noopener,noreferrer')
  }

  // 格式化加入时间
  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    })
  }

  return (
    <div className="overflow-y-auto max-h-[500px] scrollbar-macos-thin">
      <div className="overflow-hidden relative mx-auto max-w-md bg-theme-bg-primary border-theme-border-primary">
        {/* 主题色渐变背景 */}
        {/* <div className="h-32 bg-gradient-to-br opacity-0 from-theme-primary-400 via-theme-primary-500 to-theme-primary-600 dark:from-theme-primary-600 dark:via-theme-primary-700 dark:to-theme-primary-800"></div> */}

        {/* 头部操作按钮 */}
        <div className="flex absolute top-4 right-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
          >
            <Share size={16} className="text-theme-primary-100" />
            <span className="text-xs font-medium">Share</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
          >
            <LogOut size={16} className="text-theme-primary-100" />
            <span className="text-xs font-medium">Logout</span>
          </Button>
        </div>

        {/* 主要内容 */}
        <div className="px-6 pt-24 pb-6 bg-white dark:bg-gray-900">
          {/* 头像 */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <img
                src={user?.avatar?.length ? user.avatar : avatar}
                alt={user.name}
                className="p-1 w-24 h-24 rounded-full ring-4 shadow-lg bg-theme-bg-primary ring-theme-bg-primary"
              />
              {user.isSponsored && (
                <div className="flex absolute -right-1 -bottom-1 justify-center items-center w-7 h-7 rounded-full ring-4 bg-theme-primary-500 ring-theme-bg-primary">
                  <CheckCircle className="w-4 h-4 text-theme-primary-100" />
                </div>
              )}
            </div>
          </div>

          {/* 用户名 */}
          <div className="mb-1 text-center">
            <p className="text-md text-theme-primary-500">
              Hi, @{user.username || user.name.toLowerCase().replace(/\s+/g, '')}
            </p>
          </div>

          {/* 姓名和验证徽章 */}
          <div className="flex gap-2 justify-center items-center mb-2">
            <h1 className="text-xl font-bold text-theme-text-primary">
              {user.name}
            </h1>
            {user.isSponsored && (
              <div className="flex justify-center items-center w-5 h-5 rounded-full bg-theme-primary-500">
                <span className="text-xs text-theme-primary-100">💎</span>
              </div>
            )}
          </div>

          {/* 位置和加入时间 */}
          <div className="flex gap-4 justify-center items-center mb-6 text-sm text-gray-900 dark:text-white">
            <span>Joined {formatJoinDate(user.createdAt)}</span>
          </div>

          {/* 联系我 */}
          <div className="mb-6">
            {/* 提示文字 */}
            {
              !user.isSponsored && (
                <p className="mb-4 text-sm text-center text-gray-900 dark:text-white">
                  很遗憾我暂时没有支付渠道，如果你想使用 Pro 用户的功能，欢迎联系我
                </p>
              )
            }

            {/* 联系方式 */}
            <div className="flex gap-4 justify-center items-center">
              {/* 邮箱 */}
              <a
                href={`mailto:${socialMediaConfig.email}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-2 items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-theme-bg-secondary hover:bg-theme-bg-accent text-theme-text-primary hover:text-theme-primary-600 dark:hover:text-theme-primary-400"
              >
                <Mail size={16} className="text-theme-primary-500" />
                <span className="text-gray-900 dark:text-white">邮箱</span>
              </a>

              {/* 推特 (X) */}
              <a
                href={socialMediaConfig.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-2 items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-theme-bg-secondary hover:bg-theme-bg-accent text-theme-text-primary hover:text-theme-primary-600 dark:hover:text-theme-primary-400"
              >
                <Twitter size={16} className="text-theme-primary-500" />
                <span className="text-gray-900 dark:text-white">推特</span>
              </a>

              {/* 微信 */}
              <Tooltip
                content={
                  <div className="flex flex-col items-center gap-1">
                    <div className="text-xs font-medium">微信号</div>
                    <div className="font-mono text-sm">{socialMediaConfig.wechatId}</div>
                  </div>
                }
                position="top"
              >
                <div className="flex gap-2 items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-theme-bg-secondary hover:bg-theme-bg-accent text-theme-text-primary hover:text-theme-primary-600 dark:hover:text-theme-primary-400 cursor-pointer">
                  <MessageCircle size={16} className="text-theme-primary-500" />
                  <span className="text-gray-900 dark:text-white">微信</span>
                </div>
              </Tooltip>
            </div>
          </div>

          {/* 订阅状态 */}
          {user.isSponsored && (
            <div className="p-3 mt-4 rounded-xl border bg-theme-primary-50 dark:bg-theme-primary-900/20 border-theme-primary-200 dark:border-theme-primary-800">
              <div className="flex gap-2 items-center">
                <CheckCircle className="w-4 h-4 text-theme-primary-600 dark:text-theme-primary-400" />
                <span className="text-sm font-medium text-theme-primary-800 dark:text-theme-primary-200">
                  Premium Subscriber
                </span>
              </div>
              <p className="mt-1 text-xs text-theme-primary-600 dark:text-theme-primary-400">
                Active subscription since {formatJoinDate(user.createdAt)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 