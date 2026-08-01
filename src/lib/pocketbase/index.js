import PocketBase from 'pocketbase'
import { browser } from '$app/environment'
import { pendingRequests } from '$lib/stores'

export const serverAddress = ''

export const pb = new PocketBase('/')

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
