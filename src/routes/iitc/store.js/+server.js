import store from '$lib/iitc/store.js?raw'

// The IITC store UI, fetched and injected by the sideloader userscript from
// https://intel.ingress.com. It's public code with no credentials involved,
// so any origin may read it. no-cache keeps agents on the deployed version.
export function GET () {
  return new Response(store, {
    headers: {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    }
  })
}
