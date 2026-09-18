import PocketBase from 'pocketbase'
import { env } from '$env/dynamic/private'

// Server-side PocketBase access goes to the in-cluster Service instead of
// letting the relative client URL resolve to the public origin: an SSR fetch
// to https://ingress.plus leaves the pod, crosses Cloudflare and comes back
// in. The fallback keeps `yarn dev` (and any environment without the
// variable) working against production.
const baseUrl = env.PB_INTERNAL_URL || 'https://ingress.plus'

// Always a fresh client: a module-level one would be shared by every
// concurrent request, which is what already forced auto-cancellation off in
// $lib/pocketbase and would leak authStore state between users the moment
// anything here authenticates.
export const createServerClient = () => new PocketBase(baseUrl)
