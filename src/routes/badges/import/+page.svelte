<script>
  import { browser } from '$app/environment'
  import { goto } from '$app/navigation'
  import { resolve } from '$app/paths'
  import { slide } from 'svelte/transition'
  import { toast } from '@zerodevx/svelte-toast'
  import { pb, serverAddress } from '$lib/pocketbase'
  import { authData, ownedBadges } from '$lib/stores'
  import { parseTextExport } from '$lib/statImport/textExport.js'
  import { matchBadgesToStats } from '$lib/statImport/matchBadges.js'
  import Callout from '$lib/components/Callout.svelte'

  const { data } = $props()
  const { badges } = data

  // TEMPORARY: auth gate disabled for mobile testing - restore before shipping.
  const SKIP_AUTH_GATE_FOR_TESTING = true

  $effect(() => {
    if (!SKIP_AUTH_GATE_FOR_TESTING && browser && $authData.isValid === false) goto(resolve('/badges'))
  })

  // Each entry is a distinct way of getting stat data into the parser below.
  // Only the game's text export is supported for now; other methods (e.g.
  // a screenshot) will be added as more tabs here later.
  const methods = [
    { id: 'text', label: 'Text Export' }
  ]
  let activeMethod = $state('text')

  let pasteText = $state('')
  let result = $state(null)
  let importing = $state(false)
  let currentlyImporting = $state('')

  const handleParse = () => {
    const parsed = parseTextExport(pasteText)
    result = parsed.error ? parsed : { ...parsed, stats: matchBadgesToStats(parsed.stats, badges) }
  }

  // Every matched badge whose tier-0 requirement is met (and that isn't
  // unobtainable, locked, or not yet unlocked - see resolveTier in
  // matchBadges.js), flattened out of the per-stat badge lists above so the
  // "what will change" preview and the actual import can iterate over one
  // flat list of badges to mark. alreadyOwned is recalculated whenever
  // ownedBadges changes, so it also updates live as the import runs.
  const importCandidates = $derived(
    result && !result.error
      ? result.stats.flatMap(entry =>
        entry.badges
          .filter(({ reached }) => reached)
          .map(({ badge, tierIndex, wingsEarned }) => {
            const existing = $ownedBadges.find(b => b.badge === badge.id)
            const alreadyOwned = !!existing && existing.tier >= tierIndex && (existing.hasWings || !wingsEarned)
            return { stat: entry.stat, value: entry.value, badge, tierIndex, wingsEarned, alreadyOwned }
          })
      )
      : []
  )

  // Only badges that would actually change - already-owned tiers/wings are
  // left untouched rather than re-written.
  const pendingCandidates = $derived(importCandidates.filter(c => !c.alreadyOwned))

  // Mirrors the create/update logic BadgeModal uses when a user manually
  // toggles a badge's tier and wings - each badge gets at most one
  // user_badges record, so an existing one is updated in place. Tier and
  // wings are only ever raised, never lowered, in case an existing record
  // already reflects more progress than this export does.
  const handleImport = async () => {
    if (!$authData.isValid) {
      toast.push('You need to be logged in to import stats.', { classes: ['errorToast'] })
      return
    }

    const toImport = pendingCandidates
    const skipped = importCandidates.length - toImport.length

    importing = true
    try {
      for (const { badge, tierIndex, wingsEarned } of toImport) {
        currentlyImporting = badge.title
        const existing = $ownedBadges.find(b => b.badge === badge.id)
        if (existing) {
          const el = await pb.collection('user_badges').update(existing.id, {
            tier: Math.max(existing.tier, tierIndex),
            hasWings: existing.hasWings || wingsEarned
          })
          ownedBadges.update(bs => [...bs.filter(b => b.id !== el.id), el])
        } else {
          const el = await pb.collection('user_badges').create({
            user: pb.authStore.model.id,
            badge: badge.id,
            tier: tierIndex,
            hasWings: wingsEarned
          })
          ownedBadges.update(bs => [...bs, el])
        }
      }
      const importedMessage = `Imported ${toImport.length} badge${toImport.length === 1 ? '' : 's'}!`
      const skippedMessage = skipped > 0 ? ` Skipped ${skipped} already owned.` : ''
      toast.push(importedMessage + skippedMessage, { classes: ['successToast'] })
    } catch (err) {
      console.error(err)
      toast.push('Something went wrong while importing your badges.', { classes: ['errorToast'] })
    } finally {
      importing = false
      currentlyImporting = ''
    }
  }
</script>

