import React, { useState } from 'react'
import {
  User,
  Lock,
  X,
  Settings,
  Bell,
  Search,
  Image as ImageIcon,
  Check,
  Star,
  Heart,
  Download,
  Share,
  Trash2
} from 'lucide-react'

/**
 * 毛玻璃样式展示组件
 * 模拟常见的模态框场景展示各种毛玻璃效果
 */
export function GlassShowcase() {
  const [activeModal, setActiveModal] = useState<string | null>(null)

  // 模拟数据
  const notifications = [
    { id: 1, title: '新消息', content: '你有一条新的私信', time: '2分钟前', unread: true },
    { id: 2, title: '系统更新', content: '应用已更新到最新版本', time: '1小时前', unread: false },
    { id: 3, title: '活动提醒', content: '限时活动即将结束', time: '3小时前', unread: true }
  ]

  const photos = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop',
    'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=300&h=200&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=200&fit=crop'
  ]

  const renderModal = () => {
    if (!activeModal) return null

    const modalContent = {
      login: (
        <div className="glass-container rounded-2xl max-w-md w-full mx-4">
          {/* 头部 */}
          <div className="glass-card p-6 border-b border-white/20 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">登录账户</h2>
            <button
              onClick={() => setActiveModal(null)}
              className="glass-hover p-2 rounded-full text-gray-600 hover:text-red-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* 内容 */}
          <div className="p-6 space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="用户名或邮箱"
                className="w-full pl-10 pr-4 py-3 glass-input rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="password"
                placeholder="密码"
                className="w-full pl-10 pr-4 py-3 glass-input rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <button className="w-full glass-hover py-3 rounded-lg text-gray-700 hover:text-blue-600 font-medium transition-colors">
              登录
            </button>

            <div className="text-center">
              <a href="#" className="text-sm text-gray-600 glass-hover px-2 py-1 rounded hover:text-blue-600">
                忘记密码？
              </a>
            </div>
          </div>
        </div>
      ),

      settings: (
        <div className="glass-container rounded-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden">
          {/* 头部 */}
          <div className="glass-card p-4 border-b border-white/20 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">设置</h2>
            <button
              onClick={() => setActiveModal(null)}
              className="glass-hover p-2 rounded-full text-gray-600 hover:text-red-600"
            >
              <X size={18} />
            </button>
          </div>

          {/* 设置项列表 */}
          <div className="flex-1 overflow-y-auto">
            {[
              { icon: Bell, title: '通知设置', desc: '管理推送通知', active: true },
              { icon: User, title: '账户信息', desc: '修改个人资料', active: false },
              { icon: Lock, title: '隐私安全', desc: '密码和安全设置', active: false },
              { icon: Settings, title: '偏好设置', desc: '个性化配置', active: false }
            ].map((item, index) => (
              <div
                key={index}
                className={`p-4 glass-hover cursor-pointer border-b border-white/10 last:border-0 ${item.active ? 'glass-active' : ''
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon size={20} className="text-gray-600" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{item.title}</div>
                    <div className="text-sm text-gray-600">{item.desc}</div>
                  </div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full opacity-0 transition-opacity">
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 底部 */}
          <div className="glass-card p-4 border-t border-white/20">
            <button className="w-full glass-hover py-2 rounded-lg text-gray-700 hover:text-blue-600 font-medium">
              保存设置
            </button>
          </div>
        </div>
      ),

      notifications: (
        <div className="glass-container rounded-2xl max-w-md w-full mx-4">
          {/* 头部 */}
          <div className="glass-card p-4 border-b border-white/20 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">通知</h2>
            <button
              onClick={() => setActiveModal(null)}
              className="glass-hover p-2 rounded-full text-gray-600 hover:text-red-600"
            >
              <X size={18} />
            </button>
          </div>

          {/* 通知列表 */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 glass-hover cursor-pointer border-b border-white/10 last:border-0 ${notification.unread ? 'glass-active' : ''
                  }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${notification.unread ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 truncate">
                      {notification.title}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {notification.content}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {notification.time}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 底部操作 */}
          <div className="glass-card p-4 border-t border-white/20">
            <button className="w-full glass-hover py-2 rounded-lg text-gray-700 hover:text-blue-600 text-sm">
              全部标记为已读
            </button>
          </div>
        </div>
      ),

      gallery: (
        <div className="glass-container rounded-2xl max-w-4xl w-full mx-4">
          {/* 头部 */}
          <div className="glass-card p-4 border-b border-white/20 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">图片预览</h2>
            <div className="flex items-center space-x-2">
              <button className="glass-hover p-2 rounded text-gray-600 hover:text-blue-600">
                <Download size={18} />
              </button>
              <button className="glass-hover p-2 rounded text-gray-600 hover:text-green-600">
                <Share size={18} />
              </button>
              <button
                onClick={() => setActiveModal(null)}
                className="glass-hover p-2 rounded text-gray-600 hover:text-red-600"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* 图片网格 */}
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="glass-card rounded-lg overflow-hidden group cursor-pointer">
                  <div className="relative">
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 glass-overlay opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      <button className="glass-hover p-2 rounded-full text-white hover:text-red-500">
                        <Heart size={16} />
                      </button>
                      <button className="glass-hover p-2 rounded-full text-white hover:text-yellow-500">
                        <Star size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),

      search: (
        <div className="glass-container rounded-2xl max-w-lg w-full mx-4">
          {/* 搜索框 */}
          <div className="glass-card p-4 border-b border-white/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="搜索任何内容..."
                className="w-full pl-10 pr-4 py-3 glass-input rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* 搜索结果 */}
          <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
            {[
              { title: 'React 组件设计模式', type: '文档', tag: 'React' },
              { title: 'Tailwind CSS 最佳实践', type: '教程', tag: 'CSS' },
              { title: '现代化前端工程', type: '文章', tag: '工程化' },
              { title: 'TypeScript 进阶技巧', type: '指南', tag: 'TypeScript' }
            ].map((result, index) => (
              <div key={index} className="glass-hover p-3 rounded-lg cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">{result.title}</div>
                    <div className="text-sm text-gray-600">{result.type}</div>
                  </div>
                  <span className="glass-card px-2 py-1 text-xs text-gray-600 rounded">
                    {result.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* 关闭按钮 */}
          <div className="glass-card p-4 border-t border-white/20">
            <button
              onClick={() => setActiveModal(null)}
              className="w-full glass-hover py-2 rounded-lg text-gray-700 hover:text-blue-600"
            >
              关闭
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* 遮罩背景 */}
        <div
          className="absolute inset-0 glass-overlay"
          onClick={() => setActiveModal(null)}
        />

        {/* 模态框内容 */}
        <div className="relative z-10">
          {modalContent[activeModal]}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-8">
      {/* 标题 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">毛玻璃效果展示</h1>
        <p className="text-white/80 text-lg">点击按钮查看不同场景下的毛玻璃模态框效果</p>
      </div>

      {/* 示例按钮网格 */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* 登录模态框 */}
        <div className="glass-card rounded-xl p-6 text-center">
          <User className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">登录表单</h3>
          <p className="text-gray-600 text-sm mb-4">展示表单输入框的毛玻璃效果</p>
          <button
            onClick={() => setActiveModal('login')}
            className="w-full glass-hover py-2 rounded-lg text-gray-700 hover:text-blue-600 font-medium"
          >
            查看示例
          </button>
        </div>

        {/* 设置面板 */}
        <div className="glass-card rounded-xl p-6 text-center">
          <Settings className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">设置面板</h3>
          <p className="text-gray-600 text-sm mb-4">列表项目的悬停和激活状态</p>
          <button
            onClick={() => setActiveModal('settings')}
            className="w-full glass-hover py-2 rounded-lg text-gray-700 hover:text-blue-600 font-medium"
          >
            查看示例
          </button>
        </div>

        {/* 通知中心 */}
        <div className="glass-card rounded-xl p-6 text-center">
          <Bell className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">通知中心</h3>
          <p className="text-gray-600 text-sm mb-4">消息列表和状态指示器</p>
          <button
            onClick={() => setActiveModal('notifications')}
            className="w-full glass-hover py-2 rounded-lg text-gray-700 hover:text-blue-600 font-medium"
          >
            查看示例
          </button>
        </div>

        {/* 图片预览 */}
        <div className="glass-card rounded-xl p-6 text-center">
          <ImageIcon className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">图片画廊</h3>
          <p className="text-gray-600 text-sm mb-4">图片预览和交互按钮</p>
          <button
            onClick={() => setActiveModal('gallery')}
            className="w-full glass-hover py-2 rounded-lg text-gray-700 hover:text-blue-600 font-medium"
          >
            查看示例
          </button>
        </div>

        {/* 搜索界面 */}
        <div className="glass-card rounded-xl p-6 text-center">
          <Search className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">搜索界面</h3>
          <p className="text-gray-600 text-sm mb-4">搜索框和结果列表</p>
          <button
            onClick={() => setActiveModal('search')}
            className="w-full glass-hover py-2 rounded-lg text-gray-700 hover:text-blue-600 font-medium"
          >
            查看示例
          </button>
        </div>

        {/* 样式指南 */}
        <div className="glass-container rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-bold text-lg">CSS</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">设计系统</h3>
          <p className="text-gray-600 text-sm mb-4">查看完整的毛玻璃样式指南</p>
          <a
            href="/GLASS_DESIGN_SYSTEM.md"
            target="_blank"
            className="inline-block w-full glass-hover py-2 rounded-lg text-gray-700 hover:text-purple-600 font-medium"
          >
            查看文档
          </a>
        </div>
      </div>

      {/* 渲染活动的模态框 */}
      {renderModal()}
    </div>
  )
} 