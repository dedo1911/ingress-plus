import { derived, writable } from 'svelte/store'

export const badgeSize = writable(128)

// Number of PocketBase requests currently in flight. Kept up to date by the
// fetch wrapper in $lib/pocketbase and read by the global loading bar.
export const pendingRequests = writable(0)

export const isLoading = derived(pendingRequests, count => count > 0)

export const authData = writable({ isValid: null })

// Set by Header's login() right before it updates authData, so the
// onboarding-modal check in +layout.svelte can tell "just completed OAuth"
// apart from "page load restored an existing session" - both make authData
// valid, but only the former should count as "logging in fresh".
export const freshLogin = writable(false)

export const ownedBadges = writable([])

// Keyed by badge id. Every writer (BadgeModal, /badges/import, onboarding)
// keeps at most one user_badges row per badge, so a plain Map is exact.
// Badge.svelte and BadgeModal used to .some() over the whole array per
// cell - ~1400 linear scans on every checkbox toggle on /badges.
export const ownedBadgesByBadge = derived(ownedBadges, bs => new Map(bs.map(b => [b.badge, b])))

// Terminal onboardingState values - shared so +layout.svelte's modal-trigger
// logic and /onboarding's own alreadyDone gate can't drift out of sync.
export const ONBOARDING_DONE_STATES = ['completed', 'skipped']

export const siteSettings = writable({
  opaqueOwned: true,
  showUnobtainable: true
})