{#snippet statsTable(entries, showBadge)}
  <table>
    <thead>
      <tr>
        {#if showBadge}<th></th>{/if}
        <th>Stat</th>
        <th>Value</th>
      </tr>
    </thead>
    <tbody>
      {#each entries as { stat, value, badges: matchedBadges } (stat)}
        <tr>
          {#if showBadge}
            <td class="badge-cell">
              {#if matchedBadges?.[0]}
                {@const { badge, tierIndex, reached, wingsEarned } = matchedBadges[0]}
                <span class="badge-wrapper">
                  <img
                    src="{serverAddress}/api/files/{badge.collectionId}/{badge.id}/{badge.image[tierIndex]}?thumb=64x64"
                    alt={badge.title}
                    height="32"
                    width="32"
                    class:dimmed={!reached}
                  />
                  {#if wingsEarned}
                    <img
                      class="wings-overlay"
                      src="/images/badges/recursed_flair.png"
                      alt="Wings earned"
                    />
                  {/if}
                </span>
              {/if}
            </td>
          {/if}
          <td>{stat}</td>
          <td>{value}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{/snippet}

{#snippet importTable(candidates)}
  <table>
    <thead>
      <tr>
        <th></th>
        <th>Badge</th>
        <th>Stat</th>
        <th>Value</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each candidates as candidate (candidate.badge.id)}
        <tr class:already-owned={candidate.alreadyOwned}>
          <td class="badge-cell">
            <span class="badge-wrapper">
              <img
                src="{serverAddress}/api/files/{candidate.badge.collectionId}/{candidate.badge.id}/{candidate.badge.image[candidate.tierIndex]}?thumb=64x64"
                alt={candidate.badge.title}
                height="32"
                width="32"
              />
              {#if candidate.wingsEarned}
                <img class="wings-overlay" src="/images/badges/recursed_flair.png" alt="Wings earned" />
              {/if}
            </span>
          </td>
          <td>{candidate.badge.title}</td>
          <td>{candidate.stat}</td>
          <td>{candidate.value}</td>
          <td class="status-cell">
            {#if candidate.alreadyOwned}
              <span class="already-owned-tag">Already owned</span>
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{/snippet}

<svelte:head>
  <title>Ingress Plus &middot; Import Stats</title>
</svelte:head>

<div class="container">
  <h1>Import Stats</h1>

  <p>
    Paste a stat export from the game, review the badges it matches, and confirm to mark them
    as owned. More ways to import your stats will be added here over time.
  </p>

  <div class="method-tabs">
    {#each methods as method (method.id)}
      <button
        type="button"
        class:active={activeMethod === method.id}
        onclick={() => (activeMethod = method.id)}
      >
        {method.label}
      </button>
    {/each}
  </div>

  {#if !SKIP_AUTH_GATE_FOR_TESTING && $authData.isValid !== true}
    <Callout variant="warning">You need to be logged in to import stats.</Callout>
  {:else if activeMethod === 'text'}
    <p>Open your Agent Stats in the game, copy the full export, and paste it below.</p>

    <textarea
      bind:value={pasteText}
      placeholder="Paste your stat export here…"
      rows="12"
    ></textarea>

    <div class="actions">
      <button type="button" class="cta" disabled={!pasteText.trim()} onclick={handleParse}>
        Parse Export
      </button>
    </div>

    {#if result}
      {#if result.error}
        <Callout variant="error">{result.error}</Callout>
      {:else}
        <h2>Agent Information</h2>
        {@render statsTable(result.playerInfo, false)}

        {#if importCandidates.length > 0}
          <h2>Badges Ready to Import</h2>
          <p>
            Review the matches below to make sure they line up with what you see in the game,
            then confirm to mark these badges as owned.
          </p>
          {@render importTable(importCandidates)}
          <div class="actions">
            <button
              type="button"
              class="cta"
              disabled={importing || pendingCandidates.length === 0}
              onclick={handleImport}
            >
              {#if importing}
                Importing…
              {:else if pendingCandidates.length === 0}
                All Matched Badges Already Owned
              {:else}
                Import Stats to Badges
              {/if}
            </button>
          </div>
          {#if importing}
            <p class="import-progress" transition:slide={{ duration: 200 }}>
              <span class="spinner"></span>
              {currentlyImporting ? `Marking "${currentlyImporting}" as owned…` : 'Getting started…'}
            </p>
          {/if}
        {/if}

        <h2>Stats</h2>
        {@render statsTable(result.stats, true)}
      {/if}
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
    max-width: 800px;
    margin: auto;
    padding: 0 1em;
    line-height: 1.2em;
    margin-top: 2em;
  }
  h2 {
    text-shadow: 0 0 10px black;
    margin: 1em 0 0.5em;
  }
  table {
    width: 100%;
    margin: 1em 0 2em;
    border-collapse: collapse;
    background: rgba(14, 11, 28, 0.9);
    border: 3px double #5e5a75;
    border-radius: 8px;
    text-align: left;
  }
  th, td {
    padding: 0.4em 1em;
    vertical-align: middle;
  }
  td.badge-cell {
    width: 1%;
    padding-right: 0;
  }
  span.badge-wrapper {
    position: relative;
    display: inline-block;
  }
  td.badge-cell img {
    display: block;
  }
  td.badge-cell img.dimmed {
    opacity: 0.35;
  }
  tr.already-owned {
    opacity: 0.55;
  }
  span.already-owned-tag {
    font-size: 0.85em;
    color: rgba(255, 255, 255, 0.6);
    white-space: nowrap;
  }
  img.wings-overlay {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 65%;
    height: auto;
    pointer-events: none;
  }
  thead tr {
    border-bottom: 1px solid #5e5a75;
  }
  tbody tr:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  div.method-tabs {
    display: flex;
    justify-content: center;
    gap: 0.5em;
    margin: 1.5em 0;
  }
  div.method-tabs button {
    background: none;
    border: none;
    color: #fff;
    cursor: pointer;
    padding: 0.5em 0;
    font-size: 1em;
    border-bottom: 1px solid rgba(255, 255, 255, 0);
    transition: border 0.3s ease-in-out;
  }
  div.method-tabs button.active,
  div.method-tabs button:hover {
    border-bottom: 1px solid rgba(255, 255, 255, 1);
  }
  textarea {
    width: 100%;
    box-sizing: border-box;
    background: rgba(14, 11, 28, 0.9);
    border: 3px double #5e5a75;
    border-radius: 8px;
    color: #fff;
    font-family: monospace;
    font-size: 0.9em;
    padding: 0.75em;
    resize: vertical;
    margin-top: 1em;
  }
  div.actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 0.5em;
  }
  button.cta:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  p.import-progress {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.6em;
    color: rgba(255, 255, 255, 0.75);
    margin: 0.5em 0 0;
  }
  span.spinner {
    display: inline-block;
    width: 1em;
    height: 1em;
    flex-shrink: 0;
    border: 2px solid rgba(255, 255, 255, 0.25);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
