import { useEffect, useState } from 'react'
import type { PointerEvent } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export type NavKey = 'design' | 'yoga' | 'about'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

const ITEMS: { key: NavKey; label: string; href: string }[] = [
  { key: 'design', label: 'Design', href: '/' },
  { key: 'yoga', label: 'Yoga', href: '/yoga/' },
  { key: 'about', label: 'About', href: '/about/' },
]

/**
 * The site's top navigation: one floating glass capsule with a page for Design, one for Yoga and one for About.
 * A single lit pill slides to whichever page you are on. The glass tightens a little once the page scrolls,
 * and its highlight follows the pointer on a mouse.
 */
export function SiteNav({
  active,
  ready,
  onNavigate,
}: {
  active: NavKey
  ready: boolean
  onNavigate: (path: string) => void
}) {
  const reduceMotion = useReducedMotion() ?? false
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const follow = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
  }
  const release = (e: PointerEvent<HTMLElement>) => {
    e.currentTarget.style.removeProperty('--mx')
    e.currentTarget.style.removeProperty('--my')
  }

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-4">
      <motion.nav
        aria-label="Primary"
        data-scrolled={scrolled || undefined}
        initial={{ opacity: 0, y: -22, scale: 0.94 }}
        animate={ready ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 1, delay: 0.05, ease }}
        onPointerMove={follow}
        onPointerLeave={release}
        className="glass-nav pointer-events-auto relative flex items-center rounded-full p-1"
      >
        {ITEMS.map((item) => {
          const isActive = item.key === active
          return (
            <a
              key={item.key}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault()
                onNavigate(item.href)
              }}
              className={`relative inline-flex min-h-10 min-w-[4.75rem] touch-manipulation items-center justify-center rounded-full px-4 py-2 text-[13px] font-medium tracking-[-0.01em] transition-colors duration-300 sm:min-w-[5.25rem] sm:px-5 sm:text-[14px] ${
                isActive ? 'text-[var(--ink)]' : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  aria-hidden
                  className="glass-pill absolute inset-0 rounded-full"
                  transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 34, mass: 0.9 }}
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </a>
          )
        })}
      </motion.nav>
    </header>
  )
}
