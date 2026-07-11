import { lookupKnownFile } from './catalog.js'

// Delimiter/shape defaults purely from file extension - independent of whether the
// filename is also a catalog match, since the delimiter is a container-format concern,
// not a content-semantics one.
const EXTENSION_DEFAULTS = {
  tsv: { delimiter: '\t', shape: 'generic-tabular' },
  csv: { delimiter: ',', shape: 'generic-tabular', timeColumn: 'Timestamp' },
  txt: { shape: 'text-doc' },
  json: { shape: 'json-generic' },
  zip: { shape: 'zip-unsupported' }
}

function getExtension (filename) {
  const match = filename.match(/\.([^.]+)$/)
  return match ? match[1].toLowerCase() : ''
}

// Tier 1: filename/extension only, no file I/O. Returns a catalog match merged with its
// extension's delimiter, a generic-by-extension routing decision, or null if the
// extension itself is unrecognized (caller should fall back to sniffContent()).
export function classifyByName (filename) {
  const extDefaults = EXTENSION_DEFAULTS[getExtension(filename)] ?? null
  const known = lookupKnownFile(filename)

  if (known) return { ...extDefaults, ...known }
  if (!extDefaults) return null

  return { ...extDefaults, matchedBy: 'filename-generic' }
}

// Tier 2: only called when classifyByName() returns null (renamed/unknown-extension
// files). Reads a small sample and sniffs the shape from content instead of the name.
export async function sniffContent (file) {
  if (file.size === 0) {
    return { shape: 'empty', matchedBy: 'content-sniff' }
  }

  const sample = await file.slice(0, 4096).text()
  const trimmed = sample.trimStart()

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return { shape: 'json-generic', matchedBy: 'content-sniff' }
  }

  const firstLine = sample.split('\n')[0] ?? ''
  if (firstLine.includes('\t')) {
    return { delimiter: '\t', shape: 'generic-tabular', matchedBy: 'content-sniff' }
  }
  if (firstLine.includes(',')) {
    return { delimiter: ',', shape: 'generic-tabular', timeColumn: 'Timestamp', matchedBy: 'content-sniff' }
  }
  // profile.txt-style documents are indented "Label: value" lines.
  if (/^\s*[A-Za-z][A-Za-z0-9 ]*:/.test(firstLine)) {
    return { shape: 'text-doc', matchedBy: 'content-sniff' }
  }

  return { shape: 'unrecognized', matchedBy: 'unrecognized' }
}
