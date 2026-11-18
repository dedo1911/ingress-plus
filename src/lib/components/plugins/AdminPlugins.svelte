<script>
  import { onMount } from 'svelte'
  import Time from 'svelte-time'
  import { toast } from '@zerodevx/svelte-toast'
  import { pbAdmin } from '#lib/pocketbase/admin.js'
  import { STATUS_LABELS, describeAccess } from '#lib/plugins.js'
  import Callout from '#lib/components/Callout.svelte'

  // Review queue for the IITC plugin store. Approving or rejecting a version
  // is just a status change on the record; the backend hooks then update the
  // plugin (current_version, status) and notify Telegram.
  let pending = $state([])
  let plugins = $state([])
  let loading = $state(true)
  const notes = $state({})
  let busy = $state(null)

  // Source viewer: the file field is protected, so it needs a file token.
  let source = $state({ id: null, text: '', previous: '', loading: false })

  const load = async () => {
    loading = true
    try {
      pending = await pbAdmin.collection('iitc_plugin_versions').getFullList({
        filter: 'status = "pending"',
        sort: 'created',
        expand: 'plugin,plugin.author,plugin.current_version'
      })
      plugins = await pbAdmin.collection('iitc_plugins').getFullList({
        sort: 'name',
        expand: 'author,current_version'
      })
    } catch (err) {
      console.error(err)
      toast.push('Could not load the plugin queue.', { classes: ['errorToast'] })
    } finally {
      loading = false
    }
  }

  const fetchFile = async (record, token) => {
    const url = pbAdmin.files.getURL(record, record.file, { token })
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.text()
  }

  const viewSource = async (version) => {
    if (source.id === version.id) {
      source = { id: null, text: '', previous: '', loading: false }
      return
    }
    source = { id: version.id, text: '', previous: '', loading: true }
    try {
      const token = await pbAdmin.files.getToken()
      const text = await fetchFile(version, token)
      const current = version.expand?.plugin?.expand?.current_version
      const previous = current ? await fetchFile(current, token) : ''
      source = { id: version.id, text, previous, loading: false }
    } catch (err) {
      console.error(err)
      source = { id: version.id, text: 'Could not load the file.', previous: '', loading: false }
    }
  }

  const review = async (version, status) => {
    busy = version.id
    try {
      await pbAdmin.collection('iitc_plugin_versions').update(version.id, {
        status,
        review_notes: notes[version.id] || ''
      })
      toast.push(`${version.expand?.plugin?.name} v${version.version} ${status}.`, { classes: ['successToast'] })
      await load()
    } catch (err) {
      console.error(err)
      toast.push(err?.response?.message || 'Could not save the review.', { classes: ['errorToast'] })
    } finally {
      busy = null
    }
  }

  const setDisabled = async (plugin, disable) => {
    const reason = disable ? window.prompt(`Why is ${plugin.name} being disabled? The author will see this.`) : ''
    if (disable && reason === null) return
    busy = plugin.id
    try {
      const status = disable ? 'disabled' : (plugin.current_version ? 'approved' : 'draft')
      await pbAdmin.collection('iitc_plugins').update(plugin.id, { status, review_notes: reason || '' })
      toast.push(`${plugin.name} is now ${STATUS_LABELS[status]}.`, { classes: ['successToast'] })
      await load()
    } catch (err) {
      console.error(err)
      toast.push('Could not update the plugin.', { classes: ['errorToast'] })
    } finally {
      busy = null
    }
  }

  // A line diff against the version being served, good enough to spot what
  // an update changed without pulling in a diff library.
  const diffLines = (before, after) => {
    const a = before.split('\n')
    const b = after.split('\n')
    const inA = new Set(a)
    const inB = new Set(b)
    return [
      ...a.filter(l => !inB.has(l)).map(l => ({ type: 'del', l })),
      ...b.filter(l => !inA.has(l)).map(l => ({ type: 'add', l }))
    ]
  }

  onMount(load)
</script>

