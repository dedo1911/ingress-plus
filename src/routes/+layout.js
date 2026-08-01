import { pb } from '$lib/pocketbase'
import { featureFlags, featureFlagsLoaded } from '$lib/featureFlags'

export async function load ({ fetch }) {
  try {
    const records = await pb.collection('feature_flags').getFullList({ fetch })
    featureFlags.set(Object.fromEntries(records.map(r => [r.name, r.enabled])))
  } catch (err) {
    // Fall back to the defaults in $lib/featureFlags rather than failing the
    // whole app: a flag we cannot read is treated as disabled.
    console.error('Failed to load feature flags:', err)
  } finally {
    featureFlagsLoaded.set(true)
  }
  return {}
}
