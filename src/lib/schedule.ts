/** Live Folk (Momence) + Arise (WellnessLiving) schedule for Shawn Jr. */

const FOLK_HOST_ID = 35337
const TEACHER_ID = 145335
const SESSION_TYPES = [
  'course-class',
  'fitness',
  'retreat',
  'special-event',
  'special-event-new',
] as const

const TZ = 'America/Los_Angeles'

export type Studio = 'Folk SF' | 'Arise'

export type YogaClass = {
  id: string
  title: string
  start: Date
  end: Date
  location: string
  studio: Studio
  signupUrl: string
}

type MomenceSession = {
  id?: string | number
  sessionName?: string
  name?: string
  startsAt?: string
  endsAt?: string
  isCancelled?: boolean
  inPerson?: boolean
  location?: string
  link?: string
  image?: string
  hostId?: number
  inPersonLocation?: { name?: string } | null
}

type ArisePayload = {
  classes?: Array<{
    id: string
    title: string
    start: string
    end: string
    location: string
    studio: Studio
    signupUrl: string
  }>
}

function isLivestream(session: MomenceSession, title: string) {
  if (session.inPerson === false) return true
  return title.toLowerCase().includes('(livestream)')
}

function locationOf(session: MomenceSession) {
  if (session.location) return session.location
  if (session.inPersonLocation?.name) return session.inPersonLocation.name
  return ''
}

function studioOf(session: MomenceSession, location: string): Studio {
  const haystack = `${session.image ?? ''} ${location}`.toLowerCase()
  if (haystack.includes('arise')) return 'Arise'
  if (session.hostId === FOLK_HOST_ID || haystack.includes('folk')) return 'Folk SF'
  return 'Folk SF'
}

export function formatLocationLabel(studio: Studio, location: string) {
  if (!location) return studio
  return `${studio} · ${location}`
}

export function formatClassTimeRange(start: Date, end: Date) {
  const day = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(start)
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
  })
  return `${day} · ${time.format(start)}–${time.format(end)}`
}

async function fetchFolkClasses(days: number): Promise<YogaClass[]> {
  const now = new Date()
  const horizon = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

  const params = new URLSearchParams()
  for (const type of SESSION_TYPES) params.append('sessionTypes[]', type)
  params.set('fromDate', now.toISOString().replace(/\.\d{3}Z$/, '.000Z'))
  params.set('pageSize', '100')
  params.set('page', '0')
  params.set('timeZone', TZ)
  params.append('teacherIds[]', String(TEACHER_ID))

  const url = `https://readonly-api.momence.com/host-plugins/host/${FOLK_HOST_ID}/host-schedule/sessions?${params}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Folk schedule fetch failed (${res.status})`)

  const data = (await res.json()) as { payload?: MomenceSession[] }
  const sessions = data.payload ?? []
  const classes: YogaClass[] = []

  for (const session of sessions) {
    if (session.isCancelled) continue
    const title = session.sessionName || session.name || 'Class'
    if (isLivestream(session, title)) continue
    if (!session.startsAt || !session.endsAt) continue

    const start = new Date(session.startsAt)
    const end = new Date(session.endsAt)
    if (Number.isNaN(start.getTime()) || start < now || start > horizon) continue

    const location = locationOf(session)
    const signupUrl =
      session.link ||
      (session.id != null ? `https://momence.com/s/${session.id}` : '')
    if (!signupUrl) continue

    classes.push({
      id: String(session.id ?? `${title}-${session.startsAt}`),
      title,
      start,
      end,
      location,
      studio: studioOf(session, location),
      signupUrl,
    })
  }

  return classes
}

async function fetchAriseClasses(days: number): Promise<YogaClass[]> {
  const now = new Date()
  const horizon = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

  try {
    const res = await fetch('/data/arise-schedule.json', { cache: 'no-store' })
    if (!res.ok) return []
    const data = (await res.json()) as ArisePayload
    const classes: YogaClass[] = []

    for (const item of data.classes ?? []) {
      const start = new Date(item.start)
      const end = new Date(item.end)
      if (Number.isNaN(start.getTime()) || start < now || start > horizon) continue
      if (!item.signupUrl) continue
      classes.push({
        id: item.id,
        title: item.title,
        start,
        end,
        location: item.location,
        studio: 'Arise',
        signupUrl: item.signupUrl,
      })
    }
    return classes
  } catch {
    return []
  }
}

export async function fetchUpcomingClasses(days = 30): Promise<YogaClass[]> {
  const [folk, arise] = await Promise.all([
    fetchFolkClasses(days),
    fetchAriseClasses(days),
  ])

  const classes = [...folk, ...arise]
  classes.sort((a, b) => a.start.getTime() - b.start.getTime())
  return classes
}

/** Session-warmed schedule so the intro can finish with yoga data ready. */
let warmPromise: Promise<YogaClass[]> | null = null

export function warmUpcomingClasses(days = 30): Promise<YogaClass[]> {
  if (!warmPromise) {
    warmPromise = fetchUpcomingClasses(days).catch((err) => {
      warmPromise = null
      throw err
    })
  }
  return warmPromise
}
