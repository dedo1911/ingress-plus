<script>
  import { onMount } from 'svelte'
  import Time from 'svelte-time'
  import { toast } from '@zerodevx/svelte-toast'
  import { pbAdmin } from '#lib/pocketbase/admin.js'

  // Every IITC sideloader token on the site. Superusers skip the collection
  // rules, so this sees all agents' tokens. Revoking deletes the record, the
  // same thing an agent's own "Disconnect" does.
  let tokens = $state([])
  let loading = $state(true)
  let revoking = $state(null)

  let query = $state('')
  let usage = $state('all')
  let sortKey = $state('last_used_at')
  let sortDir = $state(-1)

  const DAY = 24 * 60 * 60 * 1000
  const USAGE_FILTERS = {
    all: { label: 'Any time', test: () => true },
    day: { label: 'Used in the last 24h', test: (age) => age !== null && age <= DAY },
    week: { label: 'Used in the last 7 days', test: (age) => age !== null && age <= 7 * DAY },
    month: { label: 'Used in the last 30 days', test: (age) => age !== null && age <= 30 * DAY },
    stale: { label: 'Not used for 30+ days', test: (age) => age === null || age > 30 * DAY }
  }

  const COLUMNS = [
    { key: 'username', label: 'Agent' },
    { key: 'label', label: 'Device' },
    { key: 'created', label: 'Created' },
    { key: 'last_used_at', label: 'Last used' }
  ]

  const load = async () => {
    loading = true
    try {
      const records = await pbAdmin.collection('iitc_tokens').getFullList({
        expand: 'user',
        fields: 'id,label,created,last_used_at,expand.user.id,expand.user.username,expand.user.email',
        requestKey: null
      })
      tokens = records.map(t => ({
        id: t.id,
        label: t.label || '',
        created: t.created,
        last_used_at: t.last_used_at || '',
        username: t.expand?.user?.username || '',
        email: t.expand?.user?.email || ''
      }))
    } catch (err) {
      console.error(err)
      toast.push('Could not load the IITC tokens.', { classes: ['errorToast'] })
    } finally {
      loading = false
    }
  }

  const ageOf = (t) => t.last_used_at ? Date.now() - new Date(t.last_used_at).getTime() : null

  const sortBy = (key) => {
    if (sortKey === key) {
      sortDir = -sortDir
    } else {
      sortKey = key
      // Dates read best newest first, names A to Z.
      sortDir = key === 'created' || key === 'last_used_at' ? -1 : 1
    }
  }

  const visible = $derived.by(() => {
    const q = query.trim().toLowerCase()
    const test = USAGE_FILTERS[usage].test
    const rows = tokens.filter(t =>
      test(ageOf(t)) &&
      (!q || t.username.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.label.toLowerCase().includes(q))
    )
    // Empty values (a never-used token, a missing label) always go last.
    return rows.sort((a, b) => {
      const x = a[sortKey]
      const y = b[sortKey]
      if (!x && !y) return 0
      if (!x) return 1
      if (!y) return -1
      return sortDir * String(x).localeCompare(String(y), undefined, { sensitivity: 'base' })
    })
  })

  const agentCount = $derived(new Set(visible.map(t => t.username)).size)

  const revoke = async (token) => {
    if (!window.confirm(`Revoke "${token.label || 'unnamed device'}" for ${token.username || 'unknown agent'}? The sideloader on that device stops working until they connect it again.`)) return
    revoking = token.id
    try {
      await pbAdmin.collection('iitc_tokens').delete(token.id)
      tokens = tokens.filter(t => t.id !== token.id)
      toast.push(`Revoked ${token.username}'s ${token.label || 'device'}.`, { classes: ['successToast'] })
    } catch (err) {
      console.error(err)
      toast.push('Could not revoke that token.', { classes: ['errorToast'] })
    } finally {
      revoking = null
    }
  }

  onMount(load)
</script>

<div class="card">
  <div class="header">
    <h2>IITC tokens</h2>
    <button type="button" class="row-action" disabled={loading} onclick={load}>Reload</button>
  </div>

  <div class="filters">
    <input type="search" bind:value={query} placeholder="Filter by agent, email or device…" />
    <select bind:value={usage}>
      {#each Object.entries(USAGE_FILTERS) as [value, f] (value)}
        <option {value}>{f.label}</option>
      {/each}
    </select>
  </div>

  {#if loading}
    <p>Loading…</p>
  {:else if tokens.length === 0}
    <p>No tokens yet.</p>
  {:else}
    <p class="hint">
      {visible.length} of {tokens.length} tokens &middot; {agentCount} {agentCount === 1 ? 'agent' : 'agents'}.
      Last used is updated at most every 10 minutes.
    </p>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            {#each COLUMNS as col (col.key)}
              <th aria-sort={sortKey === col.key ? (sortDir > 0 ? 'ascending' : 'descending') : 'none'}>
                <button type="button" onclick={() => sortBy(col.key)}>
                  {col.label}
                  <span class="arrow">{sortKey === col.key ? (sortDir > 0 ? '▲' : '▼') : ''}</span>
                </button>
              </th>
            {/each}
            <th><span class="visually-hidden">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {#each visible as t (t.id)}
            <tr>
              <td>
                <b>{t.username || 'unknown'}</b>
                {#if t.email}<span class="hint">{t.email}</span>{/if}
              </td>
              <td>{t.label || '—'}</td>
              <td><Time relative timestamp={t.created} title={new Date(t.created).toLocaleString()} /></td>
              <td>
                {#if t.last_used_at}
                  <Time relative timestamp={t.last_used_at} title={new Date(t.last_used_at).toLocaleString()} />
                {:else}
                  <span class="hint">never</span>
                {/if}
              </td>
              <td class="actions">
                <button type="button" class="row-action danger" disabled={revoking === t.id} onclick={() => revoke(t)}>
                  {revoking === t.id ? 'Revoking…' : 'Revoke'}
                </button>
              </td>
            </tr>
          {:else}
            <tr><td colspan="5" class="hint">No tokens match these filters.</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
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
  div.header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1em;
  }
  h2 {
    margin: 0;
    text-shadow: 0 0 10px black;
  }
  p {
    margin: 0;
  }
  .hint {
    font-size: 0.85em;
    color: rgba(255, 255, 255, 0.6);
  }
  div.filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75em;
  }
  div.filters input,
  div.filters select {
    box-sizing: border-box;
    background: rgba(14, 11, 28, 0.9);
    border: 3px double #5e5a75;
    border-radius: 8px;
    color: #fff;
    padding: 0.4em 0.6em;
    font: inherit;
  }
  div.filters input {
    flex: 1 1 14em;
    min-width: 0;
  }
  div.filters select {
    flex: 0 1 auto;
  }
  div.table-wrap {
    overflow-x: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9em;
  }
  th,
  td {
    padding: 0.5em;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    vertical-align: middle;
  }
  th {
    text-align: left;
    white-space: nowrap;
  }
  th button {
    background: none;
    border: none;
    color: inherit;
    font: inherit;
    font-weight: bold;
    cursor: pointer;
    padding: 0;
  }
  th button:hover {
    color: var(--color-faction-unaligned);
  }
  span.arrow {
    display: inline-block;
    width: 1em;
    font-size: 0.75em;
  }
  td span.hint {
    display: block;
    word-break: break-all;
  }
  td.actions {
    text-align: right;
  }
  button.row-action {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.85);
    cursor: pointer;
    padding: 0.3em 0.7em;
    font-size: 0.8em;
    white-space: nowrap;
  }
  button.danger {
    border-color: rgba(255, 60, 60, 0.6);
    color: #ff8a8a;
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
</style>
