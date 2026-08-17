// Not real stats - metadata about the upload itself, or (in the case of
// "5time_span") a malformed key the API occasionally sends.
const PLAYER_INFO_KEYS = new Set(['stat_date', 'stat_time', 'level', 'current_ap', 'lifetime_ap', 'created_at'])

// The /uploads endpoint is a date-range query, and its ordering wasn't
// possible to confirm empirically (the test account only ever had one
// upload) - so rather than trust array order, this always picks the entry
// with the latest created_at explicitly.
function pickLatest (entries) {
  return entries.reduce((latest, entry) => {
    if (!latest) return entry
    return new Date(entry.created_at) > new Date(latest.created_at) ? entry : latest
  }, null)
}

// Turns our proxy's response ({data, agentName, callsRemainingThisMinute,
// callsRemainingThisHour}) into the same {playerInfo, stats} shape
// parseTextExport/buildAgentStatsResult/buildTheGridResult produce.
// statKeyLabels maps Stats Tracker Pro's snake_case keys to the human-
// readable stat_line labels used elsewhere - sourced from the statMatching
// PocketBase collection (serviceName "stats-tracker-pro"), same reasoning
// as The Grid: a newly added stat line can be mapped without a code
// deployment.
export function buildStatsTrackerProResult ({ data, agentName, callsRemainingThisMinute, callsRemainingThisHour }, statKeyLabels) {
  const entry = pickLatest(data)
  if (!entry) {
    throw new Error(
      'No visible stat upload found for this account on Stats Tracker Pro from the last 30 days. ' +
      'Upload your stats there first, then try again - if you recently uploaded and this still ' +
      'shows, check whether that upload is marked hidden.'
    )
  }

  const playerInfo = []
  if (agentName) playerInfo.push({ stat: 'Agent Name', value: agentName })
  playerInfo.push(
    { stat: 'Level', value: String(entry.level ?? '') },
    { stat: 'Current AP', value: String(entry.current_ap ?? 0) },
    { stat: 'Lifetime AP', value: String(entry.lifetime_ap ?? 0) },
    { stat: 'Last Updated', value: entry.created_at }
  )
  // So the agent can see at a glance if they're close to being rate
  // limited (100/minute, 600/hour per the docs).
  if (callsRemainingThisMinute != null) playerInfo.push({ stat: 'Calls Remaining This Minute', value: `${callsRemainingThisMinute} / 100` })
  if (callsRemainingThisHour != null) playerInfo.push({ stat: 'Calls Remaining This Hour', value: `${callsRemainingThisHour} / 600` })

  const matchableStats = Object.entries(entry)
    .filter(([key]) => !PLAYER_INFO_KEYS.has(key) && statKeyLabels?.[key])
    .map(([key, value]) => ({ stat: statKeyLabels[key], value: String(value) }))

  return { playerInfo, stats: matchableStats }
}

// Calls our own server-side proxy (stats-tracker-pro/+server.js) rather
// than Stats Tracker Pro directly - see that file for why.
export async function fetchStatsTrackerProStats (apiKey, statKeyLabels) {
  const response = await fetch('/badges/import/stats-tracker-pro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey })
  })
  const body = await response.json()
  if (!response.ok) throw new Error(body.error || 'Could not fetch your Stats Tracker Pro data.')
  return buildStatsTrackerProResult(body, statKeyLabels)
}
