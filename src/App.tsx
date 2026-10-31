import { useEffect, useRef, useState } from 'react'
import {
  AnimatePresence,
  animate,
  motion,
  useReducedMotion,
} from 'framer-motion'
import { DesignPage } from './DesignPage'
import { YogaPage } from './YogaPage'
import { NotFoundPage } from './NotFoundPage'
import { applyNotFoundSeo, applySeo, normalizePath, routeForPath } from './lib/seo'
import type { RouteKey } from './lib/seo'
import { preloadSiteAssets } from './lib/preload'
import { IntroName } from './IntroName'
import { AboutModal } from './AboutModal'
import { aboutBio, aboutReference, aboutTitle } from './content/about'
import { yogaContent } from './content/yoga'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]
const INTRO_ANIM_MS = 1500

type Mode = 'design' | 'yoga'

/** Current URL as a route key, or null when it matches no page (404). */
function currentRoute(): RouteKey | null {
  return routeForPath(window.location.pathname)
}

function modeFor(route: RouteKey | null): Mode {
  return route === '/yoga/' ? 'yoga' : 'design'
}

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
  const choreoDone = useRef(false)
  const finished = useRef(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const tryFinish = () => {
    if (finished.current) return
    if (!assetsReady.current || !animReady.current || !choreoDone.current) return
    finished.current = true
    // Brief hold at 100%, then AnimatePresence runs the exit fade.
    window.setTimeout(() => onCompleteRef.current(), reduceMotion ? 0 : 300)
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
          choreoDone.current = true
        }
        tryFinish()
      })

    // Never leave the loader stuck if something hangs.
    const failsafe = window.setTimeout(() => {
      if (cancelled) return
      assetsReady.current = true
      animReady.current = true
      choreoDone.current = true
      tryFinish()
    }, 9000)

    return () => {
      cancelled = true
      window.clearTimeout(failsafe)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion])

  useEffect(() => {
    if (reduceMotion) return

    const start = window.setTimeout(() => setLoading(true), 300)
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

  const fill = Math.min(Math.max(progressExact, 0), 100)

  return (
    <motion.div
      key="intro"
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[var(--bg)] text-[var(--ink)]"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 0,
        transition: {
          duration: 0.8,
          ease: [0.22, 1, 0.36, 1],
        },
      }}
    >
      <IntroName
        fill={fill}
        progress={progress}
        onDone={() => {
          choreoDone.current = true
          tryFinish()
        }}
      />
    </motion.div>
  )
}

function App() {
  const reduceMotion = useReducedMotion() ?? false
  const [introDone, setIntroDone] = useState(reduceMotion)
  const [ready, setReady] = useState(reduceMotion)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [route, setRoute] = useState<RouteKey | null>(currentRoute)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [aboutOrigin, setAboutOrigin] = useState<DOMRect | null>(null)
  const mode = modeFor(route)

  const navigate = (path: string) => {
    const next = routeForPath(path)
    if (next === route) {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
      return
    }
    window.history.pushState({}, '', path)
    setRoute(next)
    setHoveredId(null)
    // The scroll back to the top happens once the old page has faded out (see onExitComplete),
    // so the new page's load-in plays at the top of the screen where it can be seen.
  }

  const switchMode = (next: Mode) => navigate(next === 'yoga' ? '/yoga/' : '/')

  useEffect(() => {
    const onPop = () => setRoute(currentRoute())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Keep title, description, canonical and structured data in step with the URL.
  useEffect(() => {
    if (route) applySeo(route)
    else applyNotFoundSeo()
    if (route && normalizePath(window.location.pathname) !== route) {
      window.history.replaceState({}, '', route)
    }
  }, [route])

  useEffect(() => {
    if (!introDone) return
    // Start content fade-in mid-way through the ~1s intro exit.
    const t = window.setTimeout(() => setReady(true), reduceMotion ? 0 : 280)
    return () => window.clearTimeout(t)
  }, [introDone, reduceMotion])

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
        {/* The header, and the Design / Yoga toggle with it, stays put at every width and scroll speed */}
        <header className="fixed top-0 left-0 right-0 z-50 page-pad-x pt-[env(safe-area-inset-top)]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[calc(100%+1.25rem)] bg-gradient-to-b from-[var(--bg)] from-60% to-transparent"
          />
          <div className="relative mx-auto flex w-full max-w-[1120px] items-center justify-between gap-3 py-4 sm:py-5 md:py-6">
            <motion.button
              type="button"
              aria-haspopup="dialog"
              onClick={(e) => {
                setAboutOrigin(e.currentTarget.getBoundingClientRect())
                setAboutOpen(true)
              }}
              initial={{ opacity: 0, y: 16 }}
              animate={ready ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.05, ease }}
              className="about-link relative shrink-0 cursor-pointer text-[14px] sm:text-[15px] font-medium tracking-[-0.02em]"
            >
              About<span className="sr-only"> Shawn Jr</span>
            </motion.button>

            <motion.nav
              initial={{ opacity: 0, y: 16 }}
              animate={ready ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.1, ease }}
              aria-label="Site mode"
              className="shrink-0"
            >
              <div className="flex items-center rounded-full border border-[var(--line)] bg-[var(--bg-elevated)]/90 p-0.5 backdrop-blur-sm shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                {(['design', 'yoga'] as const).map((item) => {
                  const active = mode === item
                  return (
                    <a
                      key={item}
                      href={item === 'yoga' ? '/yoga/' : '/'}
                      aria-current={active ? 'page' : undefined}
                      onClick={(e) => {
                        e.preventDefault()
                        switchMode(item)
                      }}
                      className={`relative inline-flex items-center justify-center min-h-10 min-w-[4.5rem] rounded-full px-3.5 sm:px-4 py-2 text-[12px] sm:text-[13px] tracking-[-0.01em] transition-[color,opacity] duration-300 touch-manipulation ${
                        active
                          ? 'text-[var(--ink)]'
                          : 'text-[var(--muted)] hover:opacity-60'
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
                      <span className="relative z-10 capitalize leading-[normal] sm:leading-[inherit]">{item}</span>
                    </a>
                  )
                })}
              </div>
            </motion.nav>
          </div>
        </header>

        <AnimatePresence
          mode="wait"
          onExitComplete={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })}
        >
          <motion.div
            key={route ?? '404'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease }}
          >
            {route === null ? (
              <NotFoundPage onNavigate={navigate} />
            ) : route === '/' ? (
              <DesignPage
                ready={ready}
                hoveredId={hoveredId}
                onHover={setHoveredId}
                onNavigate={navigate}
              />
            ) : (
              <YogaPage ready={ready} onNavigate={navigate} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
          <AboutModal
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        origin={aboutOrigin}
        photo={mode === 'yoga' ? yogaContent.about.photo : aboutReference.photo}
        alt={
          mode === 'yoga'
            ? 'Portrait of Shawn Jr, yoga teacher in San Francisco'
            : 'Portrait of Shawn Jr, product designer based in San Francisco'
        }
        label={mode === 'yoga' ? yogaContent.about.title : aboutTitle}
        bio={mode === 'yoga' ? yogaContent.about.bio : aboutBio}
        photoClassName={mode === 'yoga' ? 'object-[center_28%]' : ''}
      />
    </>
  )
}

export default App
