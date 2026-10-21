import { createServerClient } from '$lib/server/pocketbase'

// Every page render used to re-read the flags. They are eventually-consistent
// by nature (an admin toggle is a deliberate act, not a per-request signal),
// so one in-cluster round trip per FLAGS_TTL_MS per process is plenty. A
// failed read is not cached: the next request tries again.
const FLAGS_TTL_MS = 30 * 1000
let cachedFlags = null
let cachedAt = 0

export async function load () {
  if (cachedFlags && Date.now() - cachedAt < FLAGS_TTL_MS) return { featureFlags: cachedFlags }

  // See $lib/server/pocketbase for why this is in-cluster and per request.
  const pb = createServerClient()

  try {
    const records = await pb.collection('feature_flags').getFullList()
    cachedFlags = Object.fromEntries(records.map(r => [r.name, r.enabled]))
    cachedAt = Date.now()
    return { featureFlags: cachedFlags }
  } catch (err) {
    // Fall back to the defaults in $lib/featureFlags rather than failing the
    // whole app: a flag we cannot read is treated as disabled.
    console.error('Failed to load feature flags:', err)
    return { featureFlags: null }
  }
}
