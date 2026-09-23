import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { yogaContent } from './content/yoga'
import {
  warmUpcomingClasses,
  formatClassTimeRange,
  formatLocationLabel,
  type YogaClass,
} from './lib/schedule'
import { WordReveal } from './WordReveal'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

type Props = {
  ready: boolean
}

export function YogaPage({ ready }: Props) {
  const [classes, setClasses] = useState<YogaClass[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [canHover, setCanHover] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setCanHover(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const clearHover = () => setHoveredId(null)
    window.addEventListener('scroll', clearHover, { passive: true })
    return () => window.removeEventListener('scroll', clearHover)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const next = await warmUpcomingClasses(30)
        if (!cancelled) {
          setClasses(next)
          setStatus('ready')
        }
      } catch {
        if (!cancelled) setStatus('error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <section className="relative min-h-[100svh] flex flex-col justify-center px-5 sm:px-8 md:px-10 pt-28 sm:pt-24 pb-12">
        <div className="mx-auto w-full max-w-[1120px]">
          <motion.p
            initial={{ opacity: 0, y: 36 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.08, ease }}
            className="mb-6 sm:mb-8 md:mb-10 text-[11px] sm:text-[12px] tracking-[0.2em] uppercase text-[var(--muted)]"
          >
            {yogaContent.location}
          </motion.p>

          <h1 className="max-w-[18ch] text-[clamp(2.1rem,7vw,5.25rem)] font-medium leading-[1.12] tracking-[-0.045em]">
            <WordReveal
              text={yogaContent.headline}
              ready={ready}
              delay={0.18}
            />
          </h1>

          <div className="mt-6 sm:mt-8 md:mt-10 max-w-[32rem]">
            <motion.p
              initial={{ opacity: 0, y: 40 }}
              animate={ready ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1.05, delay: 0.72, ease }}
              className="text-[clamp(1rem,2.8vw,1.2rem)] leading-[1.55] text-[var(--ink-soft)]"
            >
              Currently teaching at{' '}
              <a
                href={yogaContent.teaching[0].href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[var(--line-strong)] underline-offset-[3px] text-[var(--ink-soft)] hover:text-[var(--ink)] hover:decoration-[var(--ink)] transition-colors"
              >
                {yogaContent.teaching[0].label}
              </a>{' '}
              and{' '}
              <a
                href={yogaContent.teaching[1].href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[var(--line-strong)] underline-offset-[3px] text-[var(--ink-soft)] hover:text-[var(--ink)] hover:decoration-[var(--ink)] transition-colors"
              >
                {yogaContent.teaching[1].label}
              </a>
              .
            </motion.p>
          </div>
        </div>
      </section>

      <section
        id="about"
        className="relative min-h-[100svh] flex flex-col justify-start px-5 sm:px-8 md:px-10 pt-10 sm:pt-14"
      >
        <div className="mx-auto max-w-[1120px] flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease }}
            className="relative overflow-hidden rounded-full bg-[var(--bg-elevated)] aspect-square w-[140px] sm:w-[180px] md:w-[200px]"
          >
            <img
              src={yogaContent.about.photo}
              alt="Shawn Jr"
              width={1024}
              height={910}
              decoding="async"
              className="h-full w-full object-cover object-[center_28%] select-none"
              draggable={false}
            />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/5 rounded-full" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease }}
            className="mt-3 sm:mt-3.5 mb-3 max-w-[28rem] px-1 text-[clamp(1.25rem,4.5vw,1.95rem)] font-medium leading-[1.2] tracking-[-0.03em]"
          >
            {yogaContent.about.title}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease }}
            className="max-w-[36rem] px-1 text-[15px] sm:text-[16px] leading-[1.6] text-[var(--ink-soft)]"
          >
            {yogaContent.about.bio}
          </motion.p>
        </div>
      </section>

      <section id="schedule" className="px-5 sm:px-8 md:px-10 pt-16 sm:pt-20 md:pt-28 pb-16 sm:pb-20 md:pb-28">
        <div className="mx-auto max-w-[1120px]">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease }}
            className="mb-8 sm:mb-10 text-[11px] sm:text-[12px] tracking-[0.2em] uppercase text-[var(--muted)]"
          >
            Upcoming schedule
          </motion.p>

          {status === 'loading' && (
            <p className="text-[15px] text-[var(--muted)] py-8 border-t border-[var(--line)]">
              Loading classes…
            </p>
          )}

          {status === 'error' && (
            <p className="text-[15px] text-[var(--muted)] py-8 border-t border-[var(--line)]">
              Couldn’t load the schedule right now. Check Folk SF or Arise for
              the latest times.
            </p>
          )}

          {status === 'ready' && classes.length === 0 && (
            <p className="text-[15px] text-[var(--muted)] py-8 border-t border-[var(--line)]">
              No upcoming classes in the next 30 days.
            </p>
          )}

          {status === 'ready' && classes.length > 0 && (
            <ul
              className="flex flex-col"
              onMouseLeave={() => {
                if (canHover) setHoveredId(null)
              }}
            >
              {classes.map((item) => {
                const dimmed =
                  canHover && hoveredId !== null && hoveredId !== item.id

                return (
                  <li
                    key={item.id}
                    onMouseEnter={() => {
                      if (canHover) setHoveredId(item.id)
                    }}
                    className="border-t border-[var(--line)]"
                  >
                    <motion.a
                      href={item.signupUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={false}
                      animate={{ opacity: dimmed ? 0.4 : 1 }}
                      transition={{ duration: 0.35, ease }}
                      className="block py-7 sm:py-8 md:py-9"
                    >
                      <h2 className="mb-2 text-[clamp(1.25rem,3.5vw,2rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--ink)]">
                        {item.title}
                      </h2>
                      <p className="text-[14px] sm:text-[15px] text-[var(--ink-soft)]">
                        {formatLocationLabel(item.studio, item.location)}
                      </p>
                      <p className="mt-4 sm:mt-5 text-[13px] sm:text-[14px] text-[var(--muted)]">
                        {formatClassTimeRange(item.start, item.end)}
                      </p>
                    </motion.a>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      <footer className="px-5 sm:px-8 md:px-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-[1120px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-[var(--line)] pt-8">
          <p className="text-[13px] text-[var(--muted)]">© 2026 Shawn Jr</p>
          <a
            href={yogaContent.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-[var(--muted)] hover:text-[var(--ink-soft)] transition-colors"
          >
            Instagram
          </a>
        </div>
      </footer>
    </>
  )
}
