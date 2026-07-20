import { writable } from 'svelte/store'

export const featureFlags = writable({
  VERIFICATION_ENABLED: false,
  BUG_REPORTS_ENABLED: false
})

export const featureFlagsLoaded = writable(false)