<div class="card">
  <h2>Versions waiting for review</h2>
  {#if loading}
    <p>Loading…</p>
  {:else if pending.length === 0}
    <p>Nothing to review.</p>
  {:else}
    {#each pending as v (v.id)}
      {@const plugin = v.expand?.plugin}
      <div class="review">
        <p>
          <b>{plugin?.name}</b> <code>{plugin?.slug}</code> v{v.version}
          by {plugin?.expand?.author?.username || 'unknown'} &middot; <Time relative timestamp={v.created} />
        </p>
        <p class="hint">
          {plugin?.expand?.current_version ? `Update from v${plugin.expand.current_version.version}` : 'First submission'}
          &middot; access: {describeAccess(plugin?.access)} &middot; sha256 <code>{v.sha256.slice(0, 12)}…</code>
        </p>
        {#if v.changelog}<p class="changelog">{v.changelog}</p>{/if}

        <button type="button" class="row-action" onclick={() => viewSource(v)}>
          {source.id === v.id ? 'Hide source' : 'View source'}
        </button>
        {#if source.id === v.id}
          {#if source.loading}
            <p>Loading…</p>
          {:else}
            {#if source.previous}
              <details open>
                <summary>Changed lines vs v{plugin.expand.current_version.version}</summary>
                <pre class="code">{#each diffLines(source.previous, source.text) as d, i (i)}<span class={d.type}>{d.type === 'add' ? '+ ' : '- '}{d.l}
</span>{/each}</pre>
              </details>
            {/if}
            <details open={!source.previous}>
              <summary>Full source</summary>
              <pre class="code">{source.text}</pre>
            </details>
          {/if}
        {/if}

        <label>Notes for the author <textarea rows="2" bind:value={notes[v.id]}></textarea></label>
        <div class="actions">
          <button type="button" class="cta" disabled={busy === v.id} onclick={() => review(v, 'approved')}>Approve</button>
          <button type="button" class="cta danger" disabled={busy === v.id} onclick={() => review(v, 'rejected')}>Reject</button>
        </div>
      </div>
    {/each}
  {/if}
</div>

<div class="card">
  <h2>All plugins</h2>
  <Callout>
    Rejecting an approved version (from the PocketBase admin UI) makes the plugin fall back to its previous approved version.
    Disabling a plugin hides it from everyone but its author, who can't re-enable it.
  </Callout>
  {#if !loading}
    <ul>
      {#each plugins as p (p.id)}
        <li>
          <div>
            <b>{p.name}</b> <code>{p.slug}</code>
            <span class="hint">
              {p.expand?.author?.username || 'unknown'} &middot; {STATUS_LABELS[p.status] || p.status}
              {#if p.expand?.current_version}&middot; v{p.expand.current_version.version}{/if}
              &middot; {describeAccess(p.access)}
            </span>
          </div>
          {#if p.status === 'disabled'}
            <button type="button" class="row-action" disabled={busy === p.id} onclick={() => setDisabled(p, false)}>Re-enable</button>
          {:else}
            <button type="button" class="row-action danger" disabled={busy === p.id} onclick={() => setDisabled(p, true)}>Disable</button>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  div.card {
    display: flex;
    flex-direction: column;
    gap: 1em;
    background: rgba(14, 11, 28, 0.9);
    border: 3px double #5e5a75;
    border-radius: 8px;
    padding: 1.5em;
    margin-top: 1.5em;
    text-align: left;
  }
  h2 {
    margin: 0;
    text-align: center;
    text-shadow: 0 0 10px black;
  }
  p {
    margin: 0;
  }
  div.review {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    padding: 0.75em;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
  }
  .hint {
    font-size: 0.85em;
    color: rgba(255, 255, 255, 0.6);
  }
  p.changelog {
    white-space: pre-wrap;
    font-size: 0.9em;
  }
  pre.code {
    max-height: 50vh;
    overflow: auto;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 6px;
    padding: 0.75em;
    font-size: 0.8em;
    white-space: pre;
  }
  pre.code span.add {
    color: #7dd87d;
  }
  pre.code span.del {
    color: #ff8a8a;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.35em;
  }
  textarea {
    width: 100%;
    box-sizing: border-box;
    background: rgba(14, 11, 28, 0.9);
    border: 3px double #5e5a75;
    border-radius: 8px;
    color: #fff;
    padding: 0.5em;
  }
  div.actions {
    display: flex;
    gap: 0.75em;
    justify-content: center;
  }
  button.danger {
    border-color: rgba(255, 60, 60, 0.6);
    color: #ff8a8a;
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5em;
  }
  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75em;
    padding: 0.5em;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
  }
  li div {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  button.row-action {
    align-self: flex-start;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.85);
    cursor: pointer;
    padding: 0.3em 0.7em;
    font-size: 0.8em;
    white-space: nowrap;
  }
  li button.row-action {
    align-self: center;
  }
</style>
