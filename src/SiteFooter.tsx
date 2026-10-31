import { yogaContent } from './content/yoga'
import { aboutReference } from './content/about'
import { portfolioMailto } from './content/contact'

type Mode = 'design' | 'yoga'
type FooterLink = { label: string; href: string; internal?: boolean; external?: boolean }

const LINKEDIN = 'https://www.linkedin.com/in/shawnjr/'

function columns(mode: Mode): { title: string; links: FooterLink[] }[] {
  if (mode === 'design') {
    return [
      {
        title: 'Featured in',
        links: aboutReference.featured.slice(0, 4).map((f) => ({ label: f.label, href: f.href, external: true })),
      },
      {
        title: 'Portfolio',
        links: [{ label: 'Request', href: portfolioMailto }],
      },
      {
        title: 'Elsewhere',
        links: [{ label: 'LinkedIn', href: LINKEDIN, external: true }],
      },
    ]
  }
  return [
    {
      title: 'Studios I teach at',
      links: yogaContent.teaching.map((t) => ({ label: t.label, href: t.href, external: true })),
    },
    {
      title: 'My teachers',
      links: yogaContent.teachers.map((t) => ({ label: t.label, href: t.href, external: true })),
    },
    {
      title: 'Elsewhere',
      links: [{ label: 'Instagram', href: yogaContent.instagram, external: true }],
    },
  ]
}

function Arrow() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className="inline-block">
      <path d="M2 3v3.5h7M6.5 4l2.8 2.5L6.5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function SiteFooter({
  mode,
  onNavigate,
}: {
  mode: Mode
  onNavigate?: (path: string) => void
}) {
  const cols = columns(mode)
  return (
    <footer className="page-pad-x pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-[1120px] border-t border-[var(--line)] pt-10 sm:pt-12">
        {/* The three columns are spread with equal space between them, so the middle one is always centred
            between the first and the last. The last column and "Made with Love" share one fixed width,
            both flush right, so their left edges line up at every screen size. */}
        <div className="flex items-start justify-between gap-x-4">
          {cols.map((col, i) => {
            const last = i === cols.length - 1
            return (
            <nav
              key={col.title}
              aria-label={col.title}
              className={last ? 'w-28 shrink-0' : 'min-w-0'}
            >
              <p className={`mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] uppercase tracking-[0.14em] text-[var(--muted)] sm:text-[11px] sm:tracking-[0.2em]`}>
                {col.title}
                <Arrow />
              </p>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      onClick={
                        link.internal && onNavigate
                          ? (e) => {
                              e.preventDefault()
                              onNavigate(link.href)
                            }
                          : undefined
                      }
                      className="text-[14px] leading-snug text-[var(--ink)] transition-opacity duration-300 hover:opacity-60 sm:text-[15px]"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            )
          })}
        </div>

        <div className="mt-14 flex items-start justify-between gap-x-4 text-[13px] text-[var(--muted)] sm:mt-20">
          <p className="whitespace-nowrap">© 2026 Shawn Jr</p>
          <p className="w-28 shrink-0 whitespace-nowrap">Made with Love 🤎</p>
        </div>
      </div>
    </footer>
  )
}
