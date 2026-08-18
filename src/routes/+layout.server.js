import PocketBase from 'pocketbase'
import { env } from '$env/dynamic/private'

// Read the flags from inside the cluster instead of letting the relative
// client URL resolve to the public origin: an SSR fetch to https://ingress.plus
// leaves the pod, crosses Cloudflare and comes back in, adding a round trip to
// every render and making it depend on external networking. PB_INTERNAL_URL
// points straight at the backend Service. The fallback keeps `yarn dev` (and
// any environment without the variable) working against production.
const baseUrl = env.PB_INTERNAL_URL || 'https://ingress.plus'

export async function load () {
  // A fresh client per request: a module-level one would be shared by every
  // concurrent SSR request, which is what already forced auto-cancellation off
  // in $lib/pocketbase and would leak authStore state the moment anything here
  // starts authenticating.
  const pb = new PocketBase(baseUrl)

  try {
    const records = await pb.collection('feature_flags').getFullList()
    return { featureFlags: Object.fromEntries(records.map(r => [r.name, r.enabled])) }
  } catch (err) {
    // Fall back to the defaults in $lib/featureFlags rather than failing the
    // whole app: a flag we cannot read is treated as disabled.
    console.error('Failed to load feature flags:', err)
    return { featureFlags: null }
  }
}
