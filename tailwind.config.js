/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  darkMode: "class",
  content: ["./contents/*.tsx", "./source/**/*.tsx"],
  theme: {
    extend: {
      // 自定义毛玻璃效果类
      backdropBlur: {
        'xs': '2px',
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
