import { derived, writable } from 'svelte/store'

export const badgeSize = writable(128)

// Number of PocketBase requests currently in flight. Kept up to date by the
// fetch wrapper in $lib/pocketbase and read by the global loading bar.
export const pendingRequests = writable(0)

export const isLoading = derived(pendingRequests, count => count > 0)

export const categories = writable([])

export const authData = writable({ isValid: null })

export const ownedBadges = writable([])

export const siteSettings = writable({
  opaqueOwned: true,
  showUnobtainable: true
})
