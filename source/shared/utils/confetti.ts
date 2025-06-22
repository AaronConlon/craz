// import confetti from 'canvas-confetti'

// 由于 canvas-confetti 可能未安装，我们提供一个 fallback 实现
let confetti: any = null

// 尝试动态导入 canvas-confetti
const loadConfetti = async () => {
  if (confetti) return confetti

  try {
    const module = await import("canvas-confetti")
    confetti = module.default || module
    return confetti
  } catch (error) {
    console.warn("canvas-confetti not available, using fallback")
    return null
  }
}

// Fallback 实现（使用纯 JavaScript）
const fallbackConfetti = () => {
  const canvas = document.createElement("canvas")
  canvas.style.position = "fixed"
  canvas.style.top = "0"
  canvas.style.left = "0"
  canvas.style.width = "100%"
  canvas.style.height = "100%"
  canvas.style.pointerEvents = "none"
  canvas.style.zIndex = "9999"
  document.body.appendChild(canvas)

  const ctx = canvas.getContext("2d")!
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const colors = [
    "#ff6b6b",
    "#4ecdc4",
    "#45b7d1",
    "#96ceb4",
    "#feca57",
    "#ff9ff3",
    "#54a0ff"
  ]
  const particles: Array<{
    x: number
    y: number
    vx: number
    vy: number
    gravity: number
    life: number
    color: string
    size: number
    rotation: number
    rotationSpeed: number
  }> = []

  for (let i = 0; i < 150; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: -10,
      vx: (Math.random() - 0.5) * 10,
      vy: Math.random() * 3 + 2,
      gravity: 0.3,
      life: Math.random() * 100 + 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2
    })
  }

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]

      p.y += p.vy
      p.x += p.vx
      p.vy += p.gravity
      p.rotation += p.rotationSpeed
      p.life--

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
      ctx.restore()

      if (p.life <= 0 || p.y > canvas.height) {
        particles.splice(i, 1)
      }
    }

    if (particles.length > 0) {
      requestAnimationFrame(animate)
    } else {
      document.body.removeChild(canvas)
    }
  }

  animate()
}

// 成功撒花 - 登录/注册成功时使用
export const celebrateSuccess = async () => {
  const confettiLib = await loadConfetti()

  if (confettiLib) {
    // 使用 canvas-confetti 库
    confettiLib({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57"]
    })

    // 延迟后再来一次
    setTimeout(() => {
      confettiLib({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#ff9ff3", "#54a0ff", "#5f27cd"]
      })
    }, 250)

    setTimeout(() => {
      confettiLib({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#00d2d3", "#ff9f43", "#ee5a24"]
      })
    }, 400)
  } else {
    // 使用 fallback 实现
    fallbackConfetti()
  }
}

// 编辑撒花 - 编辑资料时使用（较温和）
export const celebrateEdit = async () => {
  const confettiLib = await loadConfetti()

  if (confettiLib) {
    confettiLib({
      particleCount: 50,
      spread: 45,
      origin: { y: 0.7 },
      colors: ["#a8e6cf", "#dcedc1", "#ffd3a5", "#ffa8a8"]
    })
  } else {
    // 使用简化版 fallback
    const canvas = document.createElement("canvas")
    canvas.style.position = "fixed"
    canvas.style.top = "0"
    canvas.style.left = "0"
    canvas.style.width = "100%"
    canvas.style.height = "100%"
    canvas.style.pointerEvents = "none"
    canvas.style.zIndex = "9999"
    document.body.appendChild(canvas)

    const ctx = canvas.getContext("2d")!
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const colors = ["#a8e6cf", "#dcedc1", "#ffd3a5", "#ffa8a8"]
    const particles = []

    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height * 0.7,
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * -5 - 2,
        gravity: 0.2,
        life: 80,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 3
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i] as any

        p.y += p.vy
        p.x += p.vx
        p.vy += p.gravity
        p.life--

        ctx.fillStyle = p.color
        ctx.fillRect(p.x, p.y, p.size, p.size)

        if (p.life <= 0 || p.y > canvas.height) {
          particles.splice(i, 1)
        }
      }

      if (particles.length > 0) {
        requestAnimationFrame(animate)
      } else {
        document.body.removeChild(canvas)
      }
    }

    animate()
  }
}

// 重置撒花 - 重置表单时使用（最温和）
export const celebrateReset = async () => {
  const confettiLib = await loadConfetti()

  if (confettiLib) {
    confettiLib({
      particleCount: 30,
      spread: 30,
      origin: { y: 0.8 },
      colors: ["#e1f5fe", "#f3e5f5", "#fff3e0", "#f1f8e9"]
    })
  } else {
    // 最简单的 fallback
    const canvas = document.createElement("canvas")
    canvas.style.position = "fixed"
    canvas.style.top = "0"
    canvas.style.left = "0"
    canvas.style.width = "100%"
    canvas.style.height = "100%"
    canvas.style.pointerEvents = "none"
    canvas.style.zIndex = "9999"
    document.body.appendChild(canvas)

    const ctx = canvas.getContext("2d")!
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const colors = ["#e1f5fe", "#f3e5f5", "#fff3e0", "#f1f8e9"]

    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        const x = Math.random() * canvas.width
        const y = canvas.height * 0.8
        const color = colors[Math.floor(Math.random() * colors.length)]

        ctx.fillStyle = color
        ctx.fillRect(x, y, 4, 4)

        if (i === 29) {
          setTimeout(() => {
            document.body.removeChild(canvas)
          }, 1000)
        }
      }, i * 20)
    }
  }
}
