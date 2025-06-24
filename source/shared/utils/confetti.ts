import confetti from "canvas-confetti";





// 成功撒花 - 登录/注册成功时使用
export const celebrateSuccess = async (domRef: React.RefObject<HTMLDivElement>) => {
  const canvas = document.createElement("canvas")
  domRef.current?.appendChild(canvas)

  // 设置 canvas 样式让它覆盖整个容器
  canvas.style.position = "absolute"
  canvas.style.top = "0"
  canvas.style.left = "0"
  canvas.style.width = "100%"
  canvas.style.height = "100%"
  canvas.style.pointerEvents = "none"
  canvas.style.zIndex = `${Number.MAX_SAFE_INTEGER}`

  const myConfetti = confetti.create(canvas, {
    resize: true,
    useWorker: true
  })

  // 设置撒花从屏幕中心开始
  myConfetti({
    particleCount: 100,
    spread: 70,
    origin: {
      x: 0.5, // 水平中心
      y: 0.5 // 垂直中心
    }
  })

  setTimeout(() => {
    // clear canvas
    canvas.remove()
  }, 1000)
}