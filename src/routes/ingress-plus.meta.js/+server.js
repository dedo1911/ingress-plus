import sideloader from '#lib/iitc/ingress-plus.user.js?raw'

// Just the ==UserScript== block of the sideloader, the @updateURL that
// userscript managers poll to see whether @version changed. It's a few
// hundred bytes instead of the whole script. no-cache for the same reason
// as the script itself (see ../ingress-plus.user.js/+server.js).
const meta = sideloader.match(/^\/\/ ==UserScript==[\s\S]*?^\/\/ ==\/UserScript==$/m)[0] + '\n'

export function GET () {
  return new Response(meta, {
    headers: {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Cache-Control': 'no-cache'
    }
  })
}
