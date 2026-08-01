<script>
  // Offline-only heatmap: no L.tileLayer, no fetch to any non-same-origin host - the only
  // network call this component makes is the same-origin borders GeoJSON below. Leaflet and
  // leaflet.heat are window-dependent with no SSR story, so all setup happens in onMount,
  // which only ever runs client-side under SvelteKit.
  import { onMount, onDestroy } from 'svelte'
  import 'leaflet/dist/leaflet.css'

  const { points = [] } = $props()

  let container
  // $state.raw (not plain `let`): the effect below needs to re-run once these go from null
  // to a real instance, which requires the *reassignment itself* to be tracked. Plain `let`
  // reassignments aren't reactive at all, and a normal deep `$state` would proxy the Leaflet
  // instances themselves, which could clash with Leaflet's own internal `this` bookkeeping -
  // raw state gives reactive reassignment without wrapping the value.
  let map = $state.raw(null)
  let heatLayer = $state.raw(null)
  let leaflet = null

  function fitToPoints (pts) {
    if (!map || !leaflet || pts.length === 0) return
    map.fitBounds(leaflet.latLngBounds(pts.map(([lat, lng]) => [lat, lng])), { maxZoom: 10, padding: [20, 20] })
  }

  onMount(() => {
    let cancelled = false

    ;(async () => {
      // leaflet.heat is a plain UMD plugin that reaches for a bare `L` global rather than
      // importing leaflet itself - it relies on leaflet's own UMD wrapper having already
      // assigned `window.L` as a side effect of the import above it, so import order matters.
      const L = (await import('leaflet')).default
      await import('leaflet.heat')
      const bordersResponse = await fetch('/data/gdpr_analyzer/world-borders.geojson')
      const borders = await bordersResponse.json()
      if (cancelled) return

      leaflet = L
      map = L.map(container, { maxZoom: 7, worldCopyJump: true }).setView([20, 0], 2)

      // leaflet.heat (see the import-order note above) is old enough that it hardcodes its
      // canvas into the default overlayPane rather than accepting a `pane` option, so it can't
      // be told to render above the borders layer itself. Giving the borders their own pane
      // with a lower z-index than overlayPane (400) makes the stacking order explicit and
      // independent of DOM append order, instead of relying on both layers sharing one pane.
      map.createPane('borders')
      map.getPane('borders').style.zIndex = 350
      L.geoJSON(borders, {
        pane: 'borders',
        style: { color: '#5e5a75', weight: 1, fillColor: '#231f3d', fillOpacity: 1 }
      }).addTo(map)
      heatLayer = L.heatLayer(points, { radius: 12 }).addTo(map)
      fitToPoints(points)
    })()

    return () => { cancelled = true }
  })

  onDestroy(() => {
    map?.remove()
  })

  // Reused for every toggle switch rather than tearing down/recreating the map - keeps the
  // borders layer and map viewport instance stable, only the heat data itself changes. The
  // viewport is deliberately only fit to the data once, right after the map is first created
  // (see onMount) - not here - so switching toggles never yanks the user's own pan/zoom back.
  $effect(() => {
    if (!map || !heatLayer) return
    heatLayer.setLatLngs(points)
  })
</script>

<div class="map-container" bind:this={container}></div>

<style>
  div.map-container {
    height: 400px;
    border: 3px double #5e5a75;
    border-radius: 8px;
    background: rgba(14, 11, 28, 0.9);
  }
</style>
