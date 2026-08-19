// Columns that describe the agent/export itself rather than progress towards
// a badge - shown separately from the stat lines that get matched to badges.
export const PLAYER_INFO_FIELDS = [
  'Time Span',
  'Agent Name',
  'Agent Faction',
  'Date (yyyy-mm-dd)',
  'Time (hh:mm:ss)',
  'Level',
  'Lifetime AP',
  'Current AP'
]

// Only an "ALL TIME" export reflects an agent's full progress - MONTHLY,
// WEEKLY and NOW exports only cover a slice of it and can't be trusted to
// mark badges from.
const REQUIRED_TIME_SPAN = 'ALL TIME'

// Parses the plain-text stat export a player copies out of the game: a
// tab-separated header row naming each stat, followed by a tab-separated
// row of values in the same column order. Which stat lines are present
// varies between exports - a line only shows up once the player has made
// progress towards it, and new events can introduce new lines - so the
// columns are read dynamically rather than assumed. Matching stats to
// badges/tiers isn't implemented yet.
export function parseTextExport (rawText) {
  const lines = rawText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)

  const [headerLine, valueLine] = lines
  if (!headerLine || !valueLine) {
    return { error: 'Couldn\'t find any stats in that paste. Make sure you copied the full export, including the header row.' }
  }

  const headers = headerLine.split('\t')
  const values = valueLine.split('\t')

  const entries = headers
    .map((stat, i) => ({ stat: stat.trim(), value: (values[i] ?? '').trim() }))
    .filter(({ stat }) => stat !== '')

  if (entries.length === 0) {
    return { error: 'Couldn\'t find any stats in that paste. Make sure you copied the full export, including the header row.' }
  }

  const timeSpan = entries.find(({ stat }) => stat === 'Time Span')?.value
  if (timeSpan && timeSpan.toUpperCase() !== REQUIRED_TIME_SPAN) {
    return { error: `This export covers "${timeSpan}", not ALL TIME. Please export a new ALL TIME stats paste from the game and try again.` }
  }

  const playerInfoFields = new Set(PLAYER_INFO_FIELDS)
  const playerInfo = entries.filter(({ stat }) => playerInfoFields.has(stat))
  const stats = entries.filter(({ stat }) => !playerInfoFields.has(stat))

  return { playerInfo, stats }
}
