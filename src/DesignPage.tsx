import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { aboutBio, aboutReference, aboutTitle } from './content/about'
import { projects } from './content/projects'
import { ProjectMedia } from './ProjectMedia'
import { WordReveal } from './WordReveal'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, delay, ease },
  }),
}

const fadeUpY = {
  hidden: { y: 20 },
  visible: {
    y: 0,
    transition: { duration: 0.7, ease },
  },
}

type Props = {
  ready: boolean
  hoveredId: number | null
  onHover: (id: number | null) => void
}

export function DesignPage({ ready, hoveredId, onHover }: Props) {
  const [canHover, setCanHover] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const sync = () => setCanHover(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
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
            Remote & San Francisco
          </motion.p>

          <h1 className="max-w-[18ch] text-[clamp(2.1rem,7vw,5.25rem)] font-medium leading-[1.12] tracking-[-0.045em]">
            <WordReveal
              text="Shawn Jr designs with empathy and conviction"
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
              Currently leading design at{' '}
              <a
                href="https://www.gradientsports.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[var(--line-strong)] underline-offset-[3px] text-[var(--ink-soft)] hover:text-[var(--ink)] hover:decoration-[var(--ink)] transition-colors"
              >
                Gradient Sports
              </a>
              . Previously Uber, Mercury, DoorDash, and Hinge Health.
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
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            custom={0}
            viewport={{ once: true, amount: 0.2 }}
            className="relative overflow-hidden rounded-full bg-[var(--bg-elevated)] aspect-square w-[140px] sm:w-[180px] md:w-[200px]"
          >
            <img
              src={aboutReference.photo}
              alt="Shawn Jr"
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/5 rounded-full" />
          </motion.div>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            custom={0.04}
            viewport={{ once: true, amount: 0.2 }}
            className="mt-3 sm:mt-3.5 mb-3 max-w-[28rem] px-1 text-[clamp(1.25rem,4.5vw,1.95rem)] font-medium leading-[1.2] tracking-[-0.03em]"
          >
            {aboutTitle}
          </motion.p>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            custom={0.08}
            viewport={{ once: true, amount: 0.2 }}
            className="max-w-[36rem] px-1 text-[15px] sm:text-[16px] leading-[1.6] text-[var(--ink-soft)]"
          >
            {aboutBio}
          </motion.p>
        </div>
      </section>

      <section id="work" className="px-5 sm:px-8 md:px-10 pt-16 sm:pt-20 md:pt-28 pb-16 sm:pb-20 md:pb-28">
        <div className="mx-auto max-w-[1120px]">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            custom={0}
            viewport={{ once: true, amount: 0.2 }}
            className="mb-8 sm:mb-10 text-[11px] sm:text-[12px] tracking-[0.2em] uppercase text-[var(--muted)]"
          >
            Work experience
          </motion.p>

          <ul
            className="flex flex-col"
            onMouseLeave={() => {
              if (canHover) onHover(null)
            }}
          >
            {projects.map((project) => {
              const isHovered = hoveredId === project.id
              const dimmed = canHover && hoveredId !== null && !isHovered

              return (
                <li
                  key={project.id}
                  onMouseEnter={() => {
                    if (canHover) onHover(project.id)
                  }}
                  style={{ opacity: dimmed ? 0.4 : 1 }}
                  className="border-t border-[var(--line)] transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                >
                  <motion.a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    variants={fadeUpY}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.15 }}
                    className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(220px,42%)] gap-5 md:gap-8 lg:gap-10 items-center py-8 sm:py-10 md:py-12 lg:py-14"
                  >
                    <div className="min-w-0 order-2 md:order-1">
                      <h2 className="mb-2 text-[clamp(1.25rem,3.5vw,1.85rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--ink)]">
                        {project.title}
                      </h2>
                      <p className="text-[14px] sm:text-[15px] text-[var(--ink-soft)] mb-2">
                        {project.role}
                      </p>
                      <p className="max-w-[34rem] text-[14px] sm:text-[15px] leading-relaxed text-[var(--muted)]">
                        {project.description}
                      </p>
                      <p className="mt-4 sm:mt-5 text-[13px] tabular-nums text-[var(--ink-soft)]">
                        {project.years}
                      </p>
                    </div>

                    <div className="relative order-1 md:order-2 overflow-hidden rounded-[1rem] aspect-[16/10]">
                      <ProjectMedia
                        src={project.image}
                        alt={project.title}
                        priority={project.id === 1}
                        loop={project.loop}
                        className="absolute inset-0 h-full w-full"
                      />
                    </div>
                  </motion.a>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <footer className="px-5 sm:px-8 md:px-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-[1120px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-[var(--line)] pt-8">
          <p className="text-[13px] text-[var(--muted)]">© 2026 Shawn Jr</p>
          <a
            href="https://www.linkedin.com/in/shawnjr/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-[var(--muted)] hover:text-[var(--ink-soft)] transition-colors"
          >
            LinkedIn
          </a>
        </div>
      </footer>
    </>
  )
}
