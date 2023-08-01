import { writable } from 'svelte/store'

export const badgeSize = writable(128)

export const categories = writable([])

export const authData = writable({ isValid: false })

export const ownedBadges = writable([])
