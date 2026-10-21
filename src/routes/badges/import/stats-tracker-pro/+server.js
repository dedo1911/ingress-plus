import { json } from '@sveltejs/kit'
import { guardImportRequest } from '$lib/server/importGuard'

const STATS_TRACKER_PRO_BASE = 'https://the-grid.blue'

// Stats Tracker Pro's API otherwise has clean CORS headers (it sends
// Access-Control-Allow-Methods/-Headers) but never Access-Control-Allow-
// Origin, so browsers still block a direct client-side call - this has to
// be proxied server-side. Unlike Agent Stats/The Grid, it returns real
// HTTP status codes and a clear JSON error message on failure, so no
// special-casing is needed here beyond passing those through.
export async function POST ({ request, fetch }) {
  const guard = await guardImportRequest(request)
  if (guard instanceof Response) return guard
  const { apiKey } = await request.json()
  if (!apiKey || typeof apiKey !== 'string') {
    return json({ error: 'Missing API key.' }, { status: 400 })
  }

  let response
  try {
    response = await fetch(`${STATS_TRACKER_PRO_BASE}/api_public.php?action=uploads`, {
      headers: { 'X-API-Key': apiKey }
    })
  } catch (err) {
    console.error(err)
    return json({ error: 'Could not reach Stats Tracker Pro. Please try again later.' }, { status: 502 })
  }

  let body
  try {
    body = await response.json()
  } catch {
    // Confirmed by deliberately triggering it that a 429 comes back as
    // normal JSON like every other error (caught below), so this only
    // fires if something never reaches the PHP app at all - e.g. Cloudflare
    // itself throttling at the edge with an HTML response.
    if (response.status === 429) {
      return json({ error: "You've hit Stats Tracker Pro's rate limit. Please wait a bit and try again." }, { status: 429 })
    }
    return json({ error: 'Stats Tracker Pro returned an unexpected response.' }, { status: 502 })
  }

  if (body.status !== 'success') {
    // Upstream has answered 200 with {"status":"error"}; passing that status
    // through made the client's !response.ok check miss it and blow up on
    // the missing data. Keep a real error status, otherwise call it a 502.
    return json({ error: body.message || 'Could not fetch your Stats Tracker Pro data.' }, { status: response.status >= 400 ? response.status : 502 })
  }

  return json({
    data: body.data,
    agentName: body.meta?.agent_name ?? null,
    callsRemainingThisMinute: body.meta?.calls_remaining_this_minute ?? null,
    callsRemainingThisHour: body.meta?.calls_remaining_this_hour ?? null
  })
}
