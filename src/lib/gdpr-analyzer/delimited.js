// A small RFC4180-ish, quote-aware delimited-text parser. Needed because some export
// files (e.g. SupportInteractions*.tsv's ticket transcripts) plausibly contain embedded
// newlines/delimiters inside a quoted field - a naive `line.split(delimiter)` would
// silently corrupt those rows. Implemented as a generator so it streams rows lazily
// instead of materializing the whole file (matters for game_log.tsv at 661k+ rows).
export function * iterateRows (text, delimiter = '\t') {
  let field = ''
  let row = []
  let inQuotes = false
  let i = 0
  const len = text.length

  while (i < len) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      field += char
      i++
      continue
    }

    // A quote only opens quoting mode at the very start of a field (RFC4180) -
    // anywhere else it's treated as a literal character.
    if (char === '"' && field === '') {
      inQuotes = true
      i++
      continue
    }

    if (char === delimiter) {
      row.push(field)
      field = ''
      i++
      continue
    }

    if (char === '\r') {
      i++
      continue
    }

    if (char === '\n') {
      row.push(field)
      yield row
      row = []
      field = ''
      i++
      continue
    }

    field += char
    i++
  }

  if (field !== '' || row.length > 0) {
    row.push(field)
    yield row
  }
}

// Splits off the header row eagerly; `rows` is the same (now-advanced) generator, so
// the caller can iterate the remaining rows lazily without re-parsing the header.
export function parseHeaderAndRows (text, delimiter = '\t') {
  const iterator = iterateRows(text, delimiter)
  const first = iterator.next()
  const headers = first.done ? [] : first.value
  return { headers, rows: iterator }
}
