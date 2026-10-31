import { useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1]
/** One soft spring for the card, so it opens and closes like a single object. */
const card = { type: 'spring' as const, stiffness: 230, damping: 28, mass: 0.9 }

type Props = {
  open: boolean
  onClose: () => void
  photo: string
  alt: string
  label: string
  bio: string
  photoClassName?: string
  /** The button it opens from; the card grows out of it and shrinks back into it. */
  origin?: DOMRect | null
}

/** About text lives here, out of the way of the page headline. */
export function AboutModal({ open, onClose, photo, alt, label, bio, photoClassName = '', origin = null }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Point the card's scale origin at the button it came from.
  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!open || !panel || !origin) return
    // offset* ignores transforms, so this is the card's true resting spot even while it is scaled down.
    panel.style.transformOrigin = `${origin.left + origin.width / 2 - panel.offsetLeft}px ${origin.top + origin.height / 2 - panel.offsetTop}px`
  }, [open, origin])

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      opener?.focus?.()
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="about-modal"
          className="fixed inset-0 z-[90] flex items-end justify-center p-3 sm:items-center sm:p-6"
        >
          <motion.button
            type="button"
            aria-label="Close about"
            tabIndex={-1}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3, ease } }}
            transition={{ duration: 0.45, ease }}
            className="absolute inset-0 cursor-default bg-[var(--ink)]/20 backdrop-blur-md"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="About"
            className="relative w-full max-w-[34rem] rounded-[1.75rem] border border-[var(--line)] bg-[var(--bg)] p-7 shadow-[0_40px_90px_-30px_rgba(17,17,16,0.45)] sm:p-10"
            initial={{ opacity: 0, scale: origin ? 0.3 : 0.94, y: origin ? 0 : 28 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { ...card, opacity: { duration: 0.3, ease } } }}
            exit={{ opacity: 0, transition: { duration: 0.28, ease } }}
          >
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--muted)] cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>

            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease, delay: 0.28 }}
              className="relative mb-6 aspect-square w-[88px] overflow-hidden rounded-full bg-[var(--bg-elevated)] sm:w-[104px]"
            >
              <img src={photo} alt={alt} className={`h-full w-full object-cover ${photoClassName}`} />
              <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-black/5" />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.36 }}
              className="mb-3 text-[11px] uppercase tracking-[0.2em] text-[var(--ink)] sm:text-[12px]"
            >
              {label}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease, delay: 0.44 }}
              className="text-[16px] leading-[1.65] text-[var(--ink-soft)] sm:text-[17px]"
            >
              {bio}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
