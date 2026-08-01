// Coordinate parsing for the location heatmap. Kept generic (not tied to any one file's
// column names) since more location-bearing files than the two the catalog currently wires
// up (see catalog.js `locationColumns`) are expected to reuse this later.

const LAT_RANGE = 90
const LNG_RANGE = 180
const E6_FACTOR = 1e6

function inRange (lat, lng) {
  return Math.abs(lat) <= LAT_RANGE && Math.abs(lng) <= LNG_RANGE
}

// Real Niantic exports have been observed to mix plain decimal degrees with E6-encoded
// integers (degrees * 1e6) row-to-row within the same file, not just file-to-file - so this
// has to be a per-pair judgment call, not a fixed file-wide format assumption. `(0, 0)` is
// treated as a "no location recorded" sentinel rather than genuine Null Island coordinates,
// since that's overwhelmingly what it means in this kind of gameplay telemetry.
export function parseCoordinatePair (rawLat, rawLng) {
  const lat = parseFloat(rawLat)
  const lng = parseFloat(rawLng)
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null
  if (lat === 0 && lng === 0) return null

  if (inRange(lat, lng)) return { lat, lng }

  const e6Lat = lat / E6_FACTOR
  const e6Lng = lng / E6_FACTOR
  if (inRange(e6Lat, e6Lng)) return { lat: e6Lat, lng: e6Lng }

  return null
}
