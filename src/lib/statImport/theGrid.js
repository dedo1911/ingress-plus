// Handled separately as player info rather than regular stat lines.
const PLAYER_INFO_KEYS = new Set(['ap', 'lifetime_ap'])

// Turns a single export record ({id, timestamp, stats}) into the same
// {playerInfo, stats} shape parseTextExport/buildAgentStatsResult produce.
// The Grid doesn't expose the agent's name or faction anywhere in this
// response either - only AP/level-adjacent totals and the record's
// timestamp are available.
//
// statKeyLabels maps The Grid's snake_case stat keys to the human-readable
// stat_line labels used elsewhere - sourced from the statMatching
// PocketBase collection (serviceName "the-grid") rather than hardcoded
// here, since Niantic adds new stat lines periodically and a new key can
// then be mapped without a code deployment. A key that's missing from the
// map, or mapped to a falsy value (not yet confirmed), is left out
// entirely rather than shown under an unreadable raw key.
export function buildTheGridResult (record, statKeyLabels) {
  const { stats, timestamp } = record

  const playerInfo = [
    { stat: 'Current AP', value: String(stats.ap ?? 0) },
    { stat: 'Lifetime AP', value: String(stats.lifetime_ap ?? 0) }
  ]
  if (timestamp) {
    const updated = new Date(timestamp * 1000).toISOString().slice(0, 19).replace('T', ' ')
    playerInfo.push({ stat: 'Last Updated', value: updated })
  }

  const matchableStats = Object.entries(stats)
    .filter(([key]) => !PLAYER_INFO_KEYS.has(key) && statKeyLabels?.[key])
    .map(([key, value]) => ({ stat: statKeyLabels[key], value: String(value) }))

  return { playerInfo, stats: matchableStats }
}

// The Grid sends proper CORS headers, so this can be called directly from
// the browser, unlike Agent Stats. It has its own error quirks though: an
// invalid key returns the literal JSON value `null` (HTTP 200), and no key
// at all returns an empty body (HTTP 200) - neither is a real error status.
export async function fetchTheGridStats (apiKey, statKeyLabels) {
  const response = await fetch(`https://the-grid.org/r/export/?key=${encodeURIComponent(apiKey)}`)
  const text = await response.text()

  let record = null
  if (text) {
    try {
      record = JSON.parse(text)
    } catch {
      record = null
    }
  }

  if (!record) throw new Error('Invalid Grid API key.')

  return buildTheGridResult(record, statKeyLabels)
}
