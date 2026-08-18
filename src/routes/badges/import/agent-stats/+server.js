import { json } from '@sveltejs/kit'

const AGENT_STATS_BASE = 'https://api.agent-stats.com'

// Agent Stats doesn't send CORS headers, so this can't be called directly
// from the browser - it has to be proxied through our own server. It also
// returns HTTP 200 with a plain-text "access denied" body for a missing or
// invalid key instead of a real error status, so that has to be detected
// by trying to parse the response as JSON rather than checking res.ok.
export async function POST ({ request, fetch }) {
  const { apiKey } = await request.json()
  if (!apiKey || typeof apiKey !== 'string') {
    return json({ error: 'Missing API key.' }, { status: 400 })
  }

  const headers = { 'AS-Key': apiKey }

  let medalsRes, progressRes
  try {
    [medalsRes, progressRes] = await Promise.all([
      fetch(`${AGENT_STATS_BASE}/medals`, { headers }),
      fetch(`${AGENT_STATS_BASE}/progress`, { headers })
    ])
  } catch (err) {
    console.error(err)
    return json({ error: 'Could not reach Agent Stats. Please try again later.' }, { status: 502 })
  }

  const [medalsText, progressText] = await Promise.all([medalsRes.text(), progressRes.text()])

  let medals, progress
  try {
    medals = JSON.parse(medalsText)
    progress = JSON.parse(progressText)
  } catch {
    return json({ error: 'Invalid Agent Stats API key.' }, { status: 401 })
  }

  return json({ medals, progress })
}
