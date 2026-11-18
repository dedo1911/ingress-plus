import { defineEnvVars } from '@sveltejs/kit/env'

// Read through $app/env/private. Validated when the server starts.
export const variables = defineEnvVars({
  PB_INTERNAL_URL: {
    description: 'In-cluster PocketBase URL for server-side requests. Unset in `yarn dev`, which falls back to https://ingress.plus.',
    // Optional: returning undefined is allowed.
    schema: (value) => value || undefined
  }
})
