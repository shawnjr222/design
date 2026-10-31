import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Lottie, LottieSubscription, type LottieHandle } from 'lottie-react'
import { getCachedLottie, getCachedVideo } from './lib/preload'

type Props = {
  src: string
  alt: string
  priority?: boolean
  loop?: boolean
  className?: string
  /** Reveal as soon as any of it peeks into view (for the first project, which can sit half off-screen). */
  peek?: boolean
  /** Hold the reveal until the row around it is ready (page loaded and row on screen). */
  reveal?: boolean
  /** Seconds to wait after `reveal` before fading in, so the media lands just behind its text. */
  revealDelay?: number
}

const landEase: [number, number, number, number] = [0.22, 1, 0.36, 1]
const landTransition = { duration: 1, ease: landEase }
/** Extra hold once the asset qualifies as in view, before it reveals. None: it reveals straight away. */
const PLAY_DELAY_MS = 0

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
function useNearViewport(peek = false) {
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

      // A peeking first video counts as in view straight away, so it is already playing (and showing a
      // picture) as it scrolls up, instead of waiting until it is high on the screen and popping in.
      setInView(peek ? ratio > 0.04 : near)

      // Normally media waits until it is mostly on screen; a peeking first image reveals right away.
      const eligible = peek ? ratio > 0.04 : near
      if (!eligible) {
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
      threshold: [0, 0.05, 0.25, 0.45, 0.6, 0.8],
      rootMargin: '0px',
    })
    io.observe(node)

    return () => {
      clearDelay()
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
      io.disconnect()
    }
  }, [peek])

  return { ref, revealed, inView }
}

export function ProjectMedia({
  src,
  alt,
  priority = false,
  loop = false,
  className,
  peek = false,
  reveal = true,
  revealDelay = 0,
}: Props) {
  const gate = { peek, reveal, revealDelay }
  if (isLottie(src)) {
    return <LottieMedia src={src} alt={alt} loop={loop} className={className} {...gate} />
  }

  if (isVideo(src)) {
    return <VideoMedia src={src} alt={alt} loop={loop} className={className} {...gate} />
  }

  return (
    <motion.img
      src={src}
      alt={alt}
      decoding="async"
      fetchPriority={priority ? 'high' : 'low'}
      className={`${className ?? ''} origin-center overflow-hidden rounded-[1rem]`}
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
  peek,
  reveal,
  revealDelay,
}: {
  src: string
  alt: string
  loop: boolean
  className?: string
  peek: boolean
  reveal: boolean
  revealDelay: number
}) {
  const lottieRef = useRef<LottieHandle>(null)
  const cached = getCachedLottie(src)
  const [ready, setReady] = useState(Boolean(cached))
  const { ref, revealed, inView } = useNearViewport(peek)
  const startedRef = useRef(false)
  const show = ready && revealed && reveal

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
      className={`${className ?? ''} origin-center overflow-hidden rounded-[1rem]`}
      initial={landHidden}
      animate={show ? landVisible : landHidden}
      transition={{ ...landTransition, delay: revealDelay }}
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
  peek,
  reveal,
  revealDelay,
}: {
  src: string
  alt: string
  loop: boolean
  className?: string
  peek: boolean
  reveal: boolean
  revealDelay: number
}) {
  const cachedSrc = getCachedVideo(src)
  const { ref, revealed, inView } = useNearViewport(peek)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Safari decides whether a video may autoplay from its muted attribute, and React only sets the property
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = true
    video.defaultMuted = true
    video.setAttribute('muted', '')
    video.setAttribute('playsinline', '')
  }, [])

  // Make sure a first frame is painted even while the video is paused, so the area is never blank
  // before it plays (some mobile browsers do not draw a paused video until it has been nudged).
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const paint = () => {
      if (video.paused && video.currentTime === 0) {
        try {
          video.currentTime = 0.01
        } catch {
          // ignore
        }
      }
    }
    video.addEventListener('loadeddata', paint)
    if (video.readyState >= 2) paint()
    return () => video.removeEventListener('loadeddata', paint)
  }, [])
  const startedRef = useRef(false)
  const endedRef = useRef(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video || loop) return
    const onEnded = () => {
      endedRef.current = true
    }
    video.addEventListener('ended', onEnded)
    return () => video.removeEventListener('ended', onEnded)
  }, [loop])

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
        // Play-once media: after it has finished, never restart it (a play() on an ended video rewinds it).
        if (endedRef.current || video.ended) return
        if (!startedRef.current) {
          startedRef.current = true
          try {
            video.currentTime = 0
          } catch {
            // ignore
          }
        }
      }
      if (video.paused) void video.play().catch(() => {})
    }

    start()
    const onReady = () => start()
    video.addEventListener('loadeddata', onReady)
    video.addEventListener('canplay', onReady)
    // A browser can refuse or interrupt playback (autoplay rules, the tab being hidden, scrolling away
    // and back). Keep nudging while the video is on screen until it is playing or has finished, so it
    // can never be left stuck on a frame with the designs missing.
    const keepPlaying = window.setInterval(() => {
      if (inView) start()
    }, 400)
    const onVisible = () => {
      if (document.visibilityState === 'visible' && inView) start()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      window.clearInterval(keepPlaying)
      video.removeEventListener('loadeddata', onReady)
      video.removeEventListener('canplay', onReady)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [revealed, inView, loop])

  return (
    <motion.div
      ref={ref}
      className={`${className ?? ''} origin-center overflow-hidden rounded-[1rem]`}
      initial={landHidden}
      animate={revealed && reveal ? landVisible : landHidden}
      transition={{ ...landTransition, delay: revealDelay }}
    >
      <video
        ref={videoRef}
        src={cachedSrc ?? src}
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
