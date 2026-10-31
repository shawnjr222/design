import { Fragment, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { yogaContent } from './content/yoga'
import {
  warmUpcomingClasses,
  type YogaClass,
} from './lib/schedule'
import { WordReveal } from './WordReveal'
import { SiteFooter } from './SiteFooter'
import { ClassCalendar } from './ClassCalendar'
import { ReadyReveal } from './ReadyReveal'


const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

type Props = {
  ready: boolean
  onNavigate?: (path: string) => void
}

export function YogaPage({ ready, onNavigate }: Props) {
  const [classes, setClasses] = useState<YogaClass[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const next = await warmUpcomingClasses(30)
        if (!cancelled) {
          setClasses(next)
          setStatus('ready')
        }
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    void load()

    // If the tab sits overnight, refresh for the new calendar day's 30-day window.
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      void load()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return (
    <>
      <section className="relative min-h-[68svh] flex flex-col justify-end page-pad-x pt-28 sm:pt-32 pb-10 sm:pb-14">
        <div className="mx-auto w-full max-w-[1120px]">
          <motion.p
            initial={{ opacity: 0, y: 36 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.08, ease }}
            className="mb-3 sm:mb-4 text-[clamp(1rem,2.8vw,1.2rem)] leading-[1.55] text-[var(--muted)]"
          >
            Based in {yogaContent.location} <span aria-hidden="true" className="ml-[0.3em]">🌁</span>
          </motion.p>

          <h1 className="max-w-[18ch] text-[clamp(2.1rem,7vw,5.25rem)] font-medium leading-[1.12] tracking-[-0.045em]">
            <WordReveal
              text={yogaContent.headline}
              ready={ready}
              delay={0.18}
            />
          </h1>

          <div className="mt-4 sm:mt-5 max-w-[32rem]">
            <motion.p
              initial={{ opacity: 0, y: 40 }}
              animate={ready ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1.05, delay: 0.72, ease }}
              className="text-[clamp(1rem,2.8vw,1.2rem)] leading-[1.55] text-[var(--muted)]"
            >
              Currently teaching at{' '}
              {yogaContent.teaching.map((studio, i) => (
                <Fragment key={studio.href}>
                  <a
                    href={studio.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-[var(--line-strong)] underline-offset-[3px] text-[var(--muted)] transition-colors duration-300 hover:text-black hover:decoration-black"
                  >
                    {studio.label}
                  </a>
                  {i < yogaContent.teaching.length - 2 && ', '}
                  {i === yogaContent.teaching.length - 2 &&
                    (yogaContent.teaching.length > 2 ? ', and ' : ' and ')}
                </Fragment>
              ))}
              .
            </motion.p>

          </div>

        </div>
      </section>


      <section id="schedule" className="page-pad-x pt-6 sm:pt-8 pb-12 sm:pb-16">
        <ReadyReveal ready={ready} delay={1.2} y={36} amount={0.04} className="mx-auto max-w-[1120px]">
          <p className="mb-4 sm:mb-6 text-[11px] sm:text-[12px] tracking-[0.2em] uppercase text-[var(--muted)]">Upcoming schedule</p>

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

          {status === 'ready' && classes.length > 0 && <ClassCalendar classes={classes} />}
        </ReadyReveal>
      </section>

      <SiteFooter mode="yoga" onNavigate={onNavigate} />
    </>
  )
}
