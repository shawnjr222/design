import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useReadyReveal } from './useReadyReveal'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]

/** Fades and lifts its children in once the page is ready and the block is on screen. */
export function ReadyReveal({
  ready,
  delay = 0,
  y = 28,
  amount = 0.15,
  className,
  children,
}: {
  ready: boolean
  delay?: number
  y?: number
  amount?: number
  className?: string
  children: ReactNode
}) {
  const { ref, show, delay: wait } = useReadyReveal<HTMLDivElement>(ready, delay, amount)
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 1, ease, delay: wait }}
    >
      {children}
    </motion.div>
  )
}
