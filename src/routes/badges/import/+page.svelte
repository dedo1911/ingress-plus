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
  import { fetchAgentStats } from '$lib/statImport/agentStats.js'
  import { fetchTheGridStats } from '$lib/statImport/theGrid.js'
  import { fetchStatsTrackerProStats } from '$lib/statImport/statsTrackerPro.js'
  import Callout from '$lib/components/Callout.svelte'

  const { data } = $props()
  const { badges, theGridStatMatches, statsTrackerProStatMatches } = data

  // TEMPORARY: auth gate disabled for mobile testing - restore before shipping.
  const SKIP_AUTH_GATE_FOR_TESTING = true

  $effect(() => {
    if (!SKIP_AUTH_GATE_FOR_TESTING && browser && $authData.isValid === false) goto(resolve('/badges'))
  })

  // Each entry is a distinct way of getting stat data into the parser below.
  const methods = [
    { id: 'text', label: 'Import from Scanner Export' },
    { id: 'agent-stats', label: 'Import from Agent Stats' },
    { id: 'the-grid', label: 'Import from The Grid (RES)' },
    { id: 'stats-tracker-pro', label: 'Import from Stats Tracker Pro (RES)' }
  ]
  let activeMethod = $state('text')
  const switchMethod = (id) => {
    activeMethod = id
    result = null
  }

  let pasteText = $state('')
  let result = $state(null)
  let importing = $state(false)
  let currentlyImporting = $state('')

  const handleParse = () => {
    const parsed = parseTextExport(pasteText)
    result = parsed.error ? parsed : { ...parsed, stats: matchBadgesToStats(parsed.stats, badges) }
  }

  // API key handling shared by the Agent Stats and The Grid tabs below.
  // Each key can be saved to the user's own profile so it doesn't need to
  // be re-pasted on every visit. Letters/numbers only, mirroring the
  // pattern + max length enforced server-side on those fields.
  //
  // Once a key is saved it's never loaded back into the visible/editable
  // input - the box just shows disabled with a placeholder, and "Remove
  // Saved Key" is the only way to type a new one. This avoids both the
  // custom masking bugs a plain password field would have (misaligned
  // overlay, text still selectable) and ever re-displaying a previously-
  // saved key on screen.
  const sanitizeKey = (value, maxLength) => value.replace(/[^a-zA-Z0-9]/g, '').slice(0, maxLength)

  const AGENT_STATS_KEY_MAX_LENGTH = 20
  let apiKey = $state('')
  let showApiKeyHint = $state(false)
  let savingKey = $state(false)
  let removingKey = $state(false)
  let fetchingStats = $state(false)

  const savedApiKey = $derived($authData?.baseModel?.agentStatsApiKey || '')

  const saveApiKey = async () => {
    if (!$authData.isValid || !apiKey.trim()) return
    savingKey = true
    showApiKeyHint = false
    try {
      $authData.baseModel.agentStatsApiKey = apiKey.trim()
      await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
      authData.set($authData)
      apiKey = ''
      toast.push('API key saved to your profile.', { classes: ['successToast'] })
    } catch (err) {
      console.error(err)
      toast.push('Could not save your API key.', { classes: ['errorToast'] })
    } finally {
      savingKey = false
    }
  }

  const removeApiKey = async () => {
    if (!$authData.isValid) return
    removingKey = true
    try {
      $authData.baseModel.agentStatsApiKey = ''
      await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
      authData.set($authData)
      toast.push('Removed your saved API key.', { classes: ['successToast'] })
    } catch (err) {
      console.error(err)
      toast.push('Could not remove your saved API key.', { classes: ['errorToast'] })
    } finally {
      removingKey = false
    }
  }

  const handleFetchAgentStats = async () => {
    const keyToUse = savedApiKey || apiKey.trim()
    if (!keyToUse) return
    fetchingStats = true
    showApiKeyHint = false
    result = null
    try {
      const parsed = await fetchAgentStats(keyToUse)
      result = { ...parsed, stats: matchBadgesToStats(parsed.stats, badges) }
    } catch (err) {
      console.error(err)
      result = { error: err.message || 'Could not fetch your Agent Stats data.' }
    } finally {
      fetchingStats = false
    }
  }

  // The Grid API key handling - same pattern as Agent Stats above, saved
  // to a separate theGridApiKey field on the user's profile.
  const THE_GRID_KEY_MAX_LENGTH = 64
  let theGridApiKey = $state('')
  let showTheGridApiKeyHint = $state(false)
  let savingGridKey = $state(false)
  let removingGridKey = $state(false)
  let fetchingGridStats = $state(false)

  const savedTheGridApiKey = $derived($authData?.baseModel?.theGridApiKey || '')

  const saveTheGridApiKey = async () => {
    if (!$authData.isValid || !theGridApiKey.trim()) return
    savingGridKey = true
    showTheGridApiKeyHint = false
    try {
      $authData.baseModel.theGridApiKey = theGridApiKey.trim()
      await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
      authData.set($authData)
      theGridApiKey = ''
      toast.push('API key saved to your profile.', { classes: ['successToast'] })
    } catch (err) {
      console.error(err)
      toast.push('Could not save your API key.', { classes: ['errorToast'] })
    } finally {
      savingGridKey = false
    }
  }

  const removeTheGridApiKey = async () => {
    if (!$authData.isValid) return
    removingGridKey = true
    try {
      $authData.baseModel.theGridApiKey = ''
      await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
      authData.set($authData)
      toast.push('Removed your saved API key.', { classes: ['successToast'] })
    } catch (err) {
      console.error(err)
      toast.push('Could not remove your saved API key.', { classes: ['errorToast'] })
    } finally {
      removingGridKey = false
    }
  }

  const handleFetchTheGrid = async () => {
    const keyToUse = savedTheGridApiKey || theGridApiKey.trim()
    if (!keyToUse) return
    fetchingGridStats = true
    showTheGridApiKeyHint = false
    result = null
    try {
      const parsed = await fetchTheGridStats(keyToUse, theGridStatMatches)
      result = { ...parsed, stats: matchBadgesToStats(parsed.stats, badges) }
    } catch (err) {
      console.error(err)
      result = { error: err.message || 'Could not fetch your Grid stats.' }
    } finally {
      fetchingGridStats = false
    }
  }

  // Stats Tracker Pro API key handling - same pattern as Agent Stats/The
  // Grid above, saved to a separate statsTrackerProApiKey field.
  const STATS_TRACKER_PRO_KEY_MAX_LENGTH = 32
  let statsTrackerProApiKey = $state('')
  let showStatsTrackerProApiKeyHint = $state(false)
  let savingStatsTrackerProKey = $state(false)
  let removingStatsTrackerProKey = $state(false)
  let fetchingStatsTrackerProStats = $state(false)

  const savedStatsTrackerProApiKey = $derived($authData?.baseModel?.statsTrackerProApiKey || '')

  const saveStatsTrackerProApiKey = async () => {
    if (!$authData.isValid || !statsTrackerProApiKey.trim()) return
    savingStatsTrackerProKey = true
    showStatsTrackerProApiKeyHint = false
    try {
      $authData.baseModel.statsTrackerProApiKey = statsTrackerProApiKey.trim()
      await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
      authData.set($authData)
      statsTrackerProApiKey = ''
      toast.push('API key saved to your profile.', { classes: ['successToast'] })
    } catch (err) {
      console.error(err)
      toast.push('Could not save your API key.', { classes: ['errorToast'] })
    } finally {
      savingStatsTrackerProKey = false
    }
  }

  const removeStatsTrackerProApiKey = async () => {
    if (!$authData.isValid) return
    removingStatsTrackerProKey = true
    try {
      $authData.baseModel.statsTrackerProApiKey = ''
      await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
      authData.set($authData)
      toast.push('Removed your saved API key.', { classes: ['successToast'] })
    } catch (err) {
      console.error(err)
      toast.push('Could not remove your saved API key.', { classes: ['errorToast'] })
    } finally {
      removingStatsTrackerProKey = false
    }
  }

  const handleFetchStatsTrackerPro = async () => {
    const keyToUse = savedStatsTrackerProApiKey || statsTrackerProApiKey.trim()
    if (!keyToUse) return
    fetchingStatsTrackerProStats = true
    showStatsTrackerProApiKeyHint = false
    result = null
    try {
      const parsed = await fetchStatsTrackerProStats(keyToUse, statsTrackerProStatMatches)
      result = { ...parsed, stats: matchBadgesToStats(parsed.stats, badges) }
    } catch (err) {
      console.error(err)
      result = { error: err.message || 'Could not fetch your Stats Tracker Pro data.' }
    } finally {
      fetchingStatsTrackerProStats = false
    }
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
    Here you can provide an existing Stat Export, review the badges it matches, and confirm to mark them
    as owned. This will not catch Character Badges or other Badges that are awarded without a dedicated
    stat line.
  </p>

  <div class="method-tabs">
    {#each methods as method (method.id)}
      <button
        type="button"
        class:active={activeMethod === method.id}
        onclick={() => switchMethod(method.id)}
      >
        {method.label}
      </button>
    {/each}
  </div>

  {#if !SKIP_AUTH_GATE_FOR_TESTING && $authData.isValid !== true}
    <Callout variant="warning">You need to be logged in to import stats.</Callout>
  {:else}
    {#if activeMethod === 'text'}
      <p>Open your profile in the Scanner and export your current ALL TIME stats by tapping on the
    <img src="/images/badges/import/statExport.png" alt="" class="inline-icon" /> Export button above the first row of Badges. Paste the copied text into the box below as
    is and hit the "Parse Export" button to check which Badges you have earned.</p>

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
    {:else if activeMethod === 'agent-stats'}
      <p>
        If you use Agent Stats you can generate an API key to automatically import your latest Agent Stat upload.
        You can find or generate an API Key for your account settings from the
        <a href="https://www.agent-stats.com/preferences.php" target="_blank" rel="noopener noreferrer">Agent Stats Preferences page</a>.<br>
        <br>
        Once copied, paste your Agent Stats API key below. You can optionally save your API key for future use of this tool.
      </p>

      <div class="api-key-input">
        <input
          type="text"
          name="agentStatsApiKey"
          value={apiKey}
          disabled={!!savedApiKey}
          oninput={(e) => {
            const raw = e.currentTarget.value
            const sanitized = sanitizeKey(raw, AGENT_STATS_KEY_MAX_LENGTH)
            if (sanitized !== raw) showApiKeyHint = true
            e.currentTarget.value = sanitized
            apiKey = sanitized
          }}
          placeholder={savedApiKey ? 'Using API key saved to your profile. Remove to enter new API key' : 'Paste your Agent Stats API key'}
          autocomplete="off"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          maxlength={AGENT_STATS_KEY_MAX_LENGTH}
          pattern="[a-zA-Z0-9]*"
        />
      </div>
      {#if showApiKeyHint}
        <p class="api-key-hint" transition:slide={{ duration: 150 }}>
          Only letters (A-Z) and numbers are allowed, up to {AGENT_STATS_KEY_MAX_LENGTH} characters.
        </p>
      {/if}

      {#if $authData.isValid}
        <div class="key-persistence-actions">
          {#if savedApiKey}
            <button type="button" onclick={removeApiKey} disabled={removingKey}>
              {removingKey ? 'Removing…' : 'Remove Saved Key'}
            </button>
          {:else}
            <button type="button" onclick={saveApiKey} disabled={savingKey || !apiKey.trim()}>
              {savingKey ? 'Saving…' : 'Save API Key to My Profile'}
            </button>
          {/if}
        </div>
        {#if savedApiKey}
          <p class="saved-key-note">Using the API key saved to your profile.</p>
        {/if}
      {/if}

      <div class="actions">
        <button
          type="button"
          class="cta"
          disabled={(!savedApiKey && !apiKey.trim()) || fetchingStats}
          onclick={handleFetchAgentStats}
        >
          {fetchingStats ? 'Fetching…' : 'Fetch Stats'}
        </button>
      </div>
    {:else if activeMethod === 'the-grid'}
      <p>
        Resistance Agents can use The Grid to import their stats. Depending on how long and how regularly you have uploaded to The Grid
        this import may include more stats than other import methods.<br>
        <br>
        Paste your "Personal API key" from <a href="https://the-grid.org/settings" target="_blank" rel="noopener noreferrer">The Grid</a> below.
        You can optionally save your API key for future use of this tool.
      </p>

      <div class="api-key-input">
        <input
          type="text"
          name="theGridApiKey"
          value={theGridApiKey}
          disabled={!!savedTheGridApiKey}
          oninput={(e) => {
            const raw = e.currentTarget.value
            const sanitized = sanitizeKey(raw, THE_GRID_KEY_MAX_LENGTH)
            if (sanitized !== raw) showTheGridApiKeyHint = true
            e.currentTarget.value = sanitized
            theGridApiKey = sanitized
          }}
          placeholder={savedTheGridApiKey ? 'Using API key saved to your profile. Remove to enter new API key' : 'Paste your Grid API key'}
          autocomplete="off"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          maxlength={THE_GRID_KEY_MAX_LENGTH}
          pattern="[a-zA-Z0-9]*"
        />
      </div>
      {#if showTheGridApiKeyHint}
        <p class="api-key-hint" transition:slide={{ duration: 150 }}>
          Only letters (A-Z) and numbers are allowed, up to {THE_GRID_KEY_MAX_LENGTH} characters.
        </p>
      {/if}

      {#if $authData.isValid}
        <div class="key-persistence-actions">
          {#if savedTheGridApiKey}
            <button type="button" onclick={removeTheGridApiKey} disabled={removingGridKey}>
              {removingGridKey ? 'Removing…' : 'Remove Saved Key'}
            </button>
          {:else}
            <button type="button" onclick={saveTheGridApiKey} disabled={savingGridKey || !theGridApiKey.trim()}>
              {savingGridKey ? 'Saving…' : 'Save API Key to My Profile'}
            </button>
          {/if}
        </div>
        {#if savedTheGridApiKey}
          <p class="saved-key-note">Using the API key saved to your profile.</p>
        {/if}
      {/if}

      <div class="actions">
        <button
          type="button"
          class="cta"
          disabled={(!savedTheGridApiKey && !theGridApiKey.trim()) || fetchingGridStats}
          onclick={handleFetchTheGrid}
        >
          {fetchingGridStats ? 'Fetching…' : 'Fetch Stats'}
        </button>
      </div>
    {:else if activeMethod === 'stats-tracker-pro'}
      <p>
        Resistance Agents can use Stats Tracker Pro to import their stats.
        Generate a User API key from your Account Settings on <a href="https://the-grid.blue" target="_blank" rel="noopener noreferrer">Stats Tracker Pro</a> below.
        You can optionally save your API key for future use of this tool.
      </p>

      <div class="api-key-input">
        <input
          type="text"
          name="statsTrackerProApiKey"
          value={statsTrackerProApiKey}
          disabled={!!savedStatsTrackerProApiKey}
          oninput={(e) => {
            const raw = e.currentTarget.value
            const sanitized = sanitizeKey(raw, STATS_TRACKER_PRO_KEY_MAX_LENGTH)
            if (sanitized !== raw) showStatsTrackerProApiKeyHint = true
            e.currentTarget.value = sanitized
            statsTrackerProApiKey = sanitized
          }}
          placeholder={savedStatsTrackerProApiKey ? 'Using API key saved to your profile. Remove to enter new API key' : 'Paste your Stats Tracker Pro API key'}
          autocomplete="off"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          maxlength={STATS_TRACKER_PRO_KEY_MAX_LENGTH}
          pattern="[a-zA-Z0-9]*"
        />
      </div>
      {#if showStatsTrackerProApiKeyHint}
        <p class="api-key-hint" transition:slide={{ duration: 150 }}>
          Only letters (A-Z) and numbers are allowed, up to {STATS_TRACKER_PRO_KEY_MAX_LENGTH} characters.
        </p>
      {/if}

      {#if $authData.isValid}
        <div class="key-persistence-actions">
          {#if savedStatsTrackerProApiKey}
            <button type="button" onclick={removeStatsTrackerProApiKey} disabled={removingStatsTrackerProKey}>
              {removingStatsTrackerProKey ? 'Removing…' : 'Remove Saved Key'}
            </button>
          {:else}
            <button type="button" onclick={saveStatsTrackerProApiKey} disabled={savingStatsTrackerProKey || !statsTrackerProApiKey.trim()}>
              {savingStatsTrackerProKey ? 'Saving…' : 'Save API Key to My Profile'}
            </button>
          {/if}
        </div>
        {#if savedStatsTrackerProApiKey}
          <p class="saved-key-note">Using the API key saved to your profile.</p>
        {/if}
      {/if}

      <div class="actions">
        <button
          type="button"
          class="cta"
          disabled={(!savedStatsTrackerProApiKey && !statsTrackerProApiKey.trim()) || fetchingStatsTrackerProStats}
          onclick={handleFetchStatsTrackerPro}
        >
          {fetchingStatsTrackerProStats ? 'Fetching…' : 'Fetch Stats'}
        </button>
      </div>
    {/if}

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
  img.inline-icon {
    height: 1em;
    width: auto;
    vertical-align: middle;
    border-radius: 3px;
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
    width: fit-content;
    margin: 1.5em auto;
    border: 3px double #5e5a75;
    border-radius: 8px;
    overflow: hidden;
  }
  div.method-tabs button {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.75);
    cursor: pointer;
    padding: 0.6em 1.2em;
    font-size: 1em;
    transition: background 0.3s ease-in-out, color 0.3s ease-in-out;
  }
  div.method-tabs button:not(:last-child) {
    border-right: 1px solid #5e5a75;
  }
  div.method-tabs button.active {
    background: rgba(94, 90, 117, 0.4);
    color: #fff;
  }
  div.method-tabs button:not(.active):hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
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
  div.api-key-input {
    display: flex;
    align-items: stretch;
    background: rgba(14, 11, 28, 0.9);
    border: 3px double #5e5a75;
    border-radius: 8px;
    margin-top: 1em;
    overflow: hidden;
  }
  div.api-key-input input {
    width: 100%;
    box-sizing: border-box;
    background: none;
    border: none;
    color: #fff;
    font-family: monospace;
    font-size: 0.9em;
    padding: 0.75em;
    outline: none;
  }
  div.api-key-input input:disabled {
    color: rgba(255, 255, 255, 0.5);
    cursor: not-allowed;
  }
  p.api-key-hint {
    color: rgba(255, 176, 176, 0.85);
    font-size: 0.85em;
    margin: 0.5em 0 0;
  }
  div.key-persistence-actions {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 0.75em;
    margin-top: 0.75em;
  }
  div.key-persistence-actions button {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.75);
    cursor: pointer;
    text-decoration: underline;
    font-size: 0.9em;
    padding: 0;
  }
  div.key-persistence-actions button:hover {
    color: #fff;
  }
  div.key-persistence-actions button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    text-decoration: none;
  }
  p.saved-key-note {
    text-align: right;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.85em;
    margin: 0.35em 0 0;
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
