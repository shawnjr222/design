/**
 * Scrape Arise Yoga (WellnessLiving) schedule for Shawn's classes.
 *
 * WL public APIs need signed SDK credentials + Incapsula clearance, so we
 * drive the official schedule widget in Chromium and capture Schedule.json.
 *
 * Classes are matched on Shawn's WellnessLiving staff ID (k_staff), which
 * exists now that he has a staff account at Arise. The ID survives name
 * edits and can't collide with another "Shawn". The name match is only a
 * fallback, used when ARISE_STAFF_ID is set to "".
 *
 * Usage:
 *   node scripts/fetch-arise-schedule.mjs
 *   ARISE_STAFF_ID=521761 node scripts/fetch-arise-schedule.mjs         # debug with another teacher
 *   ARISE_STAFF_ID= ARISE_STAFF_MATCH="Sophie" node scripts/fetch-arise-schedule.mjs
 */

import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'public/data/arise-schedule.json')

const K_BUSINESS = '351410'
const K_SKIN = '275271'
/** Arise SF (Pacific Heights). Oakland is 252897. */
const K_LOCATION = '300238'
const DAYS = Number(process.env.ARISE_DAYS || 30)
/** Shawn Jr's WellnessLiving staff ID at Arise. Set to "" to fall back to name matching. */
const STAFF_ID = process.env.ARISE_STAFF_ID ?? '949719'
/** Case-insensitive match against staff full name. Only used when STAFF_ID is empty. */
const STAFF_MATCH = process.env.ARISE_STAFF_MATCH || 'Shawn'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function todayYmd(timeZone = 'America/Los_Angeles') {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function widgetUrl(dtDate) {
  const q = new URLSearchParams({
    id_screen: '2',
    k_business: K_BUSINESS,
    k_location: K_LOCATION,
    k_skin: K_SKIN,
    dt_date: dtDate,
    is_week: '0',
  })
  return `https://www.wellnessliving.com/en-frame/rs/schedule-list-widget.html?${q}`
}

/**
 * Who is actually teaching this session. a_session_staff reflects this
 * occurrence (including subs); a_staff is the class's regular teacher.
 * Preferring the session list means a class Shawn subs out of drops off,
 * and one he subs in for shows up.
 */
function teachingStaff(cls) {
  if (cls.a_session_staff?.length) return cls.a_session_staff
  return cls.a_staff || []
}

function staffMatches(cls) {
  const staff = teachingStaff(cls)
  if (STAFF_ID) return staff.some((s) => String(s.k_staff) === STAFF_ID)
  const hay = staff
    .map((s) => `${s.s_name_full || ''} ${s.s_staff || ''} ${s.html_staff || ''}`)
    .join(' ')
  return hay.toLowerCase().includes(STAFF_MATCH.toLowerCase())
}

function normalizeClass(cls) {
  const staff = teachingStaff(cls)[0]?.s_name_full || 'Arise'

  const epoch = Number(cls.i_date || cls.t_time)
  let start
  if (Number.isFinite(epoch) && epoch > 0) {
    start = new Date(epoch * 1000)
  } else {
    const startLocal = cls.dt_date_local || cls.dt_sort
    if (!startLocal) return null
    // WL local stamps are America/Los_Angeles wall times.
    start = new Date(startLocal.replace(' ', 'T') + '-07:00')
  }
  if (Number.isNaN(start.getTime())) return null

  const durationMin = Number(cls.i_duration) || 60
  const end = new Date(start.getTime() + durationMin * 60 * 1000)

  const signupUrl =
    cls['url-book-process'] ||
    cls['url-book'] ||
    'https://www.arise.yoga/sanfrancisco'

  return {
    id: `arise-${cls.k_class_period}-${epoch || start.toISOString()}`,
    title: cls.s_class || cls.html_class || cls.text_class || 'Class',
    start: start.toISOString(),
    end: end.toISOString(),
    location: cls.s_location || cls.html_location || 'San Francisco',
    studio: 'Arise',
    signupUrl,
    staff,
  }
}

async function scrape() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const byId = new Map()

  page.on('response', async (response) => {
    const url = response.url()
    if (!url.includes('/Wl/Schedule/Schedule.json')) return
    if (!response.ok()) return
    try {
      const data = await response.json()
      for (const day of data.a_schedule || []) {
        for (const cls of day.a_class || []) {
          if (cls.is_cancel === '1' || cls.is_cancel === 1) continue
          if (cls.is_virtual) continue
          if (!staffMatches(cls)) continue
          const item = normalizeClass(cls)
          if (!item) continue
          byId.set(item.id, item)
        }
      }
    } catch {
      // ignore non-JSON / aborted
    }
  })

  const startDate = todayYmd()
  await page.goto(widgetUrl(startDate), {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  })
  await sleep(2000)

  for (let i = 0; i < DAYS; i++) {
    const next = page.locator('.js-navigation-next-button').first()
    if ((await next.count()) === 0) break
    await Promise.all([
      page
        .waitForResponse(
          (r) =>
            r.url().includes('/Wl/Schedule/Schedule.json') && r.ok(),
          { timeout: 15_000 },
        )
        .catch(() => null),
      next.click(),
    ])
    await sleep(200)
  }

  await browser.close()

  const classes = [...byId.values()].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  )

  const payload = {
    fetchedAt: new Date().toISOString(),
    source: 'wellnessliving',
    business: K_BUSINESS,
    location: K_LOCATION,
    staffId: STAFF_ID || null,
    staffMatch: STAFF_ID ? null : STAFF_MATCH,
    classes,
  }

  await mkdir(path.dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(payload, null, 2) + '\n')
  const matcher = STAFF_ID ? `staff ${STAFF_ID}` : `"${STAFF_MATCH}"`
  console.log(
    `Wrote ${classes.length} Arise class(es) for ${matcher} → ${path.relative(ROOT, OUT)}`,
  )
  return payload
}

scrape().catch((err) => {
  console.error(err)
  process.exit(1)
})
