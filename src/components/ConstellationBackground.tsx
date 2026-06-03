import { useEffect, useRef } from 'react'
import { ZODIAC_PATTERNS, type ConstellationPattern } from '../data/constellationPatterns'

const CLUSTER_COUNT = 6
const CHAOS_LINE_COUNT = 4
const EDGE_DRAW_MS = 4200
const CHAOS_PHASE_MS = 5500
const HOLD_MS = 9000
const FADE_MS = 3500
const FLASH_MS = 750

interface WanderLine {
  x1: number
  y1: number
  x2: number
  y2: number
  progress: number
  speed: number
  drift: number
}

interface Cluster {
  pattern: ConstellationPattern
  cx: number
  cy: number
  scale: number
  rotation: number
  phase: 'chaos' | 'forming' | 'hold' | 'fade'
  phaseStart: number
  edgeProgress: number[]
  wander: WanderLine[]
  opacity: number
  /** Время одновременной вспышки звёзд после прорисовки. */
  flashAt: number | null
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function pickPattern(): ConstellationPattern {
  return ZODIAC_PATTERNS[Math.floor(Math.random() * ZODIAC_PATTERNS.length)]!
}

function spawnCluster(width: number, height: number): Cluster {
  const pattern = pickPattern()
  const scale = rand(0.07, 0.14) * Math.min(width, height)
  const wander: WanderLine[] = []
  const cx = rand(scale * 2, width - scale * 2)
  const cy = rand(scale * 2, height - scale * 2)

  for (let i = 0; i < CHAOS_LINE_COUNT; i++) {
    const angle = rand(0, Math.PI * 2)
    const len = scale * rand(0.6, 1.4)
    const mx = cx + Math.cos(angle) * scale * 0.3
    const my = cy + Math.sin(angle) * scale * 0.3
    wander.push({
      x1: mx,
      y1: my,
      x2: mx + Math.cos(angle + rand(-0.8, 0.8)) * len,
      y2: my + Math.sin(angle + rand(-0.8, 0.8)) * len,
      progress: rand(0, 0.35),
      speed: rand(0.000045, 0.00008),
      drift: rand(-0.000015, 0.000015),
    })
  }

  return {
    pattern,
    cx,
    cy,
    scale,
    rotation: rand(0, Math.PI * 2),
    phase: 'chaos',
    phaseStart: performance.now(),
    edgeProgress: pattern.edges.map(() => 0),
    wander,
    opacity: 0,
    flashAt: null,
  }
}

function patternPoint(
  cluster: Cluster,
  star: [number, number],
): { x: number; y: number } {
  const [sx, sy] = star
  const lx = (sx - 0.5) * cluster.scale
  const ly = (sy - 0.5) * cluster.scale
  const cos = Math.cos(cluster.rotation)
  const sin = Math.sin(cluster.rotation)
  return {
    x: cluster.cx + lx * cos - ly * sin,
    y: cluster.cy + lx * sin + ly * cos,
  }
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  progress: number,
  alpha: number,
) {
  const t = Math.min(1, Math.max(0, progress))
  const ex = x1 + (x2 - x1) * t
  const ey = y1 + (y2 - y1) * t
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(ex, ey)
  ctx.strokeStyle = `rgba(210, 195, 255, ${alpha})`
  ctx.lineWidth = 1
  ctx.stroke()
}

/** Вспышка на вершине созвездия (все звёзды одновременно). */
function starFlashStrength(cluster: Cluster, time: number): number {
  if (cluster.flashAt == null) return 0
  const t = (time - cluster.flashAt) / FLASH_MS
  if (t >= 1) return 0
  if (t < 0.12) return t / 0.12
  return 1 - (t - 0.12) / 0.88
}

function drawStarFlash(ctx: CanvasRenderingContext2D, x: number, y: number, strength: number) {
  const core = strength * 0.7
  const halo = strength * 0.45
  const r = 4 + strength * 18

  const outer = ctx.createRadialGradient(x, y, 0, x, y, r)
  outer.addColorStop(0, `rgba(255, 252, 235, ${core})`)
  outer.addColorStop(0.2, `rgba(251, 191, 36, ${halo})`)
  outer.addColorStop(0.5, `rgba(196, 181, 253, ${halo * 0.5})`)
  outer.addColorStop(1, 'rgba(167, 139, 250, 0)')
  ctx.fillStyle = outer
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = `rgba(255, 255, 255, ${core * 0.85})`
  ctx.beginPath()
  ctx.arc(x, y, 1.2 + strength * 2, 0, Math.PI * 2)
  ctx.fill()
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, alpha: number, pulse: number) {
  const r = 1.2 + pulse * 0.6
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, r * 3)
  gradient.addColorStop(0, `rgba(251, 191, 36, ${alpha * 0.9})`)
  gradient.addColorStop(0.4, `rgba(167, 139, 250, ${alpha * 0.35})`)
  gradient.addColorStop(1, 'rgba(167, 139, 250, 0)')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y, r * 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = `rgba(254, 243, 199, ${alpha * 0.75})`
  ctx.beginPath()
  ctx.arc(x, y, r * 0.55, 0, Math.PI * 2)
  ctx.fill()
}

