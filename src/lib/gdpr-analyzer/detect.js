import { lookupKnownFile } from './catalog.js'

// Delimiter (and, for CSV, the default time column) purely from file extension -
// independent of the catalog match itself, since these are container-format concerns,
// not content-semantics ones. Every catalog entry (exact, prefix, or pattern match) now
// carries its own shape/label/description, so this is just filling in the one or two
// things that vary by extension rather than by file.
const EXTENSION_DEFAULTS = {
  tsv: { delimiter: '\t' },
  csv: { delimiter: ',', timeColumn: 'Timestamp' }
}

function getExtension (filename) {
  const match = filename.match(/\.([^.]+)$/)
  return match ? match[1].toLowerCase() : ''
}

// Filename/extension only, no file I/O. Every file recognized by the catalog (see
// catalog.js) already carries its own label/description - there's no more generic
// "best effort" bucket. A filename the catalog doesn't recognize at all is rejected
// outright, so this always returns a usable classification, never null.
export function classifyByName (filename) {
  const known = lookupKnownFile(filename)
  if (!known) return { shape: 'rejected', matchedBy: 'unrecognized' }

  const extDefaults = EXTENSION_DEFAULTS[getExtension(filename)] ?? null
  return { ...extDefaults, ...known }
}
