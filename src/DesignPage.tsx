import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { projects } from './content/projects'
import { ProjectMedia } from './ProjectMedia'
import { WordReveal } from './WordReveal'
import { SiteFooter } from './SiteFooter'
import { ReadyReveal } from './ReadyReveal'
import { useReadyReveal } from './useReadyReveal'
import type { Project } from './content/projects'



const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

type Props = {
  ready: boolean
  hoveredId: number | null
  onHover: (id: number | null) => void
  onNavigate?: (path: string) => void
}

/** One work row: its text and media enter together, after the hero text. */
function ProjectRow({
  project,
  index,
  ready,
  dimmed,
  onEnter,
}: {
  project: Project
  index: number
  ready: boolean
  dimmed: boolean
  onEnter: () => void
}) {
  // A tiny threshold, so a row that only peeks into the first screen still animates in.
  const { ref, show, delay } = useReadyReveal<HTMLDivElement>(ready, 1.3 + index * 0.14, 0.02)
  return (
    <li
      onMouseEnter={onEnter}
      style={{ opacity: dimmed ? 0.4 : 1 }}
      className="transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
    >
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 28 }}
        animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
        transition={{ duration: 1, ease, delay }}
        className="border-t border-[var(--line)]"
      >
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="grid grid-cols-1 items-center gap-6 py-7 sm:py-9 md:grid-cols-[minmax(0,1fr)_minmax(240px,42%)] md:gap-10"
        >
          <div className="min-w-0 order-2 md:order-1">
            <h2 className="mb-2 text-[clamp(1.35rem,3vw,1.85rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--ink)]">
              {project.title}
            </h2>
            <p className="mb-2 text-[14px] text-[var(--ink-soft)] sm:text-[15px]">{project.role}</p>
            <p className="max-w-[34rem] text-[14px] leading-relaxed text-[var(--muted)] sm:text-[15px]">
              {project.description}
            </p>
            <p className="mt-4 text-[13px] tabular-nums text-[var(--muted)]">{project.years}</p>
          </div>
          <div className="relative order-1 md:order-2 aspect-[16/10] overflow-hidden rounded-[1rem]">
            <ProjectMedia
              src={project.image}
              alt={project.alt}
              priority={project.id === 1}
              loop={project.loop}
              peek={index === 0}
              reveal={show}
              // Lands just behind its text on the first screen; no wait when scrolled to later.
              revealDelay={delay > 0 ? delay + 0.2 : 0}
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </a>
      </motion.div>
    </li>
  )
}

export function DesignPage({ ready, hoveredId, onHover, onNavigate }: Props) {
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
      <section className="relative min-h-[68svh] flex flex-col justify-end page-pad-x pt-28 sm:pt-32 pb-10 sm:pb-14">
        <div className="mx-auto w-full max-w-[1120px]">
          <motion.p
            initial={{ opacity: 0, y: 36 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.08, ease }}
            className="mb-3 sm:mb-4 text-[clamp(1rem,2.8vw,1.2rem)] leading-[1.55] text-[var(--muted)]"
          >
            Based in San Francisco <span aria-hidden="true" className="ml-[0.3em]">🌁</span>
          </motion.p>

          <h1 className="max-w-[18ch] text-[clamp(2.1rem,7vw,5.25rem)] font-medium leading-[1.12] tracking-[-0.045em]">
            <WordReveal
              text="Shawn Jr designs with empathy and conviction"
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
              Product designer with 8+ years of experience. Currently leading design at{' '}
              <a
                href="https://www.gradientsports.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[var(--line-strong)] underline-offset-[3px] text-[var(--muted)] transition-colors duration-300 hover:text-black hover:decoration-black"
              >
                Gradient Sports
              </a>
              .
            </motion.p>

          </div>

        </div>
      </section>

      <section id="work" className="page-pad-x pt-4 sm:pt-8 pb-12 sm:pb-16">
        <div className="mx-auto max-w-[1120px]">
          <ReadyReveal ready={ready} delay={1.15} y={14}>
            <p className="mb-6 sm:mb-8 text-[11px] sm:text-[12px] tracking-[0.2em] uppercase text-[var(--muted)]">
              Work experience
            </p>
          </ReadyReveal>

          <ul
            className="flex flex-col"
            onMouseLeave={() => {
              if (canHover) onHover(null)
            }}
          >
            {projects.map((project, index) => (
              <ProjectRow
                key={project.id}
                project={project}
                index={index}
                ready={ready}
                dimmed={canHover && hoveredId !== null && hoveredId !== project.id}
                onEnter={() => {
                  if (canHover) onHover(project.id)
                }}
              />
            ))}
          </ul>
        </div>
      </section>

      <SiteFooter mode="design" onNavigate={onNavigate} />
    </>
  )
}
