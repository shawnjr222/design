/**
 * Fetch HAUM SF (Walla) classes taught by Shawn.
 *
 * Walla's widget API is public JSON (the same one the haumstudios.com schedule iframe calls),
 * but it sends no CORS headers, so the browser can't read it. This runs server-side and writes
 * public/data/haum-schedule.json, which the site loads like the Arise one.
 *
 * Classes are matched on Shawn's Walla staff ID. class_instance.staff is the teacher actually
 * assigned to that date, so substitutes show up (and drop off) on their own.
 *
 * Usage:
 *   node scripts/fetch-haum-schedule.mjs
 *   HAUM_STAFF_ID=99455 node scripts/fetch-haum-schedule.mjs   # debug with another teacher
 */

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public/data/haum-schedule.json')

const API = 'https://api.hellowalla.com/api/dingo/v1'
/** HAUM's public widget UUID (visible in the schedule iframe URL on haumstudios.com). */
const UUID = '20bbf46e-9f1c-46aa-bcec-431e3b491d7a'
const STAFF_ID = Number(process.env.HAUM_STAFF_ID || 153339)
const DAYS = Number(process.env.HAUM_DAYS || 60)
/**
 * Walla's loader forwards the host page's query string into the schedule widget, so
 * haumstudios.com/schedule?instructorId=…&date=… opens that day, filtered to Shawn, with Book buttons.
 */
const SCHEDULE_URL = 'https://www.haumstudios.com/schedule'
const ymd = (iso) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date(iso))
const signupUrl = (c) => `${SCHEDULE_URL}?instructorId=${STAFF_ID}&date=${ymd(c.start_time)}`
const place = (c) => {
  const n = String(c.course?.location?.name || '').trim()
  return n ? n.charAt(0).toUpperCase() + n.slice(1).toLowerCase() : 'San Francisco'
}

const tidy = (t) => {
  const s = String(t || 'Class').replace(/\s+/g, ' ').trim()
  return s === s.toUpperCase() ? s.toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase()) : s
}

const headers = { 'Integration-Id': UUID, 'HTTP-JWT-AUD': 'widget' }

async function get(pathname, params = {}) {
  const url = new URL(API + pathname)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`Walla ${pathname} failed (${res.status})`)
  return res.json()
}

const now = new Date()
const horizon = new Date(now.getTime() + DAYS * 24 * 60 * 60 * 1000)
const iso = (d) => d.toISOString().replace(/\.\d{3}Z$/, 'Z')

const all = []
for (let page = 1; page <= 30; page++) {
  const data = await get('/class_instances', {
    start_time: `between|${iso(now)}|${iso(horizon)}`,
    per_page: '100',
    page: String(page),
  })
  all.push(...(data.records ?? []))
  if (page >= (data.total_pages ?? 1)) break
}

const classes = all
  .filter((c) => c.staff?.id === STAFF_ID)
  .filter((c) => c.active && !c.inactive_status && c.is_public && c.available_in_person)
  .map((c) => ({
    id: `haum-${c.id}`,
    title: tidy(c.display_name || c.name),
    start: new Date(c.start_time).toISOString(),
    end: new Date(c.end_time).toISOString(),
    location: place(c),
    studio: 'HAUM',
    signupUrl: signupUrl(c),
  }))
  .sort((a, b) => new Date(a.start) - new Date(b.start))

await mkdir(path.dirname(OUT), { recursive: true })
await writeFile(
  OUT,
  JSON.stringify(
    { fetchedAt: now.toISOString(), source: 'walla', staffId: String(STAFF_ID), classes },
    null,
    2,
  ) + '\n',
)
console.log(`Wrote ${classes.length} HAUM class(es) from ${all.length} scanned → ${path.relative(ROOT, OUT)}`)
