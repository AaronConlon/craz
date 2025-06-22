/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  darkMode: ['selector', '[data-appearance="dark"] &'],
  content: [
    "./contents/**/*.tsx",
    "./source/**/*.tsx",
    "./popup.tsx",
    "./sidepanel.tsx",
  ],
  safelist: [
    // 强制包含深色模式类
    'dark:bg-gray-900',
    'dark:bg-gray-800',
    'dark:bg-gray-700',
    'dark:bg-gray-600',
    'dark:border-gray-700',
    'dark:border-gray-600',
    'dark:text-white',
    'dark:text-gray-300',
    'dark:text-gray-400',
    'dark:bg-theme-primary-900',
    'dark:hover:border-theme-primary-400',
    // 透明度背景
    'dark:bg-gray-800/80',
    // 主题色相关
    'dark:bg-theme-primary-900',
    'dark:border-theme-primary-700',
    'dark:text-theme-primary-100',
    'dark:text-theme-primary-400'
  ],
  theme: {
    extend: {
      // 自定义毛玻璃效果类
      backdropBlur: {
        'xs': '2px',
      },
      // 主题色配置 - 基于CSS变量
      colors: {
        theme: {
          // 主色调
          'primary': {
            50: 'var(--theme-primary-50)',
            100: 'var(--theme-primary-100)',
            200: 'var(--theme-primary-200)',
            300: 'var(--theme-primary-300)',
            400: 'var(--theme-primary-400)',
            500: 'var(--theme-primary-500)',
            600: 'var(--theme-primary-600)',
            700: 'var(--theme-primary-700)',
            800: 'var(--theme-primary-800)',
            900: 'var(--theme-primary-900)',
          },
          // 背景色
          'bg': {
            'primary': 'var(--theme-bg-primary)',
            'secondary': 'var(--theme-bg-secondary)',
            'accent': 'var(--theme-bg-accent)',
          },
          // 文本色
          'text': {
            'primary': 'var(--theme-text-primary)',
            'secondary': 'var(--theme-text-secondary)',
            'accent': 'var(--theme-text-accent)',
          },
          // 边框色
          'border': {
            'primary': 'var(--theme-border-primary)',
            'secondary': 'var(--theme-border-secondary)',
          },
          'spacing': {

          }
        }
      },
      // 字体大小配置 - 基于CSS变量
      fontSize: {
        'xs': ['var(--font-size-xs)', { lineHeight: 'var(--theme-line-height-xs)' }],
        'sm': ['var(--font-size-sm)', { lineHeight: 'var(--theme-line-height-sm)' }],
        'base': ['var(--font-size-base)', { lineHeight: 'var(--theme-line-height-base)' }],
        'lg': ['var(--font-size-lg)', { lineHeight: 'var(--theme-line-height-lg)' }],
        'xl': ['var(--font-size-xl)', { lineHeight: 'var(--theme-line-height-xl)' }],
        '2xl': ['var(--font-size-2xl)', { lineHeight: 'var(--theme-line-height-2xl)' }],
        '3xl': ['var(--font-size-3xl)', { lineHeight: 'var(--theme-line-height-3xl)' }],
      },
      // 间距配置 - 基于字体大小的相对间距
      spacing: {
        'theme-xs': 'var(--theme-spacing-xs)',
        'theme-sm': 'var(--theme-spacing-sm)',
        'theme-base': 'var(--theme-spacing-base)',
        'theme-lg': 'var(--theme-spacing-lg)',
        'theme-xl': 'var(--theme-spacing-xl)',
      },
    }
  },
  plugins: [
    require('tailwindcss-animated'),
    // 添加自定义毛玻璃工具类
    function ({ addUtilities }) {
      const glassUtils = {
        // 基础毛玻璃效果
        '.glass': {
          'background': 'rgba(255, 255, 255, 0.1)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 255, 255, 0.2)',
        },
        // 毛玻璃容器 - 用于主要容器
        '.glass-container': {
          'background': 'linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1))',
          'backdrop-filter': 'blur(20px)',
          'border': '1px solid rgba(255, 255, 255, 0.3)',
          'box-shadow': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        },
        // 毛玻璃卡片 - 用于内容区域
        '.glass-card': {
          'background': 'rgba(255, 255, 255, 0.2)',
          'backdrop-filter': 'blur(8px)',
          'border': '1px solid rgba(255, 255, 255, 0.2)',
        },
        // 毛玻璃输入框
        '.glass-input': {
          'background': 'rgba(255, 255, 255, 0.9)',
          'backdrop-filter': 'blur(4px)',
          'border': '1px solid rgba(255, 255, 255, 0.3)',
        },
        // 毛玻璃遮罩
        '.glass-overlay': {
          'background': 'linear-gradient(135deg, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.3))',
          'backdrop-filter': 'blur(4px)',
        },
        // 毛玻璃按钮悬停效果
        '.glass-hover': {
          'transition': 'all 0.2s ease-in-out',
          '&:hover': {
            'background': 'rgba(255, 255, 255, 0.3)',
            'backdrop-filter': 'blur(6px)',
          }
        },
        // 激活状态的毛玻璃效果
        '.glass-active': {
          'background': 'rgba(59, 130, 246, 0.2)',
          'backdrop-filter': 'blur(8px)',
          'border-left': '4px solid rgba(59, 130, 246, 0.8)',
        }
      }

      addUtilities(glassUtils)
    },
    // 添加三角形工具类
    function ({ addUtilities }) {
      const triangleUtils = {
        // 左上直角三角形 (0,0 → 100,0 → 0,100)
        '.triangle-left': {
          'clip-path': 'polygon(0% 0%, 100% 0%, 0% 100%)',
          '-webkit-clip-path': 'polygon(0% 0%, 100% 0%, 0% 100%)',
        },
        // 右上直角三角形 (0,0 → 100,0 → 100,100)
        '.triangle-right': {
          'clip-path': 'polygon(0% 0%, 100% 0%, 100% 100%)',
          '-webkit-clip-path': 'polygon(0% 0%, 100% 0%, 100% 100%)',
        },
        // 三角形基础样式
        '.triangle-base': {
          'position': 'absolute',
          'width': '20px',
          'height': '20px',
        },
        // 三角形大小变体
        '.triangle-sm': {
          'width': '12px',
          'height': '12px',
        },
        '.triangle-md': {
          'width': '20px',
          'height': '20px',
        },
        '.triangle-lg': {
          'width': '32px',
          'height': '32px',
        },
        '.triangle-xl': {
          'width': '48px',
          'height': '48px',
        }
      }

      addUtilities(triangleUtils)
    }
  ]
}
