import { useRef } from 'react'
import { useInView } from 'framer-motion'

/** An element counts as part of the first screen if it is seen this soon after its page mounts. */
const FIRST_SCREEN_MS = 900

/**
 * Reveal gating for content that follows the hero text. It plays once the page is ready AND the
 * element is on screen. If it was on screen as its page mounted (the first screen) it waits
 * `delay` seconds so it lands after the text above it. This holds for the first load and for every
 * switch between pages. If the visitor scrolled to it later, there is no wait.
 */
export function useReadyReveal<T extends Element>(ready: boolean, delay: number, amount = 0.15) {
  const ref = useRef<T>(null)
  const seen = useInView(ref, { once: true, amount })
  const mountedAt = useRef(performance.now())
  const firstScreen = useRef<boolean | null>(null)

  if (seen && firstScreen.current === null) {
    firstScreen.current = performance.now() - mountedAt.current < FIRST_SCREEN_MS
  }

  return { ref, show: ready && seen, delay: firstScreen.current ? delay : 0 }
}
