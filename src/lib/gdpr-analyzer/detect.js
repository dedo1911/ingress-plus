import { lookupKnownFile, isRecognizedFilename } from './catalog.js'

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

// Filename/extension only, no file I/O. A file whose name isn't recognized at all (per
// catalog.js's isRecognizedFilename allowlist) is rejected outright - there's no
// content-sniffing fallback, so this always returns a usable classification, never null.
export function classifyByName (filename) {
  if (!isRecognizedFilename(filename)) {
    return { shape: 'rejected', matchedBy: 'unrecognized' }
  }

  const extDefaults = EXTENSION_DEFAULTS[getExtension(filename)] ?? null
  const known = lookupKnownFile(filename)

  if (known) return { ...extDefaults, ...known }
  // Recognized by the allowlist but an extension we have no defaults for - shouldn't
  // happen given the allowlist only contains .tsv/.csv/.txt/.json/.zip names, but treat
  // it the same as an unrecognized file rather than guessing.
  if (!extDefaults) return { shape: 'rejected', matchedBy: 'unrecognized' }

  return { ...extDefaults, matchedBy: 'filename-generic' }
}
