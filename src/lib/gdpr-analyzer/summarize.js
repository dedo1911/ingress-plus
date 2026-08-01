import { classifyByName, getMatchedKey } from './detect.js'
import { parseHeaderAndRows } from './delimited.js'
import { parseTimestamp, findTimeColumnIndex } from './dates.js'
import { humanizeFilename } from './humanize.js'
import { ANALYZERS } from './analyzers/index.js'

// Every tabular catalog entry (exact, prefix, or pattern match - see catalog.js) already
// carries its own label/description, so this is mostly row counting + date range; entries that
// match one or more analyzers (see analyzers/index.js) additionally get that analyzer's named
// result field (e.g. `heatGroups`, `purchaseSummary`) merged in, computed in this same single
// pass over the rows rather than a second walk over the file.
function summarizeTabular (text, classification, fallbackLabel) {
  const { headers, rows } = parseHeaderAndRows(text, classification.delimiter)
  const warnings = []
  const timeIndex = findTimeColumnIndex(headers, classification.timeColumn)
  const label = classification.label ?? fallbackLabel

  const accumulators = ANALYZERS
    .filter(analyzer => analyzer.appliesTo(classification))
    .map(analyzer => analyzer.createAccumulator(classification, headers))

  let count = 0
  let start = null
  let end = null
  for (const row of rows) {
    count++

    if (timeIndex !== -1) {
      const date = parseTimestamp(row[timeIndex])
      if (date) {
        if (!start || date < start) start = date
        if (!end || date > end) end = date
      }
    }

    for (const accumulator of accumulators) {
      accumulator.addRow(row)
    }
  }

  if (timeIndex === -1) {
    warnings.push('No date/time column found - date range unavailable.')
  }

  const analyzerResults = accumulators.reduce((merged, accumulator) => ({ ...merged, ...accumulator.finalize() }), {})

  return {
    label,
    description: classification.description ?? null,
    count,
    countLabel: 'rows',
    dateRange: start && end ? { start, end } : null,
    warnings,
    ...analyzerResults
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

// Top-level dispatcher used by the page. Deliberately does NOT catch its own errors - unlike an
// earlier version of this function, which swallowed parse/analyzer failures into a `warnings`
// field that's only ever rendered for files with an active-analysis table row. A file that
// fails partway through gets neither a row (hasActiveAnalysis would be false) nor a visible
// warning, so the failure went silently missing from the UI while still logging to console -
// exactly the "something broke, no visible error" report this was changed to fix. Letting the
// rejection propagate instead means drainQueue's own per-file try/catch (+page.svelte) handles
// it: a visible error row for this file, console logging, and - since drainQueue re-queries for
// the next pending item rather than iterating a fixed list - every other queued file still gets
// processed normally regardless of this one's failure.
export async function summarizeFile (file) {
  const fallbackLabel = humanizeFilename(file.name)
  const classification = classifyByName(file.name)

  const base = {
    fileName: file.name,
    sizeBytes: file.size,
    matchedKey: getMatchedKey(file.name),
    matchedBy: classification.matchedBy,
    shape: classification.shape,
    privacyFlags: classification.privacy ?? []
  }

  // A file is only ever read past its filename if some analyzer in analyzers/index.js actually
  // applies to it - nothing computed from content (row count, date range, ...) is shown for
  // anything else anymore (see the aggregate-count UI in +page.svelte), so recognized files with
  // no matching analyzer skip `file.text()` entirely.
  const willAnalyze = classification.shape === 'tabular' && ANALYZERS.some(analyzer => analyzer.appliesTo(classification))
  if (classification.shape !== 'rejected' && !willAnalyze) {
    return {
      ...base,
      label: classification.label ?? fallbackLabel,
      description: classification.description ?? null,
      count: null,
      countLabel: '',
      dateRange: null,
      warnings: [],
      hasActiveAnalysis: false
    }
  }

  const result = willAnalyze ? summarizeTabular(await file.text(), classification, fallbackLabel) : summarizeRejected()
  return { ...base, ...result, hasActiveAnalysis: willAnalyze }
}
