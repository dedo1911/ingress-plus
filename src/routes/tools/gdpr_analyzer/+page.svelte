<script>
  // Fully client-side tool - no +page.js/load(), nothing is fetched from PocketBase or
  // any server. Files the user adds are read via the browser's File API only.
  import Time from 'svelte-time'
  import { formatNumber } from '$lib/utils'
  import Callout from '$lib/components/Callout.svelte'
  import { summarizeFile } from '$lib/gdpr-analyzer/summarize'

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

  const describePrivacyFlags = flags => {
    const labels = flags.map(f => PRIVACY_FLAG_LABELS[f]).filter(Boolean)
    if (labels.length === 0) return ''
    if (labels.length === 1) return labels[0]
    return `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}`
  }

  let queue = $state([])
  let nextId = 0
  let draining = false

  const drainQueue = async () => {
    if (draining) return
    draining = true
    try {
      for (const item of queue) {
        if (item.status !== 'pending') continue
        item.status = 'processing'
        try {
          item.result = await summarizeFile(item.file)
          item.status = 'done'
        } catch (err) {
          console.error(err)
          item.error = 'Failed to process this file.'
          item.status = 'error'
        }
      }
    } finally {
      draining = false
    }
  }

  const addFiles = fileList => {
    for (const file of Array.from(fileList)) {
      const isDuplicate = queue.some(item => item.file.name === file.name && item.file.size === file.size)
      if (isDuplicate) continue
      queue.push({ id: nextId++, file, status: 'pending', result: null, error: null })
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
    addFiles(e.dataTransfer.files)
  }

  const removeFile = id => {
    queue = queue.filter(item => item.id !== id)
  }

  const clearAll = () => {
    queue = []
  }

  const flaggedResults = $derived(
    queue.filter(item => item.status === 'done' && item.result.privacyFlags.length > 0)
  )
</script>

<svelte:head>
  <title>Ingress Plus &middot; GDPR Analyzer</title>
</svelte:head>

<div class="container">
  <h1>GDPR Analyzer</h1>

  <p>
    Requested your data from Niantic? Drop the files you got in below to see what each
    one is, how many rows it has, and what date range it covers. This is a simple file
    identification tool - it doesn't dig into or visualize the data itself.
  </p>

  <Callout variant="info">
    Everything happens right here in your browser - files you add are never uploaded or
    sent anywhere.
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

  {#if queue.length > 0}
    <div class="results-header">
      <button onclick={clearAll}>Clear all</button>
    </div>

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
        {#each queue as item (item.id)}
          <tr>
            <td>{item.file.name}</td>
            {#if item.status === 'pending' || item.status === 'processing'}
              <td colspan="3" class="processing">Processing…</td>
            {:else if item.status === 'error'}
              <td colspan="3" class="row-warning">{item.error}</td>
            {:else if item.result.shape === 'rejected'}
              <td colspan="3" class="row-rejected">{item.result.description}</td>
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
  h1 {
    text-shadow: 0 0 10px black;
    text-align: center;
    margin: 1em auto;
    max-width: 800px;
  }
  div.container {
    text-align: center;
    max-width: 1000px;
    margin: auto;
    padding: 0 1em;
    line-height: 1.2em;
    margin-top: 2em;
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
