// After `vite build`: writes one static HTML file per route with its own head
// (title, description, canonical, Open Graph, JSON-LD), then snapshots the first
// paint of each page into the body so crawlers and link previews see real content.
// Also writes sitemap.xml and a noindex 404.html. The body snapshot is best-effort:
// if Playwright is unavailable the pages still ship with the correct head.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const seo = JSON.parse(readFileSync(join(root, 'src/content/seo.json'), 'utf8'))
const template = readFileSync(join(dist, 'index.html'), 'utf8')

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

function jsonLd(path) {
  const r = seo.routes[path]
  const url = `${seo.site}${path}`
  const person =
    path === '/yoga/'
      ? {
          ...seo.person,
          jobTitle: 'Yoga Teacher',
          hasCredential: '500-hour Registered Yoga Teacher (RYT 500)',
        }
      : seo.person
  const graph = [person]
  if (path === '/') {
    graph.push({
      '@type': 'WebSite',
      '@id': `${seo.site}/#website`,
      url: `${seo.site}/`,
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

function seoBlock(path, { noindex = false, title, description } = {}) {
  const r = seo.routes[path] ?? { type: 'website' }
  const t = title ?? r.title
  const d = description ?? r.description
  const url = `${seo.site}${path}`
  const img = `${seo.site}${seo.ogImage}`
  return `<!-- seo:start (replaced per page by scripts/prerender.mjs) -->
    <title>${esc(t)}</title>
    <meta name="description" content="${esc(d)}" />
    <meta name="robots" content="${noindex ? 'noindex,follow' : 'index,follow'}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:site_name" content="${esc(seo.name)}" />
    <meta property="og:type" content="${r.type}" />
    <meta property="og:title" content="${esc(t)}" />
    <meta property="og:description" content="${esc(d)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${img}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(t)}" />
    <meta name="twitter:description" content="${esc(d)}" />
    <meta name="twitter:image" content="${img}" />
    <script type="application/ld+json" id="ld-json">${
      seo.routes[path] && !noindex ? JSON.stringify(jsonLd(path)) : '{}'
    }</script>
    <!-- seo:end -->`
}

const withSeo = (html, block) =>
  html.replace(/<!-- seo:start[\s\S]*?<!-- seo:end -->/, block)

const outFile = (path) =>
  path === '/' ? join(dist, 'index.html') : join(dist, path, 'index.html')

function write(file, html) {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, html)
}

// 1) head-only pages (always works)
const pages = {}
for (const path of Object.keys(seo.routes)) {
  pages[path] = withSeo(template, seoBlock(path))
  write(outFile(path), pages[path])
}
write(
  join(dist, '404.html'),
  withSeo(
    template,
    seoBlock('/', { noindex: true, title: 'Page not found • Shawn Jr', description: 'Page not found' }),
  ),
)

// 2) sitemap
const today = new Date().toISOString().slice(0, 10)
write(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${Object.keys(
    seo.routes,
  )
    .map(
      (p) =>
        `  <url><loc>${seo.site}${p}</loc><lastmod>${today}</lastmod></url>`,
    )
    .join('\n')}\n</urlset>\n`,
)

// 3) body snapshot (best effort)
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.JPG': 'image/jpeg',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
}

function serve() {
  const server = createServer((req, res) => {
    let p = decodeURIComponent((req.url ?? '/').split('?')[0])
    let file = normalize(join(dist, p))
    if (!file.startsWith(dist)) return res.writeHead(403).end()
    if (p.endsWith('/')) file = join(file, 'index.html')
    if (!existsSync(file)) file = join(dist, '404.html')
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' })
    res.end(readFileSync(file))
  })
  return new Promise((resolve) => server.listen(0, () => resolve(server)))
}

try {
  const { chromium } = await import('playwright')
  const server = await serve()
  const port = server.address().port
  const browser = await chromium.launch()
  try {
    for (const path of Object.keys(seo.routes)) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
      await page.goto(`http://localhost:${port}${path}`, { waitUntil: 'domcontentloaded' })
      await page.waitForSelector('#root h1', { state: 'attached', timeout: 15000 })
      const inner = await page.evaluate(() => document.getElementById('root').innerHTML)
      await page.close()
      if (!inner || inner.length < 200) throw new Error(`empty snapshot for ${path}`)
      const html = pages[path].replace('<div id="root"></div>', `<div id="root">${inner}</div>`)
      if (html === pages[path]) throw new Error(`no #root placeholder in ${path}`)
      write(outFile(path), html)
      console.log(`prerendered ${path} (${(inner.length / 1024).toFixed(0)} KB of markup)`)
    }
  } finally {
    await browser.close()
    server.close()
  }
} catch (err) {
  console.warn('prerender: body snapshot skipped,', err.message)
}
