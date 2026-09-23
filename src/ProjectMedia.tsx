import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Lottie, LottieSubscription, type LottieHandle } from 'lottie-react'
import { getCachedLottie } from './lib/preload'

type Props = {
  src: string
  alt: string
  priority?: boolean
  loop?: boolean
  className?: string
}

const landEase: [number, number, number, number] = [0.22, 1, 0.36, 1]
const landTransition = { duration: 1, ease: landEase }
/** Wait until the asset is further into view before revealing / playing. */
const PLAY_DELAY_MS = 380

const landHidden = { opacity: 0, scale: 0.94 }
const landVisible = { opacity: 1, scale: 1 }

function isLottie(src: string) {
  return /\.json(\?.*)?$/i.test(src)
}

function isVideo(src: string) {
  return /\.(mp4|webm|mov)(\?.*)?$/i.test(src)
}

/**
 * `revealed` fires once (drives fade + scale-in).
 * `inView` updates continuously (for pausing loop media only).
 */
function useNearViewport() {
  const ref = useRef<HTMLDivElement>(null)
  const [revealed, setRevealed] = useState(false)
  const [inView, setInView] = useState(false)
  const revealedRef = useRef(false)
  const delayRef = useRef<number | null>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const clearDelay = () => {
      if (delayRef.current != null) {
        window.clearTimeout(delayRef.current)
        delayRef.current = null
      }
    }

    const check = () => {
      const rect = node.getBoundingClientRect()
      const vh = window.innerHeight || document.documentElement.clientHeight
      const visibleHeight =
        Math.min(rect.bottom, vh) - Math.max(rect.top, 0)
      const ratio = visibleHeight / Math.max(rect.height, 1)
      const near = ratio >= 0.45 && rect.top < vh * 0.72

      setInView(near)

      if (!near) {
        clearDelay()
        return
      }

      if (revealedRef.current || delayRef.current != null) return

      delayRef.current = window.setTimeout(() => {
        delayRef.current = null
        revealedRef.current = true
        setRevealed(true)
      }, PLAY_DELAY_MS)
    }

    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    const io = new IntersectionObserver(() => check(), {
      threshold: [0, 0.25, 0.45, 0.6, 0.8],
      rootMargin: '0px',
    })
    io.observe(node)

    return () => {
      clearDelay()
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
      io.disconnect()
    }
  }, [])

  return { ref, revealed, inView }
}

export function ProjectMedia({
  src,
  alt,
  priority = false,
  loop = false,
  className,
}: Props) {
  if (isLottie(src)) {
    return <LottieMedia src={src} alt={alt} loop={loop} className={className} />
  }

  if (isVideo(src)) {
    return <VideoMedia src={src} alt={alt} loop={loop} className={className} />
  }

  return (
    <motion.img
      src={src}
      alt={alt}
      decoding="async"
      fetchPriority={priority ? 'high' : 'low'}
      className={`${className ?? ''} origin-center`}
      initial={landHidden}
      whileInView={landVisible}
      viewport={{ once: true, amount: 0.45 }}
      transition={landTransition}
    />
  )
}

function LottieMedia({
  src,
  alt,
  loop,
  className,
}: {
  src: string
  alt: string
  loop: boolean
  className?: string
}) {
  const lottieRef = useRef<LottieHandle>(null)
  const cached = getCachedLottie(src)
  const [ready, setReady] = useState(Boolean(cached))
  const { ref, revealed, inView } = useNearViewport()
  const startedRef = useRef(false)
  const show = ready && revealed

  useEffect(() => {
    if (!show) return
    const handle = lottieRef.current
    if (!handle) return

    if (!loop) {
      if (startedRef.current) return
      startedRef.current = true
      handle.stop()
      handle.play()
      return
    }

    if (inView) handle.play()
    else handle.pause()
  }, [show, inView, loop])

  return (
    <motion.div
      ref={ref}
      className={`${className ?? ''} origin-center`}
      initial={landHidden}
      animate={show ? landVisible : landHidden}
      transition={landTransition}
    >
      <Lottie
        lottieRef={lottieRef}
        src={cached ?? src}
        loop={loop}
        autoplay={false}
        aria-label={alt}
        className="h-full w-full"
        style={{ width: '100%', height: '100%' }}
        rendererSettings={{
          preserveAspectRatio: 'xMidYMid slice',
        }}
        subscriptions={{
          [LottieSubscription.ready]: () => setReady(true),
          [LottieSubscription.error]: () => setReady(true),
        }}
      />
    </motion.div>
  )
}

function VideoMedia({
  src,
  alt,
  loop,
  className,
}: {
  src: string
  alt: string
  loop: boolean
  className?: string
}) {
  const { ref, revealed, inView } = useNearViewport()
  const videoRef = useRef<HTMLVideoElement>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !revealed) return

    if (loop && !inView) {
      video.pause()
      return
    }

    let cancelled = false

    const start = () => {
      if (cancelled) return
      if (!loop) {
        if (startedRef.current && !video.paused) return
        if (!startedRef.current) {
          startedRef.current = true
          try {
            video.currentTime = 0
          } catch {
            // ignore
          }
        }
      }
      void video.play().catch(() => {})
    }

    start()
    const onReady = () => start()
    video.addEventListener('loadeddata', onReady)
    video.addEventListener('canplay', onReady)
    const retry = window.setTimeout(start, 250)

    return () => {
      cancelled = true
      window.clearTimeout(retry)
      video.removeEventListener('loadeddata', onReady)
      video.removeEventListener('canplay', onReady)
    }
  }, [revealed, inView, loop])

  return (
    <motion.div
      ref={ref}
      className={`${className ?? ''} origin-center`}
      initial={landHidden}
      animate={revealed ? landVisible : landHidden}
      transition={landTransition}
    >
      <video
        ref={videoRef}
        src={src}
        aria-label={alt}
        className="h-full w-full object-cover"
        muted
        playsInline
        loop={loop}
        preload="auto"
        autoPlay={false}
      />
    </motion.div>
  )
}
