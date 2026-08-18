import PocketBase, { LocalAuthStore } from 'pocketbase'
import { browser } from '$app/environment'
import { pendingRequests } from '$lib/stores'

// A separate client with its own auth storage key, so a superuser session
// here never shares (and can't overwrite) the regular OAuth user session
// held by the main `pb` client in ./index.js - both can be logged in at
// once in the same browser.
export const pbAdmin = new PocketBase('/', new LocalAuthStore('pb_admin_auth'))

if (browser) {
  pbAdmin.beforeSend = (url, options) => {
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
