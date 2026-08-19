import { featureFlags, featureFlagsLoaded } from '$lib/featureFlags'

export async function load ({ data }) {
  // The fetch itself happens in +layout.server.js; this only mirrors the result
  // into the stores the components read, so nothing downstream had to change.
  if (data?.featureFlags) featureFlags.set(data.featureFlags)
  featureFlagsLoaded.set(true)

  return data
}
