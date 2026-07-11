const ACRONYMS = new Set(['XM', 'AP', 'CMU', 'OPR', 'POI', 'GPS', 'UTC'])

// Fallback label for the ~120 export files with no explicit catalog entry.
// "xm_collected.tsv" -> "XM Collected", "portalGuidsVisited.csv" -> "Portal Guids Visited"
export function humanizeFilename (filename) {
  const base = filename.replace(/\.[^.]+$/, '')
  const words = base
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  return words
    .map(word => {
      const upper = word.toUpperCase()
      if (ACRONYMS.has(upper)) return upper
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}
