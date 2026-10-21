import { json } from '@sveltejs/kit'
import { createServerClient } from '$lib/server/pocketbase'

// The stat-import proxies forward third-party API keys upstream from our own
// IP. The page is auth-gated but the endpoints weren't, which made them a
// free key-validation oracle and a way to get ingress.plus rate-limited by
// Agent Stats / Stats Tracker Pro for everyone. Sessions live only in the
// browser's localStorage (no cookie, no hooks), so the client sends its
// PocketBase token and we ask PocketBase whether it's good.
const WINDOW_MS = 60 * 1000
const MAX_PER_WINDOW = 6

// ponytail: in-memory per process, so a multi-replica deploy gets one bucket
// per replica; move to PocketBase or Redis if that ever matters.
const recent = new Map() // userId -> [timestamps within the window]

const isRateLimited = (userId) => {
  const now = Date.now()
  const hits = (recent.get(userId) || []).filter(t => now - t < WINDOW_MS)
  hits.push(now)
  recent.set(userId, hits)
  return hits.length > MAX_PER_WINDOW
}

// Resolves to the caller's user id, or to a ready-made error Response.
export async function guardImportRequest (request) {
  const token = request.headers.get('authorization')
  if (!token) return json({ error: 'You need to be logged in to import stats.' }, { status: 401 })

  const pb = createServerClient()
  pb.authStore.save(token, null)
  let userId
  try {
    userId = (await pb.collection('users').authRefresh()).record.id
  } catch {
    return json({ error: 'Your session has expired. Please log in again.' }, { status: 401 })
  }

  if (isRateLimited(userId)) {
    return json({ error: 'Too many imports in a row. Please wait a minute and try again.' }, { status: 429 })
  }

  return userId
}
