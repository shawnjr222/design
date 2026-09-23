import { useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  animate,
  motion,
  useReducedMotion,
} from 'framer-motion'
import { DesignPage } from './DesignPage'
import { YogaPage } from './YogaPage'
import { preloadSiteAssets } from './lib/preload'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]
const INTRO_ANIM_MS = 3000

type Mode = 'design' | 'yoga'

function Intro({
  onComplete,
  reduceMotion,
}: {
  onComplete: () => void
  reduceMotion: boolean
}) {
  const [progress, setProgress] = useState(0)
  const [progressExact, setProgressExact] = useState(0)
  const [loading, setLoading] = useState(false)
  const assetsReady = useRef(false)
  const animReady = useRef(false)
  const finished = useRef(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const tryFinish = () => {
    if (finished.current) return
    if (!assetsReady.current || !animReady.current) return
    finished.current = true
    // Brief hold at 100%, then AnimatePresence runs the exit fade.
    window.setTimeout(() => onCompleteRef.current(), reduceMotion ? 0 : 420)
  }

  useEffect(() => {
    let cancelled = false

    preloadSiteAssets()
      .catch(() => undefined)
      .then(() => {
        if (cancelled) return
        assetsReady.current = true
        if (reduceMotion) {
          animReady.current = true
        }
        tryFinish()
      })

    // Never leave the loader stuck if something hangs.
    const failsafe = window.setTimeout(() => {
      if (cancelled) return
      assetsReady.current = true
      animReady.current = true
      tryFinish()
    }, 7000)

    return () => {
      cancelled = true
      window.clearTimeout(failsafe)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion])

  useEffect(() => {
    if (reduceMotion) return

    const start = window.setTimeout(() => setLoading(true), 700)
    return () => window.clearTimeout(start)
  }, [reduceMotion])

  useEffect(() => {
    if (!loading || reduceMotion) return

    const controls = animate(0, 100, {
      duration: INTRO_ANIM_MS / 1000,
      ease: [0.45, 0.05, 0.55, 0.95],
      onUpdate: (value) => {
        setProgressExact(value)
        setProgress(Math.round(value))
      },
      onComplete: () => {
        animReady.current = true
        tryFinish()
      },
    })

    return () => {
      controls.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, reduceMotion])

  if (reduceMotion) return null

  return (
    <motion.div
      key="intro"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0c0c0b] text-[#f3f3f1] overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 0,
        transition: {
          duration: 1.05,
          ease: [0.22, 1, 0.36, 1],
        },
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[22vh] bg-gradient-to-t from-[#f3f3f1]/25 via-[#f3f3f1]/08 to-transparent"
        style={{ opacity: progressExact / 100 }}
      />

      <motion.div
        className="relative z-10 flex flex-col items-center gap-8 px-6"
        exit={{
          opacity: 0,
          y: -6,
          transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
        }}
      >
        <div className="overflow-hidden">
          <motion.p
            className="text-[11px] tracking-[0.32em] uppercase text-[#f3f3f1]/45"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease, delay: 0.1 }}
          >
            Loading
          </motion.p>
        </div>

        <motion.div
          className="flex flex-col items-center gap-8"
          initial={{ opacity: 0 }}
          animate={loading ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.35, ease }}
        >
          <div
            className="h-px w-[120px] origin-center bg-[#f3f3f1]/75 will-change-transform"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            style={{ transform: `scaleX(${Math.max(progressExact / 100, 0.02)})` }}
          />

          <p
            className="text-center text-[13px] tabular-nums tracking-[0.08em] text-[#f3f3f1]/55"
            aria-live="polite"
            aria-atomic="true"
          >
            {progress}%
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}


function App() {
  const reduceMotion = useReducedMotion() ?? false
  const [introDone, setIntroDone] = useState(reduceMotion)
  const [ready, setReady] = useState(reduceMotion)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [headerVisible, setHeaderVisible] = useState(true)
  const [mode, setMode] = useState<Mode>('design')
  const lastScrollY = useRef(0)

  const switchMode = (next: Mode) => {
    if (next === mode) return
    setMode(next)
    setHoveredId(null)
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  useEffect(() => {
    if (!introDone) return
    // Start content fade-in mid-way through the ~1s intro exit.
    const t = window.setTimeout(() => setReady(true), reduceMotion ? 0 : 280)
    return () => window.clearTimeout(t)
  }, [introDone, reduceMotion])

  useEffect(() => {
    if (!introDone) return

    // Keep Design / Yoga toggle always reachable on phones and tablets
    const mq = window.matchMedia('(min-width: 1024px)')
    const onScroll = () => {
      if (!mq.matches) {
        setHeaderVisible(true)
        return
      }

      const y = window.scrollY
      const delta = y - lastScrollY.current

      if (y < 24) {
        setHeaderVisible(true)
      } else if (delta > 4) {
        setHeaderVisible(false)
      } else if (delta < -4) {
        setHeaderVisible(true)
      }

      lastScrollY.current = y
    }

    const onMq = () => {
      if (!mq.matches) setHeaderVisible(true)
      lastScrollY.current = window.scrollY
    }

    lastScrollY.current = window.scrollY
    mq.addEventListener('change', onMq)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      mq.removeEventListener('change', onMq)
      window.removeEventListener('scroll', onScroll)
    }
  }, [introDone])

  useEffect(() => {
    if (introDone) {
      document.body.style.overflow = ''
      return
    }
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [introDone])

  return (
    <>
      <div className="ambient" aria-hidden />
      <div className="noise" aria-hidden />

      <AnimatePresence>
        {!introDone && (
          <Intro
            key="intro"
            reduceMotion={reduceMotion}
            onComplete={() => setIntroDone(true)}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 min-h-screen text-[var(--ink)]">
        <motion.header
          className="fixed top-0 left-0 right-0 z-50 px-5 sm:px-8 md:px-10 pt-[env(safe-area-inset-top)]"
          initial={false}
          animate={{
            y: headerVisible ? 0 : -100,
            opacity: headerVisible ? 1 : 0,
          }}
          transition={{ duration: reduceMotion ? 0.01 : 0.35, ease }}
          style={{ pointerEvents: headerVisible ? 'auto' : 'none' }}
        >
          <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-3 py-4 sm:py-5 md:py-6">
            <motion.a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              initial={{ opacity: 0, y: 16 }}
              animate={ready ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.05, ease }}
              className="shrink-0 text-[14px] sm:text-[15px] font-medium tracking-[-0.02em]"
            >
              Shawn Jr
            </motion.a>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={ready ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.1, ease }}
              role="tablist"
              aria-label="Site mode"
              className="shrink-0"
            >
              <div className="flex items-center rounded-full border border-[var(--line)] bg-[var(--bg-elevated)]/90 p-0.5 backdrop-blur-sm shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                {(['design', 'yoga'] as const).map((item) => {
                  const active = mode === item
                  return (
                    <button
                      key={item}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => switchMode(item)}
                      className={`relative min-h-10 min-w-[4.5rem] rounded-full px-3.5 sm:px-4 py-2 text-[12px] sm:text-[13px] tracking-[-0.01em] transition-colors touch-manipulation ${
                        active
                          ? 'text-[var(--ink)]'
                          : 'text-[var(--muted)] hover:text-[var(--ink-soft)]'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="mode-pill"
                          className="absolute inset-0 rounded-full bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                          transition={{
                            type: 'spring',
                            stiffness: 420,
                            damping: 36,
                          }}
                        />
                      )}
                      <span className="relative z-10 capitalize">{item}</span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </div>
        </motion.header>

        <AnimatePresence mode="wait">
          {mode === 'design' ? (
            <motion.div
              key="design"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease }}
            >
              <DesignPage
                ready={ready}
                hoveredId={hoveredId}
                onHover={setHoveredId}
              />
            </motion.div>
          ) : (
            <motion.div
              key="yoga"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease }}
            >
              <YogaPage ready={ready} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

export default App
