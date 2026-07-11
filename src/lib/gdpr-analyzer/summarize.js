import { classifyByName } from './detect.js'
import { parseHeaderAndRows } from './delimited.js'
import { parseTimestamp, findTimeColumnIndex } from './dates.js'
import { humanizeFilename } from './humanize.js'
import { normalizeFilename } from './catalog.js'

const WAYFARER_ARRAY_KEYS = ['OprSubmissionLog', 'OprAssignmentLog', 'OprSkippedLog', 'OprUpgradeLog']

// Every tabular catalog entry (exact, prefix, or pattern match - see catalog.js) already
// carries its own label/description, so this is just row counting + date range now;
// no more runtime header-shape sniffing to generate a description on the fly.
function summarizeTabular (text, classification, fallbackLabel) {
  const { headers, rows } = parseHeaderAndRows(text, classification.delimiter)
  const warnings = []
  const timeIndex = findTimeColumnIndex(headers, classification.timeColumn)

  let count = 0
  let start = null
  let end = null
  for (const row of rows) {
    count++
    if (timeIndex === -1) continue
    const date = parseTimestamp(row[timeIndex])
    if (!date) continue
    if (!start || date < start) start = date
    if (!end || date > end) end = date
  }

  if (timeIndex === -1) {
    warnings.push('No date/time column found - date range unavailable.')
  }

  return {
    label: classification.label ?? fallbackLabel,
    description: classification.description ?? null,
    count,
    countLabel: 'rows',
    dateRange: start && end ? { start, end } : null,
    warnings
  }
}

function summarizeTextDoc (text, classification, fallbackLabel) {
  const count = text.split('\n').filter(line => line.trim() !== '').length
  return {
    label: classification.label ?? fallbackLabel,
    description: classification.description ?? 'A plain-text document.',
    count,
    countLabel: 'lines',
    dateRange: null,
    warnings: []
  }
}

function summarizeEmpty (classification, fallbackLabel) {
  return {
    label: classification.label ?? fallbackLabel,
    description: classification.description ?? 'This file is empty.',
    count: 0,
    countLabel: '',
    dateRange: null,
    warnings: []
  }
}

function summarizeWayfarerJson (text, classification, fallbackLabel) {
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    return {
      label: classification.label ?? fallbackLabel,
      description: classification.description ?? null,
      count: null,
      countLabel: '',
      dateRange: null,
      warnings: ['Could not parse this file as JSON.']
    }
  }

  const root = Array.isArray(parsed) ? parsed[0] : parsed
  let count = 0
  for (const key of WAYFARER_ARRAY_KEYS) {
    if (Array.isArray(root?.[key])) count += root[key].length
  }

  // Only OprSubmissionLog entries carry a per-record "Time" field worth a date range -
  // the other keys just contribute to the count.
  let start = null
  let end = null
  const submissions = Array.isArray(root?.OprSubmissionLog) ? root.OprSubmissionLog : []
  for (const entry of submissions) {
    const date = parseTimestamp(entry?.Time)
    if (!date) continue
    if (!start || date < start) start = date
    if (!end || date > end) end = date
  }

  return {
    label: classification.label ?? fallbackLabel,
    description: classification.description ?? null,
    count,
    countLabel: 'records',
    dateRange: start && end ? { start, end } : null,
    warnings: []
  }
}

function summarizeUnsupported (classification, fallbackLabel) {
  return {
    label: classification.label ?? fallbackLabel,
    description: classification.description ?? 'A zip archive - not analyzed here.',
    count: null,
    countLabel: '',
    dateRange: null,
    warnings: []
  }
}

// Used both for filenames rejected outright by the catalog and as a defensive fallback
// for any classification shape this dispatcher doesn't otherwise handle -
// classifyByName() is a closed function under our control, so the latter shouldn't
// happen in practice, but degrading to the same rejection message is safer than
// silently mis-describing a file.
function summarizeRejected () {
  return {
    label: null,
    description: 'This file does not seem to come from an Ingress GDPR export. If it does, please let us know.',
    count: null,
    countLabel: '',
    dateRange: null,
    warnings: []
  }
}

// Top-level dispatcher used by the page. Never throws - unexpected content degrades to
// a warning-only summary rather than crashing the whole batch of dropped-in files.
export async function summarizeFile (file) {
  const fallbackLabel = humanizeFilename(file.name)
  const classification = classifyByName(file.name)

  const matchedKey = (classification.matchedBy === 'filename' || classification.matchedBy === 'filename-prefix')
    ? normalizeFilename(file.name)
    : null

  const base = {
    fileName: file.name,
    sizeBytes: file.size,
    matchedKey,
    matchedBy: classification.matchedBy,
    shape: classification.shape,
    privacyFlags: classification.privacy ?? []
  }

  try {
    switch (classification.shape) {
      case 'tabular':
        return { ...base, ...summarizeTabular(await file.text(), classification, fallbackLabel) }
      case 'text-doc':
        return { ...base, ...summarizeTextDoc(await file.text(), classification, fallbackLabel) }
      case 'empty':
        return { ...base, ...summarizeEmpty(classification, fallbackLabel) }
      case 'json-wayfarer':
        return { ...base, ...summarizeWayfarerJson(await file.text(), classification, fallbackLabel) }
      case 'zip-redundant':
        return { ...base, ...summarizeUnsupported(classification, fallbackLabel) }
      case 'rejected':
      default:
        return { ...base, ...summarizeRejected() }
    }
  } catch (err) {
    console.error(err)
    return {
      ...base,
      label: fallbackLabel,
      description: null,
      count: null,
      countLabel: '',
      dateRange: null,
      warnings: ['Something went wrong while reading this file.']
    }
  }
}
