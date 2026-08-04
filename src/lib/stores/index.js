import { derived, writable } from 'svelte/store'

export const badgeSize = writable(128)

// Number of PocketBase requests currently in flight. Kept up to date by the
// fetch wrapper in $lib/pocketbase and read by the global loading bar.
export const pendingRequests = writable(0)

export const isLoading = derived(pendingRequests, count => count > 0)

export const categories = writable([])

export const authData = writable({ isValid: null })

// Set by Header's login() right before it updates authData, so the
// onboarding-modal check in +layout.svelte can tell "just completed OAuth"
// apart from "page load restored an existing session" - both make authData
// valid, but only the former should count as "logging in fresh".
export const freshLogin = writable(false)

export const ownedBadges = writable([])

export const siteSettings = writable({
  opaqueOwned: true,
  showUnobtainable: true
})
