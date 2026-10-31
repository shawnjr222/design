export const CONTACT_EMAIL = 'hello@shawnjr.online'

/** Opens the visitor's mail app with a ready-to-send portfolio request. */
export const portfolioMailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
  'Portfolio request',
)}&body=${encodeURIComponent(
  "Hi Shawn,\n\nI'd love to see your portfolio. A little about me and what I'm looking for:\n\n",
)}`
