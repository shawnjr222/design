import { motion, useReducedMotion } from 'framer-motion'

export function WordReveal({
  text,
  ready,
  delay = 0,
  className = '',
}: {
  text: string
  ready: boolean
  delay?: number
  className?: string
}) {
  const reduceMotion = useReducedMotion() ?? false
  const words = text.split(' ')

  if (reduceMotion) {
    return <span className={className}>{text}</span>
  }

  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="inline-block"
          initial={{ y: 28, opacity: 0 }}
          animate={ready ? { y: 0, opacity: 1 } : { y: 28, opacity: 0 }}
          transition={{
            duration: 1.05,
            delay: delay + i * 0.055,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {word}
          {i < words.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </span>
  )
}
