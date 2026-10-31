import { useEffect, useRef } from 'react'

const VIEW_W = 1200
const VIEW_H = 440
const FONT_SIZE = 200
const BASELINE = 292
const TEXT = 'Shawn Jr'
/** How far inside the letter edge the outline runs, in canvas units, so nothing can poke outside the fill. */
const INSET = 3

/* Timing, in seconds */
/** The outline starts drawing almost straight away. */
const DRAW_START = 0.15
const DRAW_SECONDS = 1.1
/** A short beat between the outline being complete and the fill starting. */
const BEAT = 0.08
const FILL_SECONDS = 0.6

type Prepared = {
  /** Outline loops, resampled to evenly spaced points: [x0, y0, x1, y1, ...]. */
  loops: Float32Array[]
}

function setupText(c: CanvasRenderingContext2D) {
  c.font = `700 ${FONT_SIZE}px Aeonik, sans-serif`
  c.textAlign = 'center'
  c.textBaseline = 'alphabetic'
  if ('letterSpacing' in c) (c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${-0.03 * FONT_SIZE}px`
}

/** Follows the edges of a binary mask into closed loops of corner points. */
function traceLoops(mask: Uint8Array): number[][] {
  const VW = VIEW_W + 1
  const out = new Map<number, number[]>()
  const add = (x1: number, y1: number, x2: number, y2: number) => {
    const k = y1 * VW + x1
    const a = out.get(k)
    if (a) a.push(y2 * VW + x2)
    else out.set(k, [y2 * VW + x2])
  }
  for (let y = 0; y < VIEW_H; y++) {
    for (let x = 0; x < VIEW_W; x++) {
      if (!mask[y * VIEW_W + x]) continue
      if (y === 0 || !mask[(y - 1) * VIEW_W + x]) add(x, y, x + 1, y)
      if (x === VIEW_W - 1 || !mask[y * VIEW_W + x + 1]) add(x + 1, y, x + 1, y + 1)
      if (y === VIEW_H - 1 || !mask[(y + 1) * VIEW_W + x]) add(x + 1, y + 1, x, y + 1)
      if (x === 0 || !mask[y * VIEW_W + x - 1]) add(x, y + 1, x, y)
    }
  }
  const loops: number[][] = []
  while (out.size) {
    const start = out.keys().next().value as number
    const pts: number[] = []
    let cur = start
    for (let guard = 0; guard < 200000; guard++) {
      pts.push(cur % VW, Math.floor(cur / VW))
      const arr = out.get(cur)
      if (!arr) break
      const next = arr.pop() as number
      if (!arr.length) out.delete(cur)
      cur = next
      if (cur === start) break
    }
    if (pts.length >= 40) loops.push(pts)
  }
  return loops
}

/** Smooths the pixel staircase and resamples a loop to points about `step` apart. */
function smoothLoop(raw: number[], step: number): Float32Array {
  const n = raw.length / 2
  let xs = new Float32Array(n)
  let ys = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    xs[i] = raw[i * 2]
    ys[i] = raw[i * 2 + 1]
  }
  // Moving average over neighbouring corners, a few passes: rounds the staircase into a smooth curve
  for (let pass = 0; pass < 3; pass++) {
    const nx = new Float32Array(n)
    const ny = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      let sx = 0
      let sy = 0
      for (let k = -4; k <= 4; k++) {
        const j = (i + k + n) % n
        sx += xs[j]
        sy += ys[j]
      }
      nx[i] = sx / 9
      ny[i] = sy / 9
    }
    xs = nx
    ys = ny
  }
  // Resample at an even spacing along the length
  const pts: number[] = []
  let carry = 0
  pts.push(xs[0], ys[0])
  for (let i = 1; i <= n; i++) {
    const ax = xs[i - 1]
    const ay = ys[i - 1]
    const bx = xs[i % n]
    const by = ys[i % n]
    const seg = Math.hypot(bx - ax, by - ay)
    let d = step - carry
    while (d <= seg) {
      const f = d / seg
      pts.push(ax + (bx - ax) * f, ay + (by - ay) * f)
      d += step
    }
    carry = seg - (d - step)
  }
  return Float32Array.from(pts)
}

/** Reads the real shape of the name: smooth outline loops just inside the letters. */
function prepare(): Prepared {
  const off = document.createElement('canvas')
  off.width = VIEW_W
  off.height = VIEW_H
  const c = off.getContext('2d', { willReadFrequently: true })!
  setupText(c)
  c.fillStyle = '#000'
  c.fillText(TEXT, VIEW_W / 2, BASELINE)
  const px = c.getImageData(0, 0, VIEW_W, VIEW_H).data
  const inside = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < VIEW_W && y < VIEW_H && px[(y * VIEW_W + x) * 4 + 3] > 127

  // The letters eroded by INSET: a pixel survives only if the letter reaches INSET away in every direction
  const mask = new Uint8Array(VIEW_W * VIEW_H)
  for (let y = 0; y < VIEW_H; y++) {
    for (let x = 0; x < VIEW_W; x++) {
      if (
        inside(x, y) &&
        inside(x + INSET, y) &&
        inside(x - INSET, y) &&
        inside(x, y + INSET) &&
        inside(x, y - INSET) &&
        inside(x + 2, y + 2) &&
        inside(x - 2, y + 2) &&
        inside(x + 2, y - 2) &&
        inside(x - 2, y - 2)
      ) {
        mask[y * VIEW_W + x] = 1
      }
    }
  }

  return { loops: traceLoops(mask).map((raw) => smoothLoop(raw, 1.5)) }
}

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)
const easeInOut = (v: number) => (v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2)

/**
 * The loader's name, in two beats: a thin outline draws itself around the letters, then the outline fills
 * with ink as the site finishes loading. Drawn on a canvas at full device resolution.
 */
export function IntroName({ fill, progress, onDone }: { fill: number; progress: number; onDone?: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const fillRef = useRef(fill)
  fillRef.current = fill
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Full device resolution: one canvas pixel is one screen pixel, so nothing is resampled
    const dpr = Math.min(window.devicePixelRatio || 1, 3)
    let data: Prepared | null = null
    let raf = 0
    let alive = true
    let t0 = performance.now()
    let reported = false

    // Everything that depends on size or colour is worked out once, not every frame
    let s = 1
    let ox = 0
    let oy = 0
    let targetCss = 1
    let ink = '#111110'
    // A light gray for the outline, well behind the ink of the finished name
    const gray = '#bdbdb7'
    const layout = () => {
      canvas.width = Math.round(canvas.clientWidth * dpr)
      canvas.height = Math.round(canvas.clientHeight * dpr)
      targetCss = Math.min(Math.max(canvas.clientWidth * 0.28, 190), 300)
      s = (targetCss * dpr) / VIEW_W
      ox = Math.round((canvas.width - VIEW_W * s) / 2)
      oy = Math.round((canvas.height - VIEW_H * s) / 2)
      const cs = getComputedStyle(canvas)
      ink = cs.color || ink
    }
    layout()
    const ro = new ResizeObserver(layout)
    ro.observe(canvas)

    // Wait for the real typeface, so the outline traces the right letterforms
    const ready = document.fonts?.load(`700 ${FONT_SIZE}px Aeonik`) ?? Promise.resolve()
    void ready.catch(() => undefined).then(() => {
      if (!alive) return
      data = prepare()
      t0 = performance.now()
    })

    const frame = (now: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.setTransform(s, 0, 0, s, ox, oy)

      if (data) {
        const t = (now - t0) / 1000
        const draw = easeInOut(clamp01((t - DRAW_START) / DRAW_SECONDS))
        const fillStart = DRAW_START + DRAW_SECONDS + BEAT
        // Time paces the fill so it is smooth, and it never gets ahead of how much has really loaded
        const paced = clamp01((t - fillStart) / FILL_SECONDS)
        const load = clamp01((fillRef.current - 5) / 95)
        const k = Math.min(paced, load)
        const amount = k * k * (3 - 2 * k)
        if (!reported && amount > 0.995) {
          reported = true
          doneRef.current?.()
        }

        // Line width in canvas units, from CSS pixels, so it looks the same on every screen
        const lineW = (1.5 * dpr) / s

        // 1. The outline, drawing itself along each loop
        if (draw > 0.001) {
          ctx.strokeStyle = gray
          ctx.lineWidth = lineW
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.beginPath()
          for (const l of data.loops) {
            const count = l.length / 2
            const upTo = Math.max(1, Math.floor(count * draw))
            ctx.moveTo(l[0], l[1])
            for (let i = 1; i < upTo; i++) ctx.lineTo(l[i * 2], l[i * 2 + 1])
            if (draw >= 0.999) ctx.closePath()
          }
          ctx.stroke()
        }

        // 2. The fill, over the outline
        if (amount > 0.002) {
          ctx.globalAlpha = amount
          setupText(ctx)
          ctx.fillStyle = ink
          ctx.fillText(TEXT, VIEW_W / 2, BASELINE)
          ctx.globalAlpha = 1
        }
      }
      if (alive) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <div
      className="absolute inset-0 text-[var(--ink)]"
      role="progressbar"
      aria-label="Loading"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
    >
      <h1 className="sr-only">Shawn Jr</h1>
      <canvas ref={ref} aria-hidden className="block h-full w-full" />
    </div>
  )
}
