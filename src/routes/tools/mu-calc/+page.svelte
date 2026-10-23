<script>
  import { onMount } from 'svelte'
  import { resolve } from '$app/paths'
  import 'leaflet/dist/leaflet.css'
  import { authData } from '$lib/stores'

  let mapElement
  let map
  let L
  let drawnLayers
  let searchMarker
  let fields = $state([])
  let drawing = $state(false)
  let draftCoordinates = $state([])
  let calculating = $state(false)
  let error = $state('')
  let results = $state([])

  // Teal by default so the calculator doesn't favour ENL green or RES blue; a signed-in
  // agent with a faction set gets their own colour. 'unaligned' is the profile default,
  // not a choice, so it stays teal too.
  const NEUTRAL_COLOR = '#14b8a6'
  const faction = $derived($authData?.baseModel?.faction)
  const factionVar = $derived(['enlightened', 'resistance', 'machina'].includes(faction) ? `--color-faction-${faction}` : null)
  // Leaflet writes colours into SVG attributes, where var() doesn't resolve, so read the
  // computed value (client only: syncMap never runs during SSR).
  const fieldColor = () => (factionVar && window.getComputedStyle(document.documentElement).getPropertyValue(factionVar).trim()) || NEUTRAL_COLOR

  const totalMu = $derived(results.reduce((total, result) => total + result.mu, 0))
  const formatMu = value => Number(value).toLocaleString()

  function addField (coordinates = [['', ''], ['', ''], ['', '']]) {
    if (fields.length >= 50) return
    fields = [...fields, { name: '', coordinates }]
    results = []
  }

  function removeField (index) {
    fields = fields.filter((_, i) => i !== index)
    results = []
  }

  function updateCoordinate (fieldIndex, pointIndex, axis, value) {
    const next = fields.map(field => ({ ...field, coordinates: field.coordinates.map(point => [...point]) }))
    next[fieldIndex].coordinates[pointIndex][axis] = value
    fields = next
    results = []
  }

  // The world repeats horizontally, so everything is drawn once per world copy.
  // worldCopyJump keeps the map centred on the middle copy, so three are enough.
  const WORLD_OFFSETS = [-360, 0, 360]
  const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
  const shift = (points, offset) => points.map(([lat, lon]) => [lat, lon + offset])

  const MERCATOR_MAX_LAT = 85.0511
  // Great-circle path through the points: links on a globe are arcs, not straight
  // lines on the Mercator map. Longitudes are unwrapped so an arc crossing the
  // antimeridian continues past ±180 instead of flying back across the map.
  function geodesicPath (points, closed = false) {
    if (points.length < 2) return points
    const rad = Math.PI / 180
    const toVector = ([lat, lon]) => [Math.cos(lat * rad) * Math.cos(lon * rad), Math.cos(lat * rad) * Math.sin(lon * rad), Math.sin(lat * rad)]
    const path = []
    for (let i = 0; i < (closed ? points.length : points.length - 1); i++) {
      const a = toVector(points[i])
      const b = toVector(points[(i + 1) % points.length])
      const d = Math.acos(Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])))
      // Identical or antipodal points have no unique arc; draw them straight.
      const straight = d < 1e-6 || Math.PI - d < 1e-6
      const steps = straight ? 1 : 32
      for (let s = 0; s < steps; s++) { // the endpoint is the next edge's start
        const f = s / steps
        const wa = straight ? 1 : Math.sin((1 - f) * d) / Math.sin(d)
        const wb = straight ? 0 : Math.sin(f * d) / Math.sin(d)
        const [x, y, z] = [0, 1, 2].map(k => wa * a[k] + wb * b[k])
        path.push([Math.atan2(z, Math.hypot(x, y)) / rad, Math.atan2(y, x) / rad])
      }
    }
    // A copy: the unwrapping below mutates path entries, and this one would otherwise be
    // the caller's own point (draftCoordinates), saving an out-of-range longitude.
    if (!closed) path.push([...points[points.length - 1]])
    for (let i = 1; i < path.length; i++) {
      while (path[i][1] - path[i - 1][1] > 180) path[i][1] -= 360
      while (path[i][1] - path[i - 1][1] < -180) path[i][1] += 360
    }
    if (closed) {
      // Unwrap the closing step too. A triangle that encloses a pole winds a full 360° in
      // longitude, which Mercator can't close with a straight edge (it drew a rectangle
      // beside the real shape). Close it along the map's edge at the enclosed pole instead.
      let closing = path[0][1] - path[path.length - 1][1]
      while (closing > 180) closing -= 360
      while (closing < -180) closing += 360
      const winding = path[path.length - 1][1] + closing - path[0][1]
      if (Math.abs(winding) > 180) {
        // ponytail: picks the pole by the mean latitude of the outline, which is wrong only
        // for a triangle whose arcs mostly lie in the opposite hemisphere to the pole it encloses.
        const pole = path.reduce((sum, [lat]) => sum + lat, 0) < 0 ? -MERCATOR_MAX_LAT : MERCATOR_MAX_LAT
        const end = path[0][1] + Math.round(winding / 360) * 360
        path.push([path[0][0], end], [pole, end], [pole, path[0][1]])
      }
    }
    return path
  }

  function syncMap () {
    if (!drawnLayers || !L) return
    drawnLayers.clearLayers()
    const color = fieldColor()
    fields.forEach((field, fieldIndex) => {
      const coordinates = field.coordinates
        .map(point => point.map(Number))
        .filter(([lat, lon]) => Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180)
      if (!coordinates.length) return
      const outline = coordinates.length > 1 ? geodesicPath(coordinates, coordinates.length > 2) : null
      for (const offset of WORLD_OFFSETS) {
        shift(coordinates, offset).forEach((point, pointIndex) => {
          L.circleMarker(point, {
            radius: 6,
            color: '#ffffff',
            weight: 2,
            fillColor: color,
            fillOpacity: 1
          }).bindTooltip(`${field.name || `Field ${fieldIndex + 1}`} · ${pointIndex + 1}`).addTo(drawnLayers)
        })
        if (outline) {
          L.polygon(shift(outline, offset), {
            color,
            weight: 2,
            fillColor: color,
            fillOpacity: 0.18,
            // Not clickable, so the filled triangle never sits between the cursor and an anchor.
            interactive: false
          }).addTo(drawnLayers)
        }
      }
    })
    for (const offset of WORLD_OFFSETS) {
      shift(draftCoordinates, offset).forEach((point, pointIndex) => {
        L.circleMarker(point, { radius: 6, color: '#fff', fillColor: '#ffce00', fillOpacity: 1 })
          .bindTooltip(`New field · ${pointIndex + 1}`)
          .addTo(drawnLayers)
      })
      if (draftCoordinates.length > 1) {
        L.polyline(shift(geodesicPath(draftCoordinates), offset), { color: '#ffce00', dashArray: '6 6' }).addTo(drawnLayers)
      }
    }
  }

  // Takes the first two decimals found, so "46.2044, 6.1432", "46.2044 6.1432" and
  // an Intel link (".../?ll=46.2044,6.1432&z=17") all work without per-format parsing.
  // Returns [lat, lon], or null if there aren't two in-range numbers.
  function parseCoordinates (text) {
    const [lat, lon] = (text.match(/-?\d+(?:\.\d+)?/g) || []).map(Number)
    if (lat === undefined || lon === undefined || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
    return [lat, lon]
  }

  // Pasting a coordinate pair or an Intel link into either box of an anchor fills both.
  // Anything else (a single number, junk) is left to the browser's normal paste.
  function pasteCoordinates (event, fieldIndex, pointIndex) {
    const pair = parseCoordinates(event.clipboardData.getData('text'))
    if (!pair) return
    event.preventDefault()
    updateCoordinate(fieldIndex, pointIndex, 0, String(pair[0]))
    updateCoordinate(fieldIndex, pointIndex, 1, String(pair[1]))
  }

  // Returns an error message, or '' on success.
  function goToCoordinates (text) {
    const pair = parseCoordinates(text)
    if (!pair) {
      return 'Enter coordinates as "latitude, longitude", e.g. 46.2044, 6.1432 or copy an Intel link.'
    }
    const [lat, lon] = pair
    searchMarker.clearLayers()
    for (const offset of WORLD_OFFSETS) {
      // circleMarker, not L.marker: the default marker icon's image paths break under Vite.
      L.circleMarker([lat, lon + offset], { radius: 8, color: '#fff', fillColor: '#ff3b6b', fillOpacity: 1 }).addTo(searchMarker)
    }
    map.setView([lat, lon], Math.max(map.getZoom(), 16))
    return ''
  }

  function startDrawing () {
    drawing = true
    draftCoordinates = []
    error = ''
    syncMap()
  }

  function cancelDrawing () {
    drawing = false
    draftCoordinates = []
    syncMap()
  }

  // A click lands a few pixels off an anchor's centre, so reusing a portal across fields
  // would otherwise leave a slightly different coordinate. Snap to the nearest existing
  // anchor within the marker's own radius (every world copy, since the click may be on any).
  const SNAP_PIXELS = 10
  function snapToAnchor (event) {
    let best = null
    let bestDistance = SNAP_PIXELS
    for (const field of fields) {
      for (const point of field.coordinates) {
        const [lat, lon] = point.map(Number)
        if (!Number.isFinite(lat) || !Number.isFinite(lon) || point.some(value => String(value).trim() === '')) continue
        for (const offset of WORLD_OFFSETS) {
          const distance = map.latLngToContainerPoint([lat, lon + offset]).distanceTo(event.containerPoint)
          if (distance <= bestDistance) { best = [lat, lon]; bestDistance = distance }
        }
      }
    }
    return best
  }

  function handleMapClick (event) {
    if (!drawing || draftCoordinates.length >= 3) return
    const snapped = snapToAnchor(event)
    // wrap(): clicking in a repeated world copy yields longitudes beyond ±180, which the API rejects.
    const { lat, lng } = snapped ? { lat: snapped[0], lng: snapped[1] } : event.latlng.wrap()
    draftCoordinates = [...draftCoordinates, [lat, lng]]
    if (draftCoordinates.length === 3) {
      addField(draftCoordinates.map(point => point.map(value => Number(value.toFixed(6)))))
      fields = fields.map((field, index) => index === fields.length - 1 ? { ...field, name: `Field ${fields.length}` } : field)
      drawing = false
      draftCoordinates = []
    }
    syncMap()
  }

  async function calculate () {
    error = ''
    results = []
    const payload = []
    for (const [index, field] of fields.entries()) {
      if (field.coordinates.some(point => point.some(value => String(value).trim() === ''))) {
        error = `Field ${index + 1}: enter three valid latitude and longitude pairs.`
        return
      }
      const coordinates = field.coordinates.map(point => point.map(value => Number(String(value).trim())))
      if (coordinates.some(point => point.length !== 2 || point.some(value => !Number.isFinite(value))) ||
          coordinates.some(([lat, lon]) => Math.abs(lat) > 90 || Math.abs(lon) > 180)) {
        error = `Field ${index + 1}: enter three valid latitude and longitude pairs.`
        return
      }
      payload.push({ ...(field.name.trim() ? { name: field.name.trim() } : {}), coordinates })
    }
    if (!payload.length) return

    calculating = true
    try {
      const response = await fetch('/api/mu-calc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'The calculation failed. Please check the coordinates.')
      if (!Array.isArray(body) || body.length !== payload.length || body.some(result => !Number.isFinite(result.mu))) {
        throw new Error('The calculator returned an unexpected response.')
      }
      results = body
    } catch (err) {
      error = err.message || 'The calculation failed. Please try again.'
    } finally {
      calculating = false
    }
  }

  onMount(async () => {
    L = await import('leaflet')
    map = L.map(mapElement, { zoomControl: true, worldCopyJump: true }).setView([46.2044, 6.1432], 5)
    // OSM tile policy (operations.osmfoundation.org/policies/tiles): the plain
    // tile.openstreetmap.org host only - the a/b/c subdomains aren't supported -
    // visible attribution, and no cache-busting or prefetching. The browser's
    // normal HTTP cache and Referer cover the rest; the service worker never
    // touches tile requests.
    L.tileLayer(OSM_TILE_URL, {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · <a href="https://www.openstreetmap.org/fixthemap">Report a map issue</a>'
    }).addTo(map)
    drawnLayers = L.layerGroup().addTo(map)
    searchMarker = L.layerGroup().addTo(map)
    const SearchControl = L.Control.extend({
      onAdd () {
        const form = L.DomUtil.create('form', 'map-search')
        form.innerHTML = '<input type="text" placeholder="Go to coordinates…" aria-label="Search coordinates" /><button type="submit">Go</button><p role="alert"></p>'
        const input = form.querySelector('input')
        const message = form.querySelector('p')
        form.addEventListener('submit', event => {
          event.preventDefault()
          message.textContent = goToCoordinates(input.value)
        })
        // Keep typing and clicking in the box from panning/zooming the map underneath.
        form.addEventListener('keydown', event => event.stopPropagation())
        L.DomEvent.disableClickPropagation(form)
        L.DomEvent.disableScrollPropagation(form)
        return form
      }
    })
    map.addControl(new SearchControl({ position: 'topright' }))
    map.on('click', handleMapClick)
    syncMap()
    return () => map.remove()
  })

  $effect(() => {
    // Read both so the effect re-runs when either changes (syncMap also tracks the faction colour).
    if (fields && draftCoordinates) syncMap()
  })
</script>

<svelte:head>
  <title>Ingress Plus &middot; MU Calculator</title>
  <meta name="description" content="Calculate Mind Units for Ingress fields from portal coordinates or by drawing triangles on a map." />
</svelte:head>

<div class="container" style="--field-color: {factionVar ? `var(${factionVar})` : NEUTRAL_COLOR}">
  <a class="back" href={resolve('/tools')}>← Tools</a>
  <h1>MU Calculator</h1>
  <p class="intro">Calculate the Mind Units your field plan would generate. Enter three portal coordinates for each triangle or draw fields directly on the map.</p>

  <section class="map-panel" aria-label="Field drawing map">
    <div class="map-toolbar">
      <div>
        <strong>{drawing ? `Choose portal ${draftCoordinates.length + 1} of 3` : 'Draw on the map'}</strong>
        <span>{drawing ? 'Click three portal locations to create a field.' : 'Start drawing, then click three portal locations.'}</span>
      </div>
      {#if drawing}
        <button class="secondary" onclick={cancelDrawing}>Cancel</button>
      {:else}
          <button class="cta" onclick={startDrawing} disabled={fields.length >= 50}>Draw a triangle</button>
      {/if}
    </div>
    <div class="map" bind:this={mapElement}></div>
  </section>

  <section class="fields" aria-labelledby="fields-title">
    <div class="section-heading">
      <div><h2 id="fields-title">Your fields</h2><p>Coordinates use decimal degrees in latitude, longitude order. You can also paste a coordinate pair or an Intel link into any latitude or longitude box and both will be filled in.</p></div>
      <button class="secondary" onclick={() => addField()} disabled={fields.length >= 50}>＋ Add field</button>
    </div>

    {#if fields.length === 0}
      <p class="empty-fields">No fields yet. Draw a triangle on the map or add a field to enter its coordinates.</p>
    {:else}
      {#each fields as field, fieldIndex (fieldIndex)}
        <article class="field-card">
          <div class="field-heading">
            <label class="name-label">Field name <input type="text" value={field.name} placeholder={`Field ${fieldIndex + 1}`} oninput={event => { fields[fieldIndex].name = event.currentTarget.value; fields = [...fields] }} /></label>
            <button class="remove" aria-label={`Remove field ${fieldIndex + 1}`} onclick={() => removeField(fieldIndex)}>Remove</button>
          </div>
          <div class="coordinate-grid">
            {#each field.coordinates as point, pointIndex (pointIndex)}
              <div class="coordinate-row">
                <span class="point-number">{pointIndex + 1}</span>
                <label>Latitude<input type="number" step="any" min="-90" max="90" placeholder="46.2044" value={point[0]} onpaste={event => pasteCoordinates(event, fieldIndex, pointIndex)} oninput={event => updateCoordinate(fieldIndex, pointIndex, 0, event.currentTarget.value)} /></label>
                <label>Longitude<input type="number" step="any" min="-180" max="180" placeholder="6.1432" value={point[1]} onpaste={event => pasteCoordinates(event, fieldIndex, pointIndex)} oninput={event => updateCoordinate(fieldIndex, pointIndex, 1, event.currentTarget.value)} /></label>
              </div>
            {/each}
          </div>
        </article>
      {/each}
      <p class="limit-note">Up to 50 fields per calculation.</p>
    {/if}
    <button class="cta calculate" onclick={calculate} disabled={calculating || fields.length === 0}>{calculating ? 'Calculating…' : 'Calculate Mind Units'}</button>
  </section>

  {#if error}<p class="error" role="alert">{error}</p>{/if}
  {#if results.length}
    <section class="results" aria-live="polite">
      <div class="total"><span>Total Mind Units</span><strong>{formatMu(totalMu)} MU</strong></div>
      {#each results as result, index (result.id)}
        <div class="result-row"><span>{result.name || `Field ${index + 1}`}</span><strong>{formatMu(result.mu)} MU</strong></div>
      {/each}
    </section>
  {/if}
</div>

<style>
  .container { max-width: 1100px; margin: 2em auto 4em; padding: 0 1em; line-height: 1.45; }
  .back { display: inline-block; color: #c1bfdc; }
  h1 { margin: 0.5em 0; text-shadow: 0 0 10px #000; }
  .intro { max-width: 720px; margin: 0 auto 2em; text-align: center; }
  .map-panel, .field-card, .results { border: 1px solid #575371; border-radius: 12px; background: rgba(14, 11, 28, 0.82); overflow: hidden; }
  .map-toolbar, .section-heading, .field-heading, .result-row, .total { display: flex; align-items: center; justify-content: space-between; gap: 1em; }
  .map-toolbar { padding: 1em; }
  .map-toolbar div, .section-heading div { display: grid; gap: 0.25em; }
  .map-toolbar span, .section-heading p, .limit-note { color: #aaa7c9; margin: 0; }
  .map { width: 100%; height: min(55vh, 480px); min-height: 300px; background: #17162a; z-index: 0; }
  /* Dark mode: invert only the tile pane, so markers and shapes keep their colours. */
  .map :global(.leaflet-tile-pane) { filter: invert(1) hue-rotate(180deg) brightness(0.9) contrast(0.9); }
  .map :global(.leaflet-control-attribution) { background: rgba(14, 11, 28, 0.8); color: #aaa7c9; }
  .map :global(.leaflet-control-attribution a) { color: #c1bfdc; }
  .map :global(.map-search) { display: flex; flex-wrap: wrap; gap: 0.4em; width: 20em; max-width: 60vw; padding: 0.4em; border-radius: 6px; background: rgba(14, 11, 28, 0.9); border: 1px solid #575371; }
  .map :global(.map-search input) { flex: 1; min-width: 0; box-sizing: border-box; font-size: 0.95em; text-align: left; }
  .map :global(.map-search button) { border-radius: 5px; padding: 0.2em 0.8em; color: #fff; background: rgba(94, 90, 117, 0.5); border: 1px solid #77738f; }
  .map :global(.map-search p) { flex-basis: 100%; margin: 0; color: #ffb4c1; font-size: 0.85em; }
  .map :global(.map-search p:empty) { display: none; }
  .fields { margin-top: 2em; }
  .empty-fields { padding: 1em; margin: 0.75em 0; text-align: center; border: 1px dashed #575371; border-radius: 10px; color: #aaa7c9; }
  .section-heading { margin-bottom: 1em; }
  h2 { text-align: left; margin: 0; }
  .field-card { padding: 1em; margin: 0.75em 0; }
  .field-heading { margin-bottom: 0.75em; }
  .name-label { display: flex; align-items: center; gap: 0.75em; }
  .name-label input { max-width: 22em; }
  .coordinate-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.75em; }
  .coordinate-row { display: grid; grid-template-columns: 2em 1fr 1fr; align-items: end; gap: 0.5em; }
  .coordinate-row label { display: grid; gap: 0.3em; font-size: 0.85em; }
  .coordinate-row input { width: 100%; box-sizing: border-box; font-size: 1em; text-align: left; }
  /* Spinner arrows step by 1, which is meaningless for coordinates. */
  .coordinate-row input[type='number'] { appearance: textfield; -moz-appearance: textfield; }
  .coordinate-row input::-webkit-inner-spin-button, .coordinate-row input::-webkit-outer-spin-button { appearance: none; -webkit-appearance: none; margin: 0; }
  .point-number { display: grid; place-items: center; width: 1.8em; height: 1.8em; border-radius: 50%; background: var(--field-color); color: #080818; font-weight: 700; }
  button.cta, button.secondary { border-radius: 6px; padding: 0.55em 1em; font-size: 1em; color: #fff; }
  button.cta { background: linear-gradient(90deg, #323c6e, #532a76); border: 1px solid #aaa7c9; }
  button.secondary { background: rgba(94, 90, 117, 0.35); border: 1px solid #77738f; }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  .remove { color: #ffb4c1; border: 1px solid #7d4555; border-radius: 5px; padding: 0.4em 0.7em; background: transparent; }
  .limit-note { text-align: right; font-size: 0.85em; margin: 0.5em 0 1em; }
  .calculate { display: block; margin: 1em auto; min-width: 15em; }
  .error { padding: 0.8em 1em; color: #ffdce2; background: #521d31; border-radius: 8px; text-align: center; }
  .results { margin-top: 2em; padding: 1em 1.25em; }
  .total { padding-bottom: 0.8em; border-bottom: 1px solid #575371; }
  .total strong { color: #ffce00; font-size: 1.5em; }
  .result-row { padding-top: 0.8em; }
  @media (max-width: 720px) {
    .coordinate-grid { grid-template-columns: 1fr; }
    .section-heading, .map-toolbar { align-items: flex-start; }
    .name-label { align-items: flex-start; flex-direction: column; gap: 0.35em; }
    .name-label input { max-width: none; width: 100%; box-sizing: border-box; }
  }
</style>
