import PocketBase, { LocalAuthStore } from 'pocketbase'
import { withRequestCounter } from './index.js'

// A separate client with its own auth storage key, so a superuser session
// here never shares (and can't overwrite) the regular OAuth user session
// held by the main `pb` client in ./index.js - both can be logged in at
// once in the same browser.
export const pbAdmin = new PocketBase('/', new LocalAuthStore('pb_admin_auth'))

// Same in-flight counter as the main client, so admin requests drive the
// loading bar too.
withRequestCounter(pbAdmin)
