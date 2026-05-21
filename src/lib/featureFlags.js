import { writable } from 'svelte/store'

export const featureFlags = writable({
  VERIFICATION_ENABLED: false
})
