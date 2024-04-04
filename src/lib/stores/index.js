import { writable } from 'svelte/store'

export const badgeSize = writable(128)

export const categories = writable([])

export const authData = writable({ isValid: null })

export const ownedBadges = writable([])

export const siteSettings = writable({
  opaqueOwned: true,
  showUnobtainable: true
})
