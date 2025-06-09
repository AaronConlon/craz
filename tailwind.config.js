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
      }
    }
  },
  plugins: [
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
    }
  ]
}
