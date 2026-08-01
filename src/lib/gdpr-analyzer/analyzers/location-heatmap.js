import { parseCoordinatePair } from '../coordinates.js'

// Coordinates are bucketed into a coarse grid (rather than kept as one point per row) so the
// heat layer stays smooth and memory stays bounded by distinct-location count rather than row
// count, regardless of how large the source file is.
const GRID_PRECISION = 3

export function appliesTo (classification) {
  return classification.shape === 'tabular' && Boolean(classification.locationColumns)
}

// `locationColumns` is only ever set on catalog entries that also set an explicit `label` (see
// catalog.js), so there's no fallback-label case to handle here the way summarize.js's dispatcher
// needs to for the generic count/date-range path.
export function createAccumulator (classification, headers) {
  const { locationColumns, label } = classification
  const latIndex = headers.indexOf(locationColumns.lat)
  const lngIndex = headers.indexOf(locationColumns.lng)
  const groupIndex = locationColumns.groupBy ? headers.indexOf(locationColumns.groupBy) : -1
  const grid = new Map()

  return {
    addRow (row) {
      if (latIndex === -1 || lngIndex === -1) return
      const point = parseCoordinatePair(row[latIndex], row[lngIndex])
      if (!point) return

      const groupKey = groupIndex !== -1 ? row[groupIndex] : label
      const cellKey = `${point.lat.toFixed(GRID_PRECISION)},${point.lng.toFixed(GRID_PRECISION)}`
      let cells = grid.get(groupKey)
      if (!cells) {
        cells = new Map()
        grid.set(groupKey, cells)
      }
      cells.set(cellKey, (cells.get(cellKey) ?? 0) + 1)
    },
    // Converts the { groupKey -> { cellKey -> weight } } accumulator into the [lat, lng, weight]
    // tuples leaflet.heat consumes directly.
    finalize () {
      const heatGroups = {}
      for (const [groupKey, cells] of grid) {
        heatGroups[groupKey] = Array.from(cells, ([cellKey, weight]) => {
          const [lat, lng] = cellKey.split(',').map(Number)
          return [lat, lng, weight]
        })
      }
      return { heatGroups }
    }
  }
}
