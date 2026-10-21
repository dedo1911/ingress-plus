<script>
  import { onMount } from 'svelte'
  import { resolve } from '$app/paths'
  import 'leaflet/dist/leaflet.css'

  let mapElement
  let map
  let L
  let drawnLayers
  let fields = $state([])
  let drawing = $state(false)
  let draftCoordinates = $state([])
  let calculating = $state(false)
  let error = $state('')
  let results = $state([])

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

  function syncMap () {
    if (!drawnLayers || !L) return
    drawnLayers.clearLayers()
    fields.forEach((field, fieldIndex) => {
      const coordinates = field.coordinates
        .map(point => point.map(Number))
        .filter(([lat, lon]) => Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180)
      if (!coordinates.length) return
      coordinates.forEach((point, pointIndex) => {
        L.circleMarker(point, {
          radius: 6,
          color: '#ffffff',
          weight: 2,
          fillColor: '#00adef',
          fillOpacity: 1
        }).bindTooltip(`${field.name || `Field ${fieldIndex + 1}`} · ${pointIndex + 1}`).addTo(drawnLayers)
      })
      if (coordinates.length > 1) {
        L.polygon(coordinates, {
          color: '#00adef',
          weight: 2,
          fillColor: '#00adef',
          fillOpacity: 0.18
        }).addTo(drawnLayers)
      }
    })
    if (draftCoordinates.length) {
      draftCoordinates.forEach((point, pointIndex) => {
        L.circleMarker(point, { radius: 6, color: '#fff', fillColor: '#ffce00', fillOpacity: 1 })
          .bindTooltip(`New field · ${pointIndex + 1}`)
          .addTo(drawnLayers)
      })
      if (draftCoordinates.length > 1) {
        L.polyline(draftCoordinates, { color: '#ffce00', dashArray: '6 6' }).addTo(drawnLayers)
      }
    }
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

  function handleMapClick (event) {
    if (!drawing || draftCoordinates.length >= 3) return
    draftCoordinates = [...draftCoordinates, [event.latlng.lat, event.latlng.lng]]
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
    map = L.map(mapElement, { zoomControl: true }).setView([46.2044, 6.1432], 5)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)
    drawnLayers = L.layerGroup().addTo(map)
    map.on('click', handleMapClick)
    syncMap()
    return () => map.remove()
  })

  $effect(() => {
    fields
    draftCoordinates
    syncMap()
  })
</script>

<svelte:head>
  <title>Ingress Plus &middot; MU Calculator</title>
  <meta name="description" content="Estimate Mind Units for Ingress fields from portal coordinates or by drawing triangles on a map." />
</svelte:head>

<div class="container">
  <a class="back" href={resolve('/tools')}>← Tools</a>
  <h1>MU Calculator</h1>
  <p class="intro">Estimate the Mind Units your field plan would generate. Enter three portal coordinates for each triangle or draw fields directly on the map.</p>

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
      <div><h2 id="fields-title">Your fields</h2><p>Coordinates use decimal degrees in latitude, longitude order.</p></div>
      <button class="secondary" onclick={() => addField()} disabled={fields.length >= 50}>＋ Add field</button>
    </div>

    {#if fields.length === 0}
      <p class="empty-fields">No fields yet. Draw a triangle on the map or add a field to enter coordinates.</p>
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
                <label>Latitude<input type="number" step="any" min="-90" max="90" placeholder="46.2044" value={point[0]} oninput={event => updateCoordinate(fieldIndex, pointIndex, 0, event.currentTarget.value)} /></label>
                <label>Longitude<input type="number" step="any" min="-180" max="180" placeholder="6.1432" value={point[1]} oninput={event => updateCoordinate(fieldIndex, pointIndex, 1, event.currentTarget.value)} /></label>
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
  .point-number { display: grid; place-items: center; width: 1.8em; height: 1.8em; border-radius: 50%; background: #00adef; color: #080818; font-weight: 700; }
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
