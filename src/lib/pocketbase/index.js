import PocketBase from 'pocketbase'
import { browser } from '$app/environment'
import { pendingRequests } from '$lib/stores'

export const serverAddress = ''

export const pb = new PocketBase('/')

// Auto-cancellation keys in-flight requests by collection+method and aborts
// the older one on a collision. That is right in a browser tab - one user,
// and a superseded navigation should not keep fetching - but wrong on the
// server, where this module is a singleton shared by every concurrent SSR
// request: two unrelated visitors hitting the same collection cancel each
// other. The root layout reads feature_flags on every single request, so
// under load nearly all of them lost that race.
if (!browser) pb.autoCancellation(false)

// Count in-flight requests so the app can show a global loading indicator.
// Only in the browser: on the server this module is shared by every concurrent
// SSR request, so a module-level counter there would mix unrelated requests
// together (and there is no live UI to drive anyway).
//
// The counter is bumped inside a wrapped `fetch` rather than in the SDK's
// beforeSend/afterSend pair because afterSend only runs on a successful
// response — network failures and requests killed by the SDK's auto-cancellation
// would leak the count and leave the bar stuck on forever.
if (browser) {
  pb.beforeSend = (url, options) => {
    // `options.fetch` is set when a load function passes the framework fetch
    // through; fall back to the platform one for plain client-side calls.
    const send = options.fetch ?? globalThis.fetch

    return {
      url,
      options: {
        ...options,
        fetch: async (...args) => {
          pendingRequests.update(count => count + 1)
          try {
            return await send(...args)
          } finally {
            pendingRequests.update(count => Math.max(0, count - 1))
          }
        }
      }
    }
  }
}