function updateCluster(cluster: Cluster, now: number, width: number, height: number) {
  const elapsed = now - cluster.phaseStart

  if (cluster.phase === 'chaos') {
    cluster.opacity = Math.min(0.34, cluster.opacity + 0.00055)
    for (const w of cluster.wander) {
      w.progress = Math.min(1, w.progress + w.speed * 16)
      w.x1 += w.drift * 16
      w.y1 += w.drift * 0.6 * 16
      w.x2 += w.drift * 0.4 * 16
      w.y2 += w.drift * 16
    }
    if (elapsed > CHAOS_PHASE_MS) {
      cluster.phase = 'forming'
      cluster.phaseStart = now
      cluster.edgeProgress = cluster.pattern.edges.map(() => 0)
    }
  } else if (cluster.phase === 'forming') {
    const targetOpacity = 0.42
    cluster.opacity += (targetOpacity - cluster.opacity) * 0.002
    const edgeStep = 16 / EDGE_DRAW_MS
    cluster.edgeProgress = cluster.edgeProgress.map((p) => Math.min(1, p + edgeStep))
    const allDone = cluster.edgeProgress.every((p) => p >= 1)
    if (allDone && elapsed > 800) {
      cluster.phase = 'hold'
      cluster.phaseStart = now
      cluster.flashAt = now
    }
  } else if (cluster.phase === 'hold') {
    if (elapsed > HOLD_MS) {
      cluster.phase = 'fade'
      cluster.phaseStart = now
    }
  } else if (cluster.phase === 'fade') {
    cluster.opacity = Math.max(0, cluster.opacity - 16 / FADE_MS)
    if (elapsed > FADE_MS) {
      Object.assign(cluster, spawnCluster(width, height))
      cluster.phaseStart = now
    }
  }
}

function renderCluster(ctx: CanvasRenderingContext2D, cluster: Cluster, time: number) {
  const baseAlpha = cluster.opacity
  if (baseAlpha < 0.01) return

  const pulse = (Math.sin(time * 0.0012 + cluster.cx) + 1) * 0.5

  if (cluster.phase === 'chaos' || cluster.phase === 'fade') {
    const chaosAlpha = baseAlpha * (cluster.phase === 'chaos' ? 0.68 : 0.45)
    for (const w of cluster.wander) {
      drawLine(ctx, w.x1, w.y1, w.x2, w.y2, w.progress, chaosAlpha)
    }
  }

  if (cluster.phase === 'forming' || cluster.phase === 'hold' || cluster.phase === 'fade') {
    const formAlpha = baseAlpha * (cluster.phase === 'forming' ? 0.82 : 0.95)
    const points = cluster.pattern.stars.map((s) => patternPoint(cluster, s))
    const flash = starFlashStrength(cluster, time)

    for (let i = 0; i < cluster.pattern.edges.length; i++) {
      const [a, b] = cluster.pattern.edges[i]!
      const p1 = points[a]
      const p2 = points[b]
      if (!p1 || !p2) continue
      const progress = cluster.phase === 'hold' ? 1 : cluster.edgeProgress[i] ?? 0
      drawLine(ctx, p1.x, p1.y, p2.x, p2.y, progress, formAlpha)
    }

    const starAlpha = formAlpha * (0.72 + pulse * 0.28)
    for (const p of points) {
      drawStar(ctx, p.x, p.y, starAlpha, pulse)
    }

    if (flash > 0.02) {
      for (const p of points) {
        drawStarFlash(ctx, p.x, p.y, flash)
      }
    }
  }
}

export function ConstellationBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let dpr = 1
    let clusters: Cluster[] = []
    let raf = 0
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const initClusters = () => {
      clusters = Array.from({ length: CLUSTER_COUNT }, () => {
        const c = spawnCluster(width, height)
        c.phaseStart = performance.now() - rand(0, CHAOS_PHASE_MS + HOLD_MS)
        if (c.phaseStart < performance.now() - CHAOS_PHASE_MS) {
          c.phase = rand(0, 1) > 0.5 ? 'forming' : 'hold'
          c.edgeProgress = c.pattern.edges.map(() => rand(0.2, 1))
          c.opacity = rand(0.14, 0.3)
        }
        return c
      })
    }

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height)
      for (const cluster of clusters) {
        cluster.phase = 'hold'
        cluster.opacity = 0.22
        cluster.edgeProgress = cluster.pattern.edges.map(() => 1)
        renderCluster(ctx, cluster, 0)
      }
    }

    const tick = (time: number) => {
      ctx.clearRect(0, 0, width, height)

      for (const cluster of clusters) {
        updateCluster(cluster, time, width, height)
        renderCluster(ctx, cluster, time)
      }

      // лёгкие пересечения между соседними созвездиями
      for (let i = 0; i < clusters.length - 1; i++) {
        const a = clusters[i]!
        const b = clusters[i + 1]!
        const crossT = 0.25 + ((Math.sin(time * 0.00018 + i * 1.7) + 1) / 2) * 0.5
        drawLine(ctx, a.cx, a.cy, b.cx, b.cy, crossT, 0.075)
      }

      raf = requestAnimationFrame(tick)
    }

    resize()
    initClusters()

    if (reducedMotion) {
      drawStatic()
    } else {
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden
    />
  )
}
