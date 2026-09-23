import { projects } from '../content/projects'
import { aboutReference } from '../content/about'
import { yogaContent } from '../content/yoga'
import { warmUpcomingClasses } from './schedule'

function isLottie(src: string) {
  return /\.json(\?.*)?$/i.test(src)
}

function isVideo(src: string) {
  return /\.(mp4|webm|mov)(\?.*)?$/i.test(src)
}

/** Raster/GIF media rendered via <img>. */
export const SITE_IMAGES = [
  aboutReference.photo,
  yogaContent.about.photo,
  ...projects
    .map((p) => p.image)
    .filter((src) => !isLottie(src) && !isVideo(src)),
] as const

/** Video media warmed in the background (does not block intro). */
export const SITE_VIDEOS = projects
  .map((p) => p.image)
  .filter((src) => isVideo(src))

/** Lottie JSON fetched + cached during intro. */
export const SITE_LOTTIES = projects
  .map((p) => p.image)
  .filter((src) => isLottie(src))

const SITE_FONTS = [
  { family: 'Aeonik', url: '/fonts/Aeonik-Regular.ttf', weight: '400' },
  { family: 'Aeonik', url: '/fonts/Aeonik-Medium.ttf', weight: '500' },
  { family: 'Aeonik', url: '/fonts/Aeonik-Bold.ttf', weight: '700' },
] as const

/** In-memory Lottie payloads so ProjectMedia can skip a second fetch. */
const lottieCache = new Map<string, object>()

export function getCachedLottie(src: string) {
  return lottieCache.get(src) ?? null
}

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return new Promise<T | void>((resolve) => {
    const t = window.setTimeout(() => resolve(), ms)
    promise
      .then((value) => {
        window.clearTimeout(t)
        resolve(value)
      })
      .catch(() => {
        window.clearTimeout(t)
        resolve()
      })
  })
}

function preloadImage(src: string) {
  return new Promise<void>((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      if (typeof img.decode === 'function') {
        img.decode().then(() => resolve()).catch(() => resolve())
      } else {
        resolve()
      }
    }
    img.onerror = () => resolve()
    img.src = src
  })
}

async function preloadLottie(src: string) {
  try {
    const res = await fetch(src)
    if (!res.ok) return
    const data = (await res.json()) as object
    lottieCache.set(src, data)
  } catch {
    // Allow intro to finish if a Lottie fails.
  }
}

function warmVideo(src: string) {
  const video = document.createElement('video')
  video.preload = 'auto'
  video.muted = true
  video.playsInline = true
  video.src = src
  video.load()
}

async function preloadFonts() {
  if (typeof FontFace === 'undefined' || !document.fonts) return

  await Promise.all(
    SITE_FONTS.map(async (font) => {
      try {
        const face = new FontFace(font.family, `url(${font.url})`, {
          weight: font.weight,
          style: 'normal',
          display: 'swap',
        })
        const loaded = await withTimeout(face.load(), 2500)
        if (loaded) document.fonts.add(loaded)
      } catch {
        // Still allow the intro to finish if a font fails.
      }
    }),
  )
}

export type PreloadProgress = (ratio: number) => void

/**
 * Gate the intro on images, Lotties, fonts, and the yoga schedule.
 * Large MP4s are warmed in the background so they don't freeze the loader.
 */
export async function preloadSiteAssets(onProgress?: PreloadProgress) {
  const units = SITE_IMAGES.length + SITE_LOTTIES.length + 1 + 1
  let done = 0

  const tick = () => {
    done += 1
    onProgress?.(Math.min(1, done / units))
  }

  onProgress?.(0)

  // Kick videos immediately, but don't await them.
  for (const src of SITE_VIDEOS) warmVideo(src)

  await Promise.all([
    ...SITE_IMAGES.map((src) => withTimeout(preloadImage(src), 6000).then(tick)),
    ...SITE_LOTTIES.map((src) => withTimeout(preloadLottie(src), 8000).then(tick)),
    withTimeout(preloadFonts(), 3000).then(tick),
    withTimeout(
      warmUpcomingClasses(30).then(() => undefined).catch(() => undefined),
      4000,
    ).then(tick),
  ])

  onProgress?.(1)
}
