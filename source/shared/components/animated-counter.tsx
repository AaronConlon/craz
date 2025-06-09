import { useState, useEffect } from 'react'
import { cn } from '../utils'

interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
  prefix?: string
  suffix?: string
}

/**
 * macOS 风格的动画数字计数器
 */
export function AnimatedCounter({
  value,
  duration = 800,
  className,
  prefix = '',
  suffix = ''
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (displayValue === value) return

    setIsAnimating(true)
    const startValue = displayValue
    const diff = value - startValue
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // 使用 macOS 风格的缓动函数 (ease-out-cubic)
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)
      const currentValue = Math.round(startValue + diff * easeOutCubic)

      setDisplayValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration, displayValue])

  return (
    <span className={cn(
      "font-mono text-sm font-bold transition-all duration-300 select-none",
      isAnimating && "text-blue-600 scale-110",
      className
    )}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  )
} 