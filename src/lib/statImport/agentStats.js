// Agent Stats doesn't expose the agent's name or faction anywhere in its
// API - only level and AP can be derived, from the "ap" medal's total and
// its reached "level N" thresholds. Both are handled separately from the
// rest of the medals below rather than treated as regular stat lines.
const PLAYER_INFO_MEDAL_KEYS = new Set(['ap', 'lifetime_ap'])

function deriveLevel (apMedal) {
  let level = 1
  for (const [key, reached] of Object.entries(apMedal?.date ?? {})) {
    if (reached !== 1) continue
    const n = Number(key.replace('level ', ''))
    if (!Number.isNaN(n) && n > level) level = n
  }
  return level
}

// Turns the /medals + /progress payloads from the Agent Stats API into the
// same {playerInfo, stats} shape parseTextExport produces, so the rest of
// the import pipeline (matching, tier resolution, preview, import) stays
// identical regardless of which source the stats came from.
export function buildAgentStatsResult (medals, progress) {
  // An account that has never uploaded still returns the full medal
  // structure with every value zeroed out rather than an empty/error
  // response - last_submit is the actual signal that nothing has been
  // uploaded yet.
  if (!progress.last_submit) {
    throw new Error('No stat upload found for this account on Agent Stats. Upload your stats there first, then try again.')
  }

  const playerInfo = [
    { stat: 'Level', value: String(deriveLevel(progress.mymedals.ap)) },
    { stat: 'Current AP', value: String(progress.mymedals.ap?.progression?.total ?? 0) },
    { stat: 'Lifetime AP', value: String(progress.mymedals.lifetime_ap?.progression?.total ?? 0) },
    { stat: 'Last Synced', value: progress.last_submit }
  ]

  const stats = Object.entries(medals)
    .filter(([key, medal]) => !PLAYER_INFO_MEDAL_KEYS.has(key) && medal.hide !== 1 && progress.mymedals[key])
    .map(([key, medal]) => ({
      stat: medal.label,
      value: String(progress.mymedals[key].progression.total)
    }))

  return { playerInfo, stats }
}

// Calls our own server-side proxy (agent-stats/+server.js) rather than the
// Agent Stats API directly - see that file for why.
export async function fetchAgentStats (apiKey) {
  const response = await fetch('/badges/import/agent-stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey })
  })
  const body = await response.json()
  if (!response.ok) throw new Error(body.error || 'Could not fetch your Agent Stats data.')
  return buildAgentStatsResult(body.medals, body.progress)
}
