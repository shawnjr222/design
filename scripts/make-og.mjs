// Renders public/og.png (1200x630 share image) from the site's own fonts and colors.
// Run once with `npm run seo:og`; the PNG is committed.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const font = (f) => readFileSync(join(root, 'public/fonts', f)).toString('base64')

const html = `<!doctype html><html><head><style>
@font-face{font-family:A;font-weight:500;src:url(data:font/ttf;base64,${font('Aeonik-Medium.ttf')})}
@font-face{font-family:A;font-weight:400;src:url(data:font/ttf;base64,${font('Aeonik-Regular.ttf')})}
html,body{margin:0}
body{width:1200px;height:630px;background:#f3f3f1;color:#111110;font-family:A,sans-serif;position:relative;overflow:hidden}
.glow{position:absolute;inset:0;background:radial-gradient(ellipse 80% 55% at 50% -10%,rgba(31,77,69,.09),transparent 60%)}
.wrap{position:absolute;left:84px;right:84px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center}
.eyebrow{font-size:30px;color:#757570;margin:0 0 28px}
h1{font-size:104px;line-height:1.05;letter-spacing:-0.045em;font-weight:500;margin:0}
p.sub{font-size:36px;line-height:1.35;color:#3d3d3a;margin:32px 0 0;max-width:900px}
.url{position:absolute;left:84px;bottom:56px;font-size:28px;color:#757570}
.bar{position:absolute;left:0;top:0;bottom:0;width:14px;background:#1f4d45}
</style></head><body>
<div class="glow"></div><div class="bar"></div>
<div class="wrap">
<p class="eyebrow">Based in San Francisco, CA</p>
<h1>Shawn Jr</h1>
<p class="sub">Product designer with 8+ years of experience</p>
</div>
<div class="url">shawnjr.online</div>
</body></html>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.setContent(html)
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: join(root, 'public/og.png') })
await browser.close()
console.log('wrote public/og.png')
