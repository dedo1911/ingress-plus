<script>
  // Fully client-side tool - no +page.js/load(), nothing is fetched from PocketBase or
  // any server. Files the user adds are read via the browser's File API only.
  import Time from 'svelte-time'
  import { toast } from '@zerodevx/svelte-toast'
  import { resolve } from '$app/paths'
  import { formatNumber } from '$lib/utils'
  import Callout from '$lib/components/Callout.svelte'
  import { summarizeFile } from '$lib/gdpr-analyzer/summarize'
  import { getMatchedKey } from '$lib/gdpr-analyzer/detect'
  import LocationHeatmap from './LocationHeatmap.svelte'
  import PurchaseSummary from './PurchaseSummary.svelte'

  // Mirrors the category taxonomy documented in $lib/gdpr-analyzer/catalog.js. A file
  // can carry more than one of these at once - describePrivacyFlags() below lists all
  // of them, not just the first. 'free-text' is intentionally omitted: it's a caveat
  // about a file's content, not a distinct thing worth naming on its own.
  const PRIVACY_FLAG_LABELS = {
    'own-email': 'your email address',
    'third-party-pii': "other players' information",
    location: 'precise location data',
    'device-info': 'device information'
  }

  // Shorter, tag-style versions of the same categories, used inline in the collapsed
  // verified-but-inactive file list rather than the full sentence phrasing above.
  const PRIVACY_TAG_LABELS = {
    'own-email': 'Email',
    'third-party-pii': "Other Players' Info",
    location: 'Location',
    'device-info': 'Device Info'
  }

  const joinLabels = (flags, labelMap) => {
    const labels = flags.map(f => labelMap[f]).filter(Boolean)
    if (labels.length === 0) return ''
    if (labels.length === 1) return labels[0]
    return `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}`
  }

  const describePrivacyFlags = flags => joinLabels(flags, PRIVACY_FLAG_LABELS)
  const describePrivacyTags = flags => joinLabels(flags, PRIVACY_TAG_LABELS)

  let queue = $state([])
  let nextId = 0
  let draining = false

  const drainQueue = async () => {
    if (draining) return
    draining = true
    try {
      // Re-queries the queue for the next pending item each pass rather than iterating a
      // captured array/for-of, since addFiles can splice an in-flight replaced file out of the
      // queue mid-drain (see the replace-on-duplicate logic below) - a live for-of loop would
      // have its indices shifted out from under it by that splice and could skip whatever
      // file landed in the gap.
      let next
      while ((next = queue.find(item => item.status === 'pending'))) {
        next.status = 'processing'
        try {
          next.result = await summarizeFile(next.file)
          next.status = 'done'
        } catch (err) {
          console.error(`Failed to analyze ${next.file.name}:`, err)
          next.error = 'Failed to process this file. See the browser console for details.'
          next.status = 'error'
        }
      }
    } finally {
      draining = false
    }
  }

  const addFiles = (fileList, isFolderFlags = []) => {
    const duplicateNames = []
    const replacedNames = []

    const files = Array.from(fileList)
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      // One file's name/metadata tripping up matching shouldn't stop the rest of the batch
      // from being added, or skip the drainQueue() call below - a file already pushed before
      // such a failure would otherwise sit at 'pending' until some unrelated future drop
      // happened to call drainQueue() again.
      try {
        const isFolder = isFolderFlags[i] ?? false
        const isDuplicate = queue.some(item => item.file.name === file.name && item.file.size === file.size)
        if (isDuplicate) {
          duplicateNames.push(file.name)
          continue
        }

        const matchedKey = getMatchedKey(file.name)
        if (matchedKey) {
          const existingIndex = queue.findIndex(item => item.matchedKey === matchedKey)
          if (existingIndex !== -1) {
            const [replaced] = queue.splice(existingIndex, 1)
            replacedNames.push(replaced.file.name)
          }
        }

        queue.push({ id: nextId++, file, matchedKey, isFolder, status: 'pending', result: null, error: null })
      } catch (err) {
        console.error(`Failed to add ${file.name}:`, err)
      }
    }

    // Batched into one toast per category per drop, rather than one per file, so dropping a
    // folder's worth of already-added files doesn't spam a toast for each one.
    if (duplicateNames.length === 1) {
      toast.push(`${duplicateNames[0]} has already been added`)
    } else if (duplicateNames.length > 1) {
      toast.push(`${duplicateNames.length} of the files you added were already in the list`)
    }
    if (replacedNames.length === 1) {
      toast.push(`Previous ${replacedNames[0]} replaced`)
    } else if (replacedNames.length > 1) {
      toast.push(`${replacedNames.length} previous files replaced`)
    }

    drainQueue()
  }

  const onInputChange = e => {
    addFiles(e.target.files)
    e.target.value = ''
  }

  // A counter rather than a plain boolean - dragenter/dragleave also fire when the
  // pointer moves over child elements of the dropzone (the label/input/hint text),
  // which would otherwise cause the highlight to flicker off while dragging within it.
  let dragCounter = $state(0)
  const isDraggingOver = $derived(dragCounter > 0)

  const onDragEnter = e => {
    e.preventDefault()
    dragCounter++
  }

  const onDragOver = e => {
    e.preventDefault()
  }

  const onDragLeave = e => {
    e.preventDefault()
    dragCounter = Math.max(0, dragCounter - 1)
  }

  const onDrop = e => {
    e.preventDefault()
    dragCounter = 0
    // e.dataTransfer.files can't distinguish a dropped folder from a real (if unusual) zero-byte
    // extension-less file on its own - webkitGetAsEntry() on the parallel `items` list is the
    // actual signal, checked here (at drop time, before it's too late to ask) rather than
    // guessed at display time. `items` and `files` share the same order for file-kind entries,
    // which is all a plain OS file/folder drag ever produces.
    const isFolderFlags = Array.from(e.dataTransfer.items ?? [])
      .filter(item => item.kind === 'file')
      .map(item => item.webkitGetAsEntry?.()?.isDirectory ?? false)
    addFiles(e.dataTransfer.files, isFolderFlags)
  }

  const removeFile = id => {
    queue = queue.filter(item => item.id !== id)
  }

  const clearAll = () => {
    queue = []
  }

  // Verified-but-inactive files carry their own inline privacy tag in their own list instead
  // (see verifiedNotAnalyzedItems below) - only files with an actual detail row need the
  // separate warning callout, since that's the only other place privacy info could get missed.
  const flaggedResults = $derived(
    queue.filter(item => item.status === 'done' && item.result.hasActiveAnalysis && item.result.privacyFlags.length > 0)
  )

  // Only files that feed some actual analysis (today: the heatmap - see `hasActiveAnalysis` in
  // $lib/gdpr-analyzer/summarize.js) get a full detail row; every other recognized file just
  // adds to a running count instead of the table, since a title/description/row-count for a
  // file nothing does anything with yet isn't worth the clutter. The catalog data itself is
  // untouched - only what this page chooses to render from it.
  const verifiedNotAnalyzedItems = $derived(
    queue.filter(item => item.status === 'done' && item.result.shape !== 'rejected' && !item.result.hasActiveAnalysis)
  )
  const unrecognizedItems = $derived(
    queue.filter(item => item.status === 'done' && item.result.shape === 'rejected')
  )
  const verifiedNotAnalyzedCount = $derived(verifiedNotAnalyzedItems.length)
  const unrecognizedCount = $derived(unrecognizedItems.length)
  const visibleQueueItems = $derived(
    queue.filter(item =>
      item.status === 'pending' || item.status === 'processing' || item.status === 'error' ||
      (item.status === 'done' && item.result.hasActiveAnalysis)
    )
  )

  // Files are processed sequentially (see drainQueue), so with several files queued at once
  // there's a real gap between dropping them in and analysis results (the heatmap panel below,
  // and eventually more analysis besides) actually appearing. This covers that gap generically
  // across whatever analysis exists now or gets added later, rather than being specific to any
  // one result type.
  const analyzingCount = $derived(
    queue.filter(item => item.status === 'pending' || item.status === 'processing').length
  )
  // drainQueue works one item at a time, so at most one item is ever 'processing' -
  // surfacing its name matters most for a file like game_log.tsv, which is large enough
  // that sitting on it for a while without any file-level feedback could read as stuck.
  const currentlyProcessing = $derived(queue.find(item => item.status === 'processing'))

  // Automatic-analysis panel: dynamically populated from whichever queued files carry
  // extractable location data (see `heatGroups` in $lib/gdpr-analyzer/summarize.js), rather
  // than a fixed list - dropping a second matching file grows the source toggle in place. The
  // user's toggle picks are kept separate from the derived "what's actually available" state so
  // stale picks (e.g. after removing a file) fall back to the first available option instead of
  // pointing at nothing.
  const heatmapSources = $derived(
    queue
      .filter(item => item.status === 'done' && item.result.heatGroups)
      .map(item => ({ id: item.id, fileLabel: item.result.label, groups: item.result.heatGroups }))
  )

  let userSelectedSourceId = $state(null)
  let userSelectedGroupKey = $state(null)

  const activeSource = $derived(
    heatmapSources.find(s => s.id === userSelectedSourceId) ?? heatmapSources[0] ?? null
  )
  const activeGroupKeys = $derived(activeSource ? Object.keys(activeSource.groups) : [])
  const activeGroupKey = $derived(
    activeGroupKeys.includes(userSelectedGroupKey) ? userSelectedGroupKey : (activeGroupKeys[0] ?? null)
  )
  const activePoints = $derived(activeSource && activeGroupKey ? activeSource.groups[activeGroupKey] : [])

  // Same "automatic analysis" area as the heatmap above, but its own independent panel rather
  // than folded into the heatmap's source/group toggles - a stats table and a map aren't the
  // same kind of widget, and more than one file could carry a purchaseSummary in the future.
  const purchaseSummaries = $derived(
    queue
      .filter(item => item.status === 'done' && item.result.purchaseSummary)
      .map(item => ({ id: item.id, fileLabel: item.result.label, summary: item.result.purchaseSummary }))
  )
