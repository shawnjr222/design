import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
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
  photoClass: string
  title: string
  bio: string
  primary: { label: string; path: string }
  secondary: Link
}

const CONTEXTS: Record<AboutContext, Context> = {
  design: {
    photo: aboutReference.photo,
    alt: 'Portrait of Shawn Jr, product designer based in San Francisco',
    photoClass: 'object-[52%_30%]',
    title: aboutTitle,
    bio: aboutBio,
    primary: { label: 'See the work', path: '/' },
    secondary: { label: 'LinkedIn', href: aboutReference.links[0].href },
  },
  yoga: {
    photo: yogaContent.about.photo,
    alt: 'Portrait of Shawn Jr, yoga teacher in San Francisco',
    photoClass: 'object-[42%_28%]',
    title: yogaContent.about.title,
    bio: yogaContent.about.bio,
    primary: { label: 'See the schedule', path: '/yoga/' },
    secondary: { label: 'Instagram', href: yogaContent.instagram },
  },
}

const group = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.12 } },
}
const item = {
  hidden: { opacity: 0, y: 22, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.95, ease } },
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
      className="flex items-center rounded-full border border-[var(--line)] bg-[var(--bg-elevated)]/80 p-0.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-sm"
    >
      {(['design', 'yoga'] as const).map((key) => {
        const on = value === key
        return (
          <button
            key={key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(key)}
            className={`relative inline-flex min-h-10 min-w-[4.5rem] cursor-pointer items-center justify-center rounded-full px-4 py-2 text-[12px] tracking-[-0.01em] transition-colors duration-300 touch-manipulation sm:text-[13px] ${
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
 * A single screen: a photo, a headline, a short bio and two buttons. The Design / Yoga switch changes which of the
 * two readings you are looking at. There is no footer, so nothing here repeats and nothing sits below the fold.
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
  const c = CONTEXTS[context]

  return (
    <div className="flex min-h-[100svh] flex-col">
    <section className="page-pad-x flex flex-1 items-center pb-6 pt-24 sm:pb-8 sm:pt-28">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-7 md:flex-row md:items-center md:justify-between md:gap-14 lg:gap-24">
        {/* The photo dissolves into the other context's photo. */}
        <motion.div
          initial={{ opacity: 0, y: 34 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.1, delay: 0.1, ease }}
          className="relative h-[clamp(11rem,27svh,16rem)] w-full shrink-0 overflow-hidden rounded-[1.5rem] bg-[var(--bg-elevated)] shadow-[0_30px_70px_-34px_rgba(17,17,16,0.5)] sm:rounded-[1.75rem] md:h-[min(68svh,36rem)] md:w-auto md:aspect-[4/5]"
        >
          <AnimatePresence initial={false}>
            <motion.img
              key={context}
              src={c.photo}
              alt={c.alt}
              initial={{ opacity: 0, scale: 1.07 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.7, ease } }}
              transition={{ duration: 1.2, ease }}
              className={`absolute inset-0 h-full w-full object-cover ${c.photoClass}`}
            />
          </AnimatePresence>
          <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-black/5" />
        </motion.div>

        <div className="min-w-0 md:max-w-[34rem] md:flex-1">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.05, ease }}
            className="mb-6 flex sm:mb-8"
          >
            <ContextSwitch value={context} onChange={onContextChange} />
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={context}
              variants={group}
              initial="hidden"
              animate={ready ? 'show' : 'hidden'}
              exit={{ opacity: 0, y: -8, filter: 'blur(5px)', transition: { duration: 0.22, ease } }}
            >
              <h1 className="max-w-[17ch] text-[clamp(1.75rem,4.2vw,3.25rem)] font-medium leading-[1.1] tracking-[-0.04em]">
                <WordReveal text={c.title} ready={ready} delay={0.12} />
              </h1>

              <motion.p
                variants={item}
                className="mt-4 text-[15.5px] leading-[1.65] text-[var(--ink-soft)] sm:mt-6 sm:text-[17px]"
              >
                {c.bio}
              </motion.p>

              <motion.div variants={item} className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
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
          </AnimatePresence>

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
