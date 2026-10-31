import seo from '../content/seo.json'

export type RouteKey = keyof typeof seo.routes

export const SITE = seo.site

export function normalizePath(pathname: string): string {
  const p = pathname.replace(/\/index\.html$/, '/')
  return p.endsWith('/') ? p : `${p}/`
}

export function routeForPath(pathname: string): RouteKey | null {
  const p = normalizePath(pathname)
  return p in seo.routes ? (p as RouteKey) : null
}

/** JSON-LD graph for a route (kept in sync with scripts/prerender.mjs). */
export function jsonLdFor(path: RouteKey) {
  const r = seo.routes[path]
  const url = `${SITE}${path}`
  const person =
    path === '/yoga/'
      ? {
          ...seo.person,
          jobTitle: 'Yoga Teacher',
          hasCredential: '500-hour Registered Yoga Teacher (RYT 500)',
        }
      : seo.person
  const graph: Record<string, unknown>[] = [person]
  if (path === '/') {
    graph.push({
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: `${SITE}/`,
      name: seo.name,
      description: r.description,
      author: { '@id': seo.person['@id'] },
    })
  } else {
    graph.push({
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: r.title,
      description: r.description,
      about: { '@id': seo.person['@id'] },
    })
  }
  return { '@context': 'https://schema.org', '@graph': graph }
}

function setMeta(sel: string, attr: 'content' | 'href', value: string) {
  const el = document.head.querySelector(sel)
  if (el) el.setAttribute(attr, value)
}

/** Keeps the head in sync when navigating without a page load. */
export function applySeo(path: RouteKey) {
  const r = seo.routes[path]
  const url = `${SITE}${path}`
  document.title = r.title
  setMeta('meta[name="description"]', 'content', r.description)
  setMeta('link[rel="canonical"]', 'href', url)
  setMeta('meta[property="og:title"]', 'content', r.title)
  setMeta('meta[property="og:description"]', 'content', r.description)
  setMeta('meta[property="og:url"]', 'content', url)
  setMeta('meta[property="og:type"]', 'content', r.type)
  setMeta('meta[name="twitter:title"]', 'content', r.title)
  setMeta('meta[name="twitter:description"]', 'content', r.description)
  const ld = document.getElementById('ld-json')
  if (ld) ld.textContent = JSON.stringify(jsonLdFor(path))
}

export function applyNotFoundSeo() {
  document.title = 'Page not found • Shawn Jr'
  setMeta('meta[name="robots"]', 'content', 'noindex,follow')
}