</script>

<svelte:head>
  <title>Ingress Plus &middot; GDPR Analyzer</title>
</svelte:head>

<div class="container">
  <div class="header">
    <h1>GDPR Analyzer</h1>
    <a class="faq-button" href={resolve('/tools/gdpr_analyzer/faq')}>
      <img src="/images/help.svg" alt="" />
      How does this tool work?
    </a>
  </div>

  <p>
    If you have requested your Ingress data via a GDPR data request, you can use this tool to analyze and visualize various information from it you don't normally see in your Scanner!
  </p>

  <Callout variant="info">
    All processing happens in your browser. No data is uploaded or sent to us or anyone else.<br>
    <a class="info-link" href={resolve('/tools/gdpr_analyzer/faq')}>
      <img src="/images/help.svg" alt="" />More information
    </a>
  </Callout>

  <div
    class="dropzone"
    class:dragging={isDraggingOver}
    ondragenter={onDragEnter}
    ondragover={onDragOver}
    ondragleave={onDragLeave}
    ondrop={onDrop}
  >
    <label class="file-upload" for="gdpr-files">Choose files</label>
    <input
      id="gdpr-files"
      type="file"
      multiple
      accept=".tsv,.csv,.txt,.json,.zip"
      onchange={onInputChange}
    />
    <p class="hint">…or drag and drop files here</p>
  </div>

  {#if analyzingCount > 0}
    <div class="analyzing-indicator">
      <span class="spinner" aria-hidden="true"></span>
      Analyzing {analyzingCount} file{analyzingCount === 1 ? '' : 's'}…
      {#if currentlyProcessing}
        - {currentlyProcessing.file.name}
      {/if}
    </div>
  {/if}

  {#if heatmapSources.length > 0}
    <div class="analysis-panel">
      {#if heatmapSources.length > 1}
        <div class="toggle-row">
          {#each heatmapSources as source (source.id)}
            <button
              type="button"
              class="toggle-pill"
              class:active={source.id === activeSource.id}
              onclick={() => { userSelectedSourceId = source.id }}
            >{source.fileLabel}</button>
          {/each}
        </div>
      {/if}

      {#if activeGroupKeys.length > 1}
        <div class="toggle-row">
          {#each activeGroupKeys as groupKey (groupKey)}
            <button
              type="button"
              class="toggle-pill"
              class:active={groupKey === activeGroupKey}
              onclick={() => { userSelectedGroupKey = groupKey }}
            >{groupKey}</button>
          {/each}
        </div>
      {/if}

      <svelte:boundary onerror={(error) => console.error('Location heatmap failed to render:', error)}>
        <LocationHeatmap points={activePoints} />
        {#snippet failed(error, reset)}
          <Callout variant="error">
            Something went wrong while showing the location heatmap - the rest of the page should
            still work. Check the browser console for details.
            <button type="button" onclick={reset}>Try again</button>
          </Callout>
        {/snippet}
      </svelte:boundary>
    </div>
  {/if}

  {#each purchaseSummaries as source (source.id)}
    <div class="analysis-panel">
      <h2 class="panel-heading">{source.fileLabel}</h2>
      <svelte:boundary onerror={(error) => console.error(`Purchase summary for ${source.fileLabel} failed to render:`, error)}>
        <PurchaseSummary summary={source.summary} />
        {#snippet failed(error, reset)}
          <Callout variant="error">
            Something went wrong while showing this file's summary - the rest of the page should
            still work. Check the browser console for details.
            <button type="button" onclick={reset}>Try again</button>
          </Callout>
        {/snippet}
      </svelte:boundary>
    </div>
  {/each}

  {#if queue.length > 0}
    <div class="results-header">
      <button onclick={clearAll}>Clear all</button>
    </div>

    {#if visibleQueueItems.length > 0}
      <table>
        <thead>
          <tr>
            <th>File</th>
            <th>Identified as</th>
            <th>Count</th>
            <th>Date range</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each visibleQueueItems as item (item.id)}
            <tr>
              <td>{item.file.name}</td>
              {#if item.status === 'pending' || item.status === 'processing'}
                <td colspan="3" class="processing">Processing…</td>
              {:else if item.status === 'error'}
                <td colspan="3" class="row-warning">{item.error}</td>
              {:else}
                <td class="identified">
                  <div class="label">
                    {item.result.label}
                  </div>
                  {#if item.result.description}
                    <div class="description">{item.result.description}</div>
                  {/if}
                  {#if item.result.warnings.length > 0}
                    <div class="row-warning">{item.result.warnings.join(' ')}</div>
                  {/if}
                </td>
                <td>
                  {#if item.result.count != null}
                    {formatNumber(item.result.count)} {item.result.countLabel}
                  {:else}
                    &mdash;
                  {/if}
                </td>
                <td>
                  {#if item.result.dateRange}
                    <Time timestamp={item.result.dateRange.start} format="YYYY-MM-DD" />
                    &ndash;
                    <Time timestamp={item.result.dateRange.end} format="YYYY-MM-DD" />
                  {:else}
                    &mdash;
                  {/if}
                </td>
              {/if}
              <td>
                <span class="remove" onclick={() => removeFile(item.id)} role="button" tabindex="0"
                  onkeydown={e => { if (e.key === 'Enter' || e.key === ' ') removeFile(item.id) }}
                  aria-label="Remove {item.file.name}"></span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}

    {#if verifiedNotAnalyzedCount > 0}
      <p class="hint">
        {verifiedNotAnalyzedCount} file{verifiedNotAnalyzedCount === 1 ? '' : 's'}
        {verifiedNotAnalyzedCount === 1 ? 'has' : 'have'} been added that
        {verifiedNotAnalyzedCount === 1 ? 'has' : 'have'} been verified to be part of a GDPR dump,
        but cannot be analyzed by this tool yet.
      </p>
      <details class="file-list-details">
        <summary>Show file names</summary>
        <ul>
          {#each verifiedNotAnalyzedItems as item (item.id)}
            <li>
              <strong>{item.result.label}</strong> - <span class="muted">{item.file.name}{item.isFolder ? ' (folder)' : ''}</span>
              {#if item.result.privacyFlags.length > 0}
                - <span class="row-warning">Contains {describePrivacyTags(item.result.privacyFlags)} data</span>
              {/if}
            </li>
          {/each}
        </ul>
      </details>
    {/if}

    {#if unrecognizedCount > 0}
      <p class="row-rejected">
        {unrecognizedCount} file{unrecognizedCount === 1 ? '' : 's'}
        {unrecognizedCount === 1 ? 'has' : 'have'} been added that
        {unrecognizedCount === 1 ? 'does' : 'do'} not seem to come from an Ingress GDPR export. If
        {unrecognizedCount === 1 ? 'it does' : 'they do'}, please let us know.
      </p>
      <details class="file-list-details">
        <summary>Show file names</summary>
        <ul>
          {#each unrecognizedItems as item (item.id)}
            <li>{item.file.name}{item.isFolder ? ' (folder)' : ''}</li>
          {/each}
        </ul>
      </details>
    {/if}

    {#if flaggedResults.length > 0}
      <Callout variant="warning">
        <div class="flagged-list">
          <p>Some of the files you added contain sensitive information - be careful sharing or screenshotting them:</p>
          <ul>
            {#each flaggedResults as item (item.id)}
              <li><strong>{item.file.name}</strong> contains {describePrivacyFlags(item.result.privacyFlags)}</li>
            {/each}
          </ul>
        </div>
      </Callout>
    {/if}
  {/if}
</div>

<style>
  div.container {
    text-align: center;
    max-width: 1000px;
    margin: auto;
    padding: 0 1em;
    line-height: 1.2em;
    margin-top: 2em;
  }
  div.header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1em;
    margin: 1em 0;
  }
  div.header h1 {
    text-shadow: 0 0 10px black;
    margin: 0;
  }
  a.faq-button {
    display: flex;
    align-items: center;
    gap: 0.5em;
    color: rgba(255, 255, 255, 0.85);
    background: rgba(14, 11, 28, 0.9);
    border: 1px solid #5e5a75;
    border-radius: 999px;
    padding: 0.5em 1.2em;
    white-space: nowrap;
    transition: color 150ms ease-in-out, border-color 150ms ease-in-out, background-color 150ms ease-in-out;
  }
  a.faq-button:hover {
    color: #FFF;
    border-color: #9593c3;
    background: rgba(89, 86, 154, 0.35);
  }
  a.faq-button img {
    height: 1.2em;
  }
  a.info-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25em;
  }
  a.info-link img {
    height: 1em;
  }
  div.dropzone {
    border: 3px double #5e5a75;
    border-radius: 8px;
    padding: 2em 1em;
    margin: 1em 0;
    text-align: center;
    transition: background-color 150ms ease-in-out, border-color 150ms ease-in-out;
  }
  div.dropzone.dragging {
    border-color: #9593c3;
    background: rgba(89, 86, 154, 0.15);
  }
  p.hint {
    margin: 0.75em 0 0;
    color: rgba(255, 255, 255, 0.6);
  }
  div.analyzing-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6em;
    margin: 1em 0;
    color: rgba(255, 255, 255, 0.6);
  }
  span.spinner {
    width: 1em;
    height: 1em;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-top-color: #9593c3;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  div.analysis-panel {
    margin: 1em 0;
  }
  h2.panel-heading {
    text-align: left;
    font-size: 1.1em;
    color: rgba(255, 255, 255, 0.6);
    margin: 0 0 0.5em;
  }
  div.toggle-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5em;
    margin-bottom: 0.75em;
  }
  button.toggle-pill {
    color: rgba(255, 255, 255, 0.6);
    background: rgba(14, 11, 28, 0.9);
    border: 1px solid #5e5a75;
    border-radius: 999px;
    padding: 0.35em 1em;
    transition: color 150ms ease-in-out, border-color 150ms ease-in-out, background-color 150ms ease-in-out;
  }
  button.toggle-pill:hover {
    color: #FFF;
    border-color: #9593c3;
  }
  button.toggle-pill.active {
    color: #FFF;
    background: rgba(89, 86, 154, 0.35);
    border-color: #9593c3;
  }
  div.flagged-list {
    text-align: left;
  }
  div.flagged-list p {
    margin: 0;
  }
  div.flagged-list ul {
    margin: 0.5em 0 0;
    padding-left: 1.5em;
  }
  details.file-list-details {
    text-align: left;
    margin: 0.25em 0 1em;
  }
  details.file-list-details summary {
    cursor: pointer;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9em;
  }
  details.file-list-details summary:hover {
    color: #FFF;
  }
  details.file-list-details ul {
    margin: 0.5em 0 0;
    padding-left: 1.5em;
    font-size: 0.9em;
    color: rgba(255, 255, 255, 0.6);
  }
  details.file-list-details ul strong {
    color: #FFF;
  }
  details.file-list-details .muted {
    color: rgba(255, 255, 255, 0.6);
  }
  div.results-header {
    display: flex;
    justify-content: flex-end;
    margin: 1em 0 0;
  }
  div.results-header button {
    color: #FFF;
    padding-bottom: 0.25em;
    border-bottom: 1px solid rgba(255, 255, 255, 0);
    transition: border 0.3s ease-in-out;
  }
  div.results-header button:hover {
    border-bottom: 1px solid rgba(255, 255, 255, 1);
  }
  table {
    width: 100%;
    margin: 1em 0;
    border-collapse: collapse;
    background: rgba(14, 11, 28, 0.9);
    border: 3px double #5e5a75;
    border-radius: 8px;
  }
  th, td {
    padding: 0.5em 1em;
    vertical-align: middle;
  }
  thead tr {
    border-bottom: 1px solid #5e5a75;
  }
  tbody tr:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  td.identified {
    text-align: left;
  }
  td.identified .label {
    font-weight: bold;
  }
  td.identified .description {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9em;
    margin-top: 0.25em;
  }
  .row-warning {
    color: #ffb84d;
    font-size: 0.9em;
    margin-top: 0.25em;
  }
  .row-rejected {
    color: #ff6b6b;
    font-style: italic;
  }
  td.processing {
    color: rgba(255, 255, 255, 0.6);
    font-style: italic;
  }
  span.remove {
    display: inline-block;
    background-image: url('/images/close.png');
    background-size: contain;
    background-repeat: no-repeat;
    width: 20px;
    height: 20px;
    cursor: pointer;
  }
</style>
