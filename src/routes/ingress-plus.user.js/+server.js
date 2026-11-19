import sideloader from '#lib/iitc/ingress-plus.user.js?raw'

// The sideloader userscript. Served from a route rather than static/ so it
// can say no-cache: as a static file it had no Cache-Control, and Cloudflare
// kept serving the old copy for hours after a release, so userscript
// managers checking @updateURL didn't see the new @version.
export function GET () {
  return new Response(sideloader, {
    headers: {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Cache-Control': 'no-cache'
    }
  })
}
