// Umami only counts pageviews by default. Report clicks on links that leave the site.
declare global {
  interface Window {
    umami?: { track: (name: string, data?: Record<string, string>) => void }
  }
}

document.addEventListener(
  'click',
  (e) => {
    const link = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
    if (!link || link.origin === location.origin || !/^https?:$/.test(link.protocol)) return
    window.umami?.track('outbound-click', { url: link.href })
  },
  true,
)
