import { Fragment, useMemo, type CSSProperties } from 'react'
import { formatClassTimeRange, formatLocationLabel, type YogaClass } from './lib/schedule'

const TZ = 'America/Los_Angeles'
const WEEKS = 5
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Each studio gets its own faint tint: Folk brown, Arise green, HAUM orange, each with a deep ink of the same hue. */
type Tone = { bg: string; hover: string; ink: string }
const STUDIO_TONE: Record<string, Tone> = {
  'Folk SF': { bg: '#ebe0d4', hover: '#e2d3c3', ink: '#6a472b' },
  Arise: { bg: '#dce7d8', hover: '#cfddca', ink: '#2e5a38' },
  HAUM: { bg: '#f7e0cb', hover: '#f1d2b6', ink: '#a8521a' },
}
const FALLBACK_TONE: Tone = { bg: '#e6e6e1', hover: '#dcdcd6', ink: '#3d3d3a' }
const toneOf = (studio: string) => STUDIO_TONE[studio] ?? FALLBACK_TONE

function StudioTag({ studio, className = '' }: { studio: string; className?: string }) {
  const t = toneOf(studio)
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-[0.02em] ${className}`}
      style={{ background: t.bg, color: t.ink }}
    >
      {studio}
    </span>
  )
}

const dayKeyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ })
const dayKey = (d: Date) => dayKeyFmt.format(d)

const hourFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true })
/** "6:15p", "12p": short enough for a calendar cell. */
function shortTime(d: Date) {
  const parts = hourFmt.formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  const min = get('minute')
  return `${get('hour')}${min === '00' ? '' : `:${min}`}${get('dayPeriod').toLowerCase().startsWith('a') ? 'a' : 'p'}`
}

type Day = { key: string; date: Date; classes: YogaClass[]; past: boolean; today: boolean }

function buildDays(classes: YogaClass[]): Day[] {
  const byDay = new Map<string, YogaClass[]>()
  for (const c of classes) {
    const k = dayKey(c.start)
    byDay.set(k, [...(byDay.get(k) ?? []), c])
  }
  const todayKey = dayKey(new Date())
  const [y, m, d] = todayKey.split('-').map(Number)
  const anchor = new Date(Date.UTC(y, m - 1, d, 12))
  anchor.setUTCDate(anchor.getUTCDate() - anchor.getUTCDay()) // back to Sunday
  const days: Day[] = []
  for (let i = 0; i < WEEKS * 7; i++) {
    const date = new Date(anchor)
    date.setUTCDate(anchor.getUTCDate() + i)
    const key = date.toISOString().slice(0, 10)
    days.push({
      key,
      date,
      classes: (byDay.get(key) ?? []).sort((a, b) => a.start.getTime() - b.start.getTime()),
      past: key < todayKey,
      today: key === todayKey,
    })
  }
  return days
}

const monthDay = (d: Date) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' }).format(d)
const longDay = (d: Date) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' }).format(d)

function ClassChip({ item, alignRight }: { item: YogaClass; alignRight: boolean }) {
  const tone = toneOf(item.studio)
  return (
    <div className="group relative">
      <a
        href={item.signupUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="chip-tone flex items-baseline gap-1.5 rounded-lg px-2 py-1 text-[11.5px] leading-tight transition-colors focus-visible:outline-2 focus-visible:outline-offset-1"
        style={
          {
            background: tone.bg,
            color: tone.ink,
            outlineColor: tone.ink,
            '--tone-hover': tone.hover,
          } as CSSProperties
        }
      >
        <span className="shrink-0 font-semibold tabular-nums">{shortTime(item.start)}</span>
        <span className="truncate opacity-80">{item.title}</span>
      </a>
      {/* Callout: the full details and the way through to the class page */}
      <div
        role="tooltip"
        className={`pointer-events-none invisible absolute bottom-[calc(100%+6px)] z-30 w-60 translate-y-1 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3.5 text-left opacity-0 shadow-[0_18px_40px_-18px_rgba(17,17,16,0.35)] transition-all duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 ${
          alignRight ? 'right-0' : 'left-0'
        }`}
      >
        <StudioTag studio={item.studio} />
        <p className="mt-2.5 text-[14px] font-semibold leading-snug text-[var(--ink)]">{item.title}</p>
        <p className="mt-1 text-[12px] text-[var(--ink-soft)]">{formatClassTimeRange(item.start, item.end)}</p>
        <p className="mt-0.5 text-[12px] text-[var(--ink-soft)]">{item.location || 'San Francisco'}</p>
        <p className="mt-3 text-center text-[12px] text-[var(--muted)]">Click for class details</p>
      </div>
    </div>
  )
}

/** Five-week teaching calendar on larger screens, a day-by-day agenda on phones. */
export function ClassCalendar({ classes }: { classes: YogaClass[] }) {
  const days = useMemo(() => buildDays(classes), [classes])
  const studios = useMemo(() => Array.from(new Set(classes.map((c) => c.studio))), [classes])
  const withClasses = days.filter((d) => d.classes.length > 0)

  return (
    <div>
      <ul className="mb-5 flex flex-wrap gap-2" aria-label="Studios">
        {studios.map((s) => (
          <li key={s}>
            <StudioTag studio={s} className="!px-3 !py-1 !text-[12px]" />
          </li>
        ))}
      </ul>

      {/* Calendar: md and up */}
      <div className="hidden md:block">
        <div className="grid grid-cols-7 border-b border-[var(--line)] pb-2 text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
          {WEEKDAYS.map((d) => (
            <p key={d} className="px-2">
              {d}
            </p>
          ))}
        </div>
        <div className="grid grid-cols-7 border-l border-[var(--line)]">
          {days.map((day, i) => (
            <div
              key={day.key}
              className={`min-h-[7.25rem] border-b border-r border-[var(--line)] p-1.5 ${day.past ? 'opacity-40' : ''}`}
            >
              <p
                className={`mb-1.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[12px] tabular-nums ${
                  day.today ? 'bg-[var(--ink)] text-[var(--bg)]' : 'text-[var(--muted)]'
                }`}
              >
                {day.date.getUTCDate() === 1 || i === 0 ? monthDay(day.date) : day.date.getUTCDate()}
              </p>
              <div className="flex flex-col gap-1">
                {day.classes.map((c) => (
                  <ClassChip key={c.id} item={c} alignRight={i % 7 >= 4} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agenda: below md */}
      <div className="md:hidden">
        {withClasses.map((day) => (
          <Fragment key={day.key}>
            <p className="mt-6 border-t border-[var(--line)] pt-4 text-[12px] uppercase tracking-[0.16em] text-[var(--muted)] first:mt-0">
              {day.today ? 'Today · ' : ''}
              {longDay(day.date)}
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {day.classes.map((c) => (
                <li key={c.id}>
                  <a
                    href={c.signupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-opacity active:opacity-80"
                    style={{ background: toneOf(c.studio).bg, color: toneOf(c.studio).ink }}
                  >
                    <span className="w-14 shrink-0 text-[17px] font-semibold tabular-nums tracking-[-0.02em]">
                      {shortTime(c.start)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium">{c.title}</span>
                      <span className="block truncate text-[13px] opacity-75">
                        {formatLocationLabel(c.studio, c.location)}
                      </span>
                    </span>
                    <span aria-hidden>↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </Fragment>
        ))}
      </div>
    </div>
  )
}
