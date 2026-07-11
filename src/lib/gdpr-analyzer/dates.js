// Every timestamp format confirmed across a real Niantic GDPR export. Uses explicit
// regexes + Date.UTC() rather than `new Date(str)`, since browsers disagree on parsing
// space-separated / non-standard date strings.
const PATTERNS = [
  // YYYY-MM-DD HH:MM:SS(.mmm)? [UTC|GMT|Z]?  (space or "T" separator, optional ms, optional
  // trailing timezone token). Covers: "2021-02-09 17:17:15 UTC", ISO "...T...Z",
  // "...T....123Z", "YYYY-MM-DD HH:MM:SS.mmm UTC", "...GMT", and bare ISO with no suffix.
  {
    regex: /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?\s*(?:UTC|GMT|Z)?$/,
    build: m => Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6], m[7] ? +m[7].padEnd(3, '0') : 0)
  },
  // MM/DD/YYYY HH:MM:SS [UTC]?  ("01/09/2022 17:20:20 UTC" in Logins.tsv,
  // "12/21/2024 15:23:38" with no timezone suffix in the poi_*_submissions files)
  {
    regex: /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})\s*(?:UTC)?$/,
    build: m => Date.UTC(+m[3], +m[1] - 1, +m[2], +m[4], +m[5], +m[6])
  }
]

// Any string with no recognizable/explicit timezone marker is treated as UTC, for
// consistency with the rest of the export - not independently verified against
// Niantic's own convention, but reasonable for a summary tool.
export function parseTimestamp (raw) {
  if (!raw) return null
  const trimmed = String(raw).trim()
  for (const { regex, build } of PATTERNS) {
    const match = trimmed.match(regex)
    if (!match) continue
    const ms = build(match)
    return Number.isNaN(ms) ? null : new Date(ms)
  }
  return null
}

// Resolves which column holds a row's timestamp: an explicit override if given, else the
// first header that looks date/time-ish. Returns -1 if nothing matches either way.
export function findTimeColumnIndex (headers, explicitColumnName) {
  if (explicitColumnName) return headers.indexOf(explicitColumnName)
  return headers.findIndex(h => /time|date/i.test(h))
}
