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
import { AboutPage } from './AboutPage'
import type { AboutContext } from './AboutPage'
import { SiteNav } from './SiteNav'
import type { NavKey } from './SiteNav'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]
const INTRO_ANIM_MS = 1500

/** Current URL as a route key, or null when it matches no page (404). */
function currentRoute(): RouteKey | null {
  return routeForPath(window.location.pathname)
}

/** Which tab of the top nav is lit for a route (404 keeps Design lit). */
function navFor(route: RouteKey | null): NavKey {
  return route === '/yoga/' ? 'yoga' : route === '/about/' ? 'about' : 'design'
}

/** The About page opens on Design, unless a link asks for the other side in the address (?for=yoga). */
function initialAboutContext(): AboutContext {
  const asked = new URLSearchParams(window.location.search).get('for')
  return asked === 'yoga' ? 'yoga' : 'design'
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
  const [aboutContext, setAboutContext] = useState<AboutContext>(initialAboutContext)

  const navigate = (path: string) => {
    const next = routeForPath(path)
    if (next === route) {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
      return
    }
    // About always opens on Design.
    if (next === '/about/') setAboutContext('design')
    window.history.pushState({}, '', next === '/about/' ? '/about/?for=design' : path)
    setRoute(next)
    setHoveredId(null)
    // The scroll back to the top happens once the old page has faded out (see onExitComplete),
    // so the new page's load-in plays at the top of the screen where it can be seen.
  }

  // Changing the side of the About page keeps the address in step, so a link opens on the same side.
  const changeAboutContext = (next: AboutContext) => {
    setAboutContext(next)
    window.history.replaceState({}, '', `/about/?for=${next}`)
  }

  useEffect(() => {
    const onPop = () => {
      setRoute(currentRoute())
      const asked = new URLSearchParams(window.location.search).get('for')
      if (asked === 'yoga' || asked === 'design') setAboutContext(asked)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // A faint colour behind the page follows where you are (and which side of About you are reading).
  useEffect(() => {
    const tone = route === '/yoga/' ? 'yoga' : route === '/about/' ? aboutContext : 'design'
    document.documentElement.dataset.tone = tone
  }, [route, aboutContext])

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
        {/* The glass top nav: Design, Yoga, About. It stays put at every width and scroll speed. */}
        <SiteNav active={navFor(route)} ready={ready} onNavigate={navigate} />

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
            ) : route === '/about/' ? (
              <AboutPage
                ready={ready}
                context={aboutContext}
                onContextChange={changeAboutContext}
                onNavigate={navigate}
              />
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
    </>
  )
}

export default App
