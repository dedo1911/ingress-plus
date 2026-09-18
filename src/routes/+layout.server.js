import { createServerClient } from '$lib/server/pocketbase'

export async function load () {
  // See $lib/server/pocketbase for why this is in-cluster and per request.
  const pb = createServerClient()

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
