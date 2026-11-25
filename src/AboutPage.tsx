import { motion, useReducedMotion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { aboutBio, aboutReference, aboutTitle } from './content/about'
import { yogaContent } from './content/yoga'
import { SiteFooter } from './SiteFooter'
import { WordReveal } from './WordReveal'

export type AboutContext = 'design' | 'yoga'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

type Link = { label: string; href: string }

type Context = {
  photo: string
  alt: string
  /** Where the photo is anchored inside its frame, so the whole of you stays in view. */
  photoClass: string
  title: string
  bio: string
  primary: { label: string; path: string }
  secondary: Link
}

const ORDER: AboutContext[] = ['design', 'yoga']

const CONTEXTS: Record<AboutContext, Context> = {
  design: {
    photo: aboutReference.photo,
    alt: 'Portrait of Shawn Jr, product designer based in San Francisco',
    photoClass: 'object-[50%_22%]',
    title: aboutTitle,
    bio: aboutBio,
    primary: { label: 'See the work', path: '/' },
    secondary: { label: 'LinkedIn', href: aboutReference.links[0].href },
  },
  yoga: {
    photo: yogaContent.about.photo,
    alt: 'Portrait of Shawn Jr, yoga teacher in San Francisco',
    // The pose runs from a hand on the left to a hand on the right, so it is centred and nothing is cut.
    photoClass: 'object-[50%_12%]',
    title: yogaContent.about.title,
    bio: yogaContent.about.bio,
    primary: { label: 'See the schedule', path: '/yoga/' },
    secondary: { label: 'Instagram', href: yogaContent.instagram },
  },
}

function Arrow() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden className="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** The two readings of the About page, as a segmented control with one pill that slides between them. */
function ContextSwitch({ value, onChange }: { value: AboutContext; onChange: (next: AboutContext) => void }) {
  const reduceMotion = useReducedMotion() ?? false
  return (
    <div
      role="group"
      aria-label="Read about me as"
      className="flex w-full items-center rounded-full border border-[var(--line)] bg-[var(--bg-elevated)]/80 p-0.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-sm lg:w-auto"
    >
      {ORDER.map((key) => {
        const on = value === key
        return (
          <button
            key={key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(key)}
            className={`relative inline-flex min-h-10 min-w-[4.5rem] flex-1 cursor-pointer items-center justify-center lg:flex-none rounded-full px-4 py-2 text-[12px] tracking-[-0.01em] transition-colors duration-300 touch-manipulation sm:text-[13px] ${
              on ? 'text-[var(--ink)]' : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            {on && (
              <motion.span
                layoutId="about-context-pill"
                aria-hidden
                className="absolute inset-0 rounded-full bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(17,17,16,0.05)]"
                transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 36 }}
              />
            )}
            <span className="relative z-10 capitalize">{key}</span>
          </button>
        )
      })}
    </div>
  )
}

/**
 * A single screen: a photo, a headline, a short bio and two buttons, with a Design / Yoga switch.
 *
 * Both readings stay mounted in the same spot, stacked in one grid cell. Switching crossfades them in place, so the
 * block is always as tall as the taller of the two and nothing on the page jumps. The outgoing text leaves quickly,
 * the incoming text follows a beat later, one line after another; the two photos dissolve into each other.
 */
export function AboutPage({
  ready,
  context,
  onContextChange,
  onNavigate,
}: {
  ready: boolean
  context: AboutContext
  onContextChange: (next: AboutContext) => void
  onNavigate: (path: string) => void
}) {
  const reduceMotion = useReducedMotion() ?? false

  const block: Variants = {
    hide: { transition: { staggerChildren: 0 } },
    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.085, delayChildren: reduceMotion ? 0 : 0.3 } },
  }
  const line: Variants = {
    hide: reduceMotion
      ? { opacity: 0, transition: { duration: 0.01 } }
      : { opacity: 0, y: -8, filter: 'blur(4px)', transition: { duration: 0.28, ease } },
    show: reduceMotion
      ? { opacity: 1, transition: { duration: 0.01 } }
      : { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.9, ease } },
  }
  // Before the very first reveal the lines wait just below, rather than above, where they leave to.
  const lineStart = reduceMotion ? { opacity: 0 } : { opacity: 0, y: 22, filter: 'blur(6px)' }

  return (
    <div className="flex min-h-[100svh] flex-col">
      <section className="page-pad-x flex flex-1 items-center pb-4 pt-[5.25rem] sm:pb-8 sm:pt-28">
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-5 sm:gap-7 lg:flex-row lg:items-center lg:justify-between lg:gap-24">
          <motion.div
            initial={{ opacity: 0, y: 34 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1.1, delay: 0.1, ease }}
            className="relative aspect-[5/4] w-full shrink-0 overflow-hidden landscape:max-lg:aspect-[16/10] rounded-[1.5rem] bg-[var(--bg-elevated)] shadow-[0_30px_70px_-34px_rgba(17,17,16,0.5)] sm:rounded-[1.75rem] lg:aspect-square lg:h-[min(62svh,32rem)] lg:w-auto lg:max-w-none"
          >
            {ORDER.map((key) => {
              const c = CONTEXTS[key]
              const on = context === key
              return (
                <motion.img
                  key={key}
                  src={c.photo}
                  alt={c.alt}
                  aria-hidden={!on}
                  decoding="async"
                  initial={false}
                  animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 1.06 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 1.15, ease }}
                  className={`absolute inset-0 h-full w-full object-cover ${c.photoClass}`}
                />
              )
            })}
            <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-black/5" />
          </motion.div>

          <div className="min-w-0 lg:max-w-[34rem] lg:flex-1">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={ready ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.05, ease }}
              className="mb-4 flex sm:mb-8"
            >
              <ContextSwitch value={context} onChange={onContextChange} />
            </motion.div>

            <div className="grid">
              {ORDER.map((key) => {
                const c = CONTEXTS[key]
                const on = context === key
                return (
                  <motion.div
                    key={key}
                    variants={block}
                    initial="hide"
                    animate={ready && on ? 'show' : 'hide'}
                    // Only the visible reading can be tabbed to, clicked or read out.
                    inert={!on}
                    aria-hidden={!on}
                    className="[grid-area:1/1]"
                  >
                    <motion.h1
                      variants={line}
                      initial={lineStart}
                      className="text-[clamp(1.75rem,4.2vw,3.25rem)] font-medium leading-[1.1] tracking-[-0.04em]"
                    >
                      <WordReveal text={c.title} ready={ready} delay={0.12} />
                    </motion.h1>

                    <motion.p
                      variants={line}
                      initial={lineStart}
                      className="mt-3 text-[15px] leading-[1.6] text-[var(--ink-soft)] sm:mt-6 sm:text-[17px] sm:leading-[1.65]"
                    >
                      {c.bio}
                    </motion.p>

                    <motion.div variants={line} initial={lineStart} className="mt-5 flex flex-wrap items-center gap-3 sm:mt-8">
                      <a
                        href={c.primary.path}
                        onClick={(e) => {
                          e.preventDefault()
                          onNavigate(c.primary.path)
                        }}
                        className="group inline-flex min-h-11 items-center gap-2.5 rounded-full bg-[var(--ink)] px-6 py-2.5 text-[14px] font-medium tracking-[-0.01em] text-[var(--bg)] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-14px_rgba(17,17,16,0.6)]"
                      >
                        {c.primary.label}
                        <Arrow />
                      </a>
                      <a
                        href={c.secondary.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center rounded-full border border-[var(--line-strong)] px-6 py-2.5 text-[14px] font-medium tracking-[-0.01em] text-[var(--ink)] transition-colors duration-300 hover:bg-[var(--surface)]"
                      >
                        {c.secondary.label}
                      </a>
                    </motion.div>
                  </motion.div>
                )
              })}
            </div>

            <p className="sr-only" aria-live="polite">
              Showing the {context} side of the About page
            </p>
          </div>
        </div>
      </section>

      <SiteFooter mode={context} minimal />
    </div>
  )
}
