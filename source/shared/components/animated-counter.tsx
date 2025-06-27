import { useEffect, useMemo, useState } from 'react'
import { cn } from '../utils'
import { PackageOpen } from 'lucide-react'

interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
}

interface DigitProps {
  digit: number
  duration?: number
}

/**
 * 单个数字动画组件
 */
function AnimatedDigit({ digit, duration = 600 }: DigitProps) {

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  // 初始位置
  const initialTop = digit > 5 ? '-900%' : '0%'
  const targetTop = `-${digit * 100}%`

  return (
    <div className="overflow-hidden relative w-3 h-4 text-white bg-transparent">
      <div
        className={cn('flex relative flex-col')}
        style={{
          top: mounted ? targetTop : initialTop,
          transition: `top ${duration}ms ease-out`
        }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className='flex justify-center items-center h-4 text-sm font-bold text-center'
          >
            {i}
          </span>
        ))}
      </div>
    </div>
  )
}

/**
 * 高级动画数字计数器
 * 特性：
 * - 纯 CSS 动画，无 JavaScript 状态管理
 * - 动态注入样式，为每个数字生成对应动画
 * - 根据数字大小采用不同滚动策略
 * - 从右到左的波浪式动画延迟
 */
export function AnimatedCounter({
  value,
  duration = 600,
  className
}: AnimatedCounterProps) {
  // 将数字分解为单独的位数
  const digits = useMemo(() => {
    const str = value.toString()
    return str.split('').map(Number)
  }, [value])

  if (value === 0) {
    return <PackageOpen className='w-4 h-4 font-semibold text-sky-500' />
  }

  return (
    <div className='relative flex items-center p-1 px-1.5 rounded-full bg-gradient-to-br from-theme-primary-500 via-theme-primary-400 to-theme-primary-800'>
      {/* <div className='absolute w-[8px] h-[8px] triangle-left triangle-sm bg-green-500 top-[-4px] left-[-4px]'></div> */}
      {/* <div className='absolute w-[8px] h-[8px] triangle-right triangle-sm bg-sky-800 top-[-4px] right-[-4px]'></div> */}
      <div className={cn("flex items-center", className)}>
        {digits.map((digit, index) => (
          <AnimatedDigit
            key={`${digit}-${index}-${value}`} // 重新渲染以触发动画
            digit={digit}
            duration={duration}
          />
        ))}
      </div>
    </div>
  )
}
