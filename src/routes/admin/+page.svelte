<script>
  import { tick } from 'svelte'
  import { browser } from '$app/environment'
  import { pbAdmin } from '$lib/pocketbase/admin.js'
  import { pb } from '$lib/pocketbase/index.js'
  import { authData } from '$lib/stores'
  import { resolve } from '$app/paths'
  import { toast } from '@zerodevx/svelte-toast'
  import Callout from '$lib/components/Callout.svelte'
  import Modal from '$lib/components/Modal.svelte'

  // pbAdmin.authStore is PocketBase's own store, not a Svelte one - it has
  // to be mirrored into local state via onChange to react to it here.
  let isAuthenticated = $state(pbAdmin.authStore.isValid)
  let adminEmail = $state(pbAdmin.authStore.record?.email || '')

  $effect(() => {
    return pbAdmin.authStore.onChange((token, record) => {
      isAuthenticated = pbAdmin.authStore.isValid
      adminEmail = record?.email || ''
    }, true)
  })

  let email = $state('')
  let password = $state('')
  let loggingIn = $state(false)
  let loginError = $state('')

  const handleLogin = async () => {
    loginError = ''
    loggingIn = true
    try {
      await pbAdmin.collection('_superusers').authWithPassword(email, password)
      password = ''
    } catch (err) {
      console.error(err)
      loginError = 'Invalid email or password.'
    } finally {
      loggingIn = false
    }
  }

  const handleLogout = () => {
    pbAdmin.authStore.clear()
  }

  // Each admin feature lives in its own tab, mirroring the method-tabs
  // pattern on /badges/import.
  const tabs = [
    { id: 'impersonation', label: 'Impersonation' },
    { id: 'emails', label: 'Emails' },
    { id: 'flags', label: 'Feature Flags' }
  ]
  let activeTab = $state('impersonation')
  const switchTab = (id) => { activeTab = id }

  // Feature flags: toggles existing feature_flags records only. Creating a
  // new flag name here wouldn't do anything - $lib/featureFlags.js and
  // +layout.js only react to the specific names the app code already
  // checks for, so authoring a new flag is a code change, not an admin
  // panel job.
  let featureFlags = $state([])
  let loadingFlags = $state(false)

  const loadFeatureFlags = async () => {
    loadingFlags = true
    try {
      featureFlags = await pbAdmin.collection('feature_flags').getFullList({ sort: 'name' })
    } catch (err) {
      console.error(err)
    } finally {
      loadingFlags = false
    }
  }

  const toggleFlag = async (flag) => {
    const next = !flag.enabled
    flag.enabled = next
    flag.busy = true
    try {
      await pbAdmin.collection('feature_flags').update(flag.id, { enabled: next })
      toast.push(`"${flag.name}" is now ${next ? 'enabled' : 'disabled'}.`, { classes: ['successToast'] })
    } catch (err) {
      console.error(err)
      flag.enabled = !next
      toast.push(`Could not update "${flag.name}".`, { classes: ['errorToast'] })
    } finally {
      flag.busy = false
    }
  }

  // Impersonation PoC: PocketBase's impersonate endpoint (superuser-only)
  // mints a real auth token for the target user. It comes back on a
  // throwaway in-memory client, so the token/record are lifted out of that
  // and saved into the SITE's own `pb` client - that's what actually makes
  // the rest of the app (Header, badges, profile) render as that user.
  // This intentionally replaces whatever session `pb` currently holds
  // (including the admin's own regular account, if logged in as themselves
  // in the same browser) - that's the point of "become this user".
  const IMPERSONATE_DURATION_SECONDS = 30 * 60

  // Persisted (not just in-memory) so the "currently impersonating" state
  // and the way back to the admin's own account survive navigating away
  // to actually browse as the impersonated user, and page reloads.
  const IMPERSONATION_STORAGE_KEY = 'ip_impersonation_prior_session'

  const readImpersonation = () => {
    if (!browser) return null
    try {
      const raw = localStorage.getItem(IMPERSONATION_STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  const writeImpersonation = (state) => {
    if (browser) {
      if (state) {
        localStorage.setItem(IMPERSONATION_STORAGE_KEY, JSON.stringify(state))
      } else {
        localStorage.removeItem(IMPERSONATION_STORAGE_KEY)
      }
    }
    impersonation = state
  }

  // { username, priorToken, priorRecord } while impersonating, else null.
  // priorToken/priorRecord are null if there was nothing to return to.
  let impersonation = $state(readImpersonation())

  $effect(() => {
    return pb.authStore.onChange((token, record) => {
      // If the main session no longer matches what we think we're
      // impersonating - e.g. someone used the regular site's Logout
      // button, or the (non-refreshable) impersonation token expired on
      // its own - the stored marker is stale. Drop it rather than keep
      // showing an impersonation state that no longer reflects reality.
      if (impersonation && (!pb.authStore.isValid || record?.username !== impersonation.username)) {
        writeImpersonation(null)
      }
    }, true)
  })

  let searchQuery = $state('')
  let searchResults = $state([])
  let searching = $state(false)
  let searchError = $state('')

  let impersonatingId = $state('')
  let impersonateError = $state('')

  const searchUsers = async () => {
    const q = searchQuery.trim()
    if (!q) return
    searching = true
    searchError = ''
    try {
      const result = await pbAdmin.collection('users').getList(1, 10, {
        filter: pbAdmin.filter('username ~ {:q} || email ~ {:q}', { q })
      })
      searchResults = result.items
    } catch (err) {
      console.error(err)
      searchError = 'Could not search users.'
    } finally {
      searching = false
    }
  }

  const impersonate = async (user) => {
    impersonatingId = user.id
    impersonateError = ''
    try {
      // If already impersonating someone, keep the ORIGINAL prior session
      // rather than the one currently active, so switching targets doesn't
      // chain - Stop Impersonating should always return to the admin's own
      // account, not to a previous impersonation.
      const priorToken = impersonation ? impersonation.priorToken : (pb.authStore.isValid ? pb.authStore.token : null)
      const priorRecord = impersonation ? impersonation.priorRecord : (pb.authStore.isValid ? pb.authStore.record : null)

      const impersonatedClient = await pbAdmin.collection('users').impersonate(user.id, IMPERSONATE_DURATION_SECONDS)
      pb.authStore.save(impersonatedClient.authStore.token, impersonatedClient.authStore.record)
      authData.set(pb.authStore)

      writeImpersonation({ username: user.username, priorToken, priorRecord })
    } catch (err) {
      console.error(err)
      impersonateError = `Could not impersonate ${user.username}.`
    } finally {
      impersonatingId = ''
    }
  }

  const stopImpersonating = () => {
    if (impersonation?.priorToken) {
      pb.authStore.save(impersonation.priorToken, impersonation.priorRecord)
    } else {
      pb.authStore.clear()
    }
    authData.set(pb.authStore)
    writeImpersonation(null)
  }

  // Email campaigns. Targeting is a list of dynamically-added rules that
  // are OR'd together (e.g. "this one user" + "everyone in Resistance" +
  // "all supporters"), optionally ANDed down further by requireOptIn.
  // Building/sending actually happens server-side (see ingress-plus-backend) -
  // this page only ever writes a draft/queued row or calls the send-test
  // route, both superuser-only.
  const FACTION_OPTIONS = [
    { value: 'enlightened', label: 'Enlightened' },
    { value: 'resistance', label: 'Resistance' },
    { value: 'machina', label: 'Machina' },
    { value: '', label: 'No Faction' }
  ]

  const RULE_TYPE_OPTIONS = [
    { value: 'all', label: 'All Users' },
    { value: 'faction', label: 'Faction(s)' },
    { value: 'supporter', label: 'Supporters' },
    { value: 'user', label: 'Specific Users' }
  ]

  let campaignSubject = $state('')
  let campaignBody = $state('')
  let requireOptIn = $state(true)
  let targetRules = $state([])
  let addRuleType = $state('all')

  // Recipient count preview, kept in sync with targeting rather than
  // computed reactively off them, so unrelated per-rule UI state (like
  // typing in a user search box) doesn't trigger a re-count - only calls
  // that actually change who's targeted do.
  let recipientCount = $state(null)
  let previewingCount = $state(false)
  let previewCountTimeout = null

  const schedulePreviewCount = () => {
    if (previewCountTimeout) clearTimeout(previewCountTimeout)
    if (targetRules.length === 0) {
      recipientCount = null
      return
    }
    previewCountTimeout = setTimeout(previewCount, 400)
  }

  const previewCount = async () => {
    previewingCount = true
    try {
      const result = await pbAdmin.send('/api/admin/campaigns/preview-count', {
        method: 'POST',
        body: { targeting: buildTargeting() }
      })
      recipientCount = result.count
    } catch (err) {
      console.error(err)
      recipientCount = null
    } finally {
      previewingCount = false
    }
  }

  // Local {#each} keys for target rules. Deliberately not crypto.randomUUID():
  // that API only exists in secure contexts (https / localhost), so it throws
  // when the dev server is opened from a phone over plain http - which made
  // Add Target and draft restoring silently do nothing on mobile.
  let ruleIdCounter = 0
  const nextRuleId = () => `rule-${++ruleIdCounter}`

  const addRule = () => {
    targetRules = [...targetRules, {
      id: nextRuleId(),
      type: addRuleType,
      factions: [],
      users: [],
      searchQuery: '',
      searchResults: [],
      searching: false
    }]
    schedulePreviewCount()
  }

  const removeRule = (id) => {
    targetRules = targetRules.filter(r => r.id !== id)
    schedulePreviewCount()
  }

  const toggleRuleFaction = (rule, value) => {
    rule.factions = rule.factions.includes(value)
      ? rule.factions.filter(f => f !== value)
      : [...rule.factions, value]
    schedulePreviewCount()
  }

  const searchUsersForRule = async (rule) => {
    const q = rule.searchQuery.trim()
    if (!q) return
    rule.searching = true
    try {
      const result = await pbAdmin.collection('users').getList(1, 10, {
        filter: pbAdmin.filter('username ~ {:q} || email ~ {:q}', { q })
      })
      rule.searchResults = result.items
    } catch (err) {
      console.error(err)
    } finally {
      rule.searching = false
    }
  }

  const addUserToRule = (rule, user) => {
    if (!rule.users.some(u => u.id === user.id)) {
      rule.users = [...rule.users, user]
    }
    rule.searchResults = []
    rule.searchQuery = ''
    schedulePreviewCount()
  }

  const removeUserFromRule = (rule, userId) => {
    rule.users = rule.users.filter(u => u.id !== userId)
    schedulePreviewCount()
  }

  // Trims each rule down to only the fields the backend cares about -
  // local-only UI state (search query/results) never gets sent.
  const buildTargeting = () => ({
    requireOptIn,
    rules: targetRules.map(r => {
      if (r.type === 'faction') return { type: 'faction', factions: r.factions }
      if (r.type === 'user') return { type: 'user', userIds: r.users.map(u => u.id) }
      return { type: r.type }
    })
  })

  // Per-recipient placeholders, substituted server-side when a campaign is
  // actually sent (see RenderPlaceholders in the backend). Inserted here at
  // the cursor position of whichever of subject/body was last focused.
  const PLACEHOLDERS = ['%username%', '%faction%', '%userEmail%']

  let subjectInputEl = $state(null)
  let bodyInputEl = $state(null)
  let lastFocusedField = $state('body')

  const insertPlaceholder = async (token) => {
    const targetEl = lastFocusedField === 'subject' ? subjectInputEl : bodyInputEl
    const currentValue = lastFocusedField === 'subject' ? campaignSubject : campaignBody
    if (!targetEl) return

    const start = targetEl.selectionStart ?? currentValue.length
    const end = targetEl.selectionEnd ?? start
    const newValue = currentValue.slice(0, start) + token + currentValue.slice(end)

    if (lastFocusedField === 'subject') {
      campaignSubject = newValue
    } else {
      campaignBody = newValue
    }

    await tick()
    targetEl.focus()
    const newPos = start + token.length
    targetEl.setSelectionRange(newPos, newPos)
  }

  let savingCampaign = $state(false)
  let sendingCampaign = $state(false)
  let sendingTest = $state(false)
  // All three campaign actions share one lock: letting e.g. Save Draft and
  // Send Campaign run at the same time could create two separate records
  // for the same composed email.
  const campaignBusy = $derived(savingCampaign || sendingCampaign || sendingTest)
  let campaignError = $state('')
  let campaignSuccess = $state('')

  let campaigns = $state([])
  let loadingCampaigns = $state(false)

  const loadCampaigns = async () => {
    loadingCampaigns = true
    try {
      campaigns = await pbAdmin.collection('email_campaigns').getFullList({ sort: '-created' })
    } catch (err) {
      console.error(err)
    } finally {
      loadingCampaigns = false
    }
  }

  $effect(() => {
    if (isAuthenticated) {
      loadCampaigns()
      loadFeatureFlags()
    }
  })

  // Draft/failed campaigns never went out (or fully failed to), so they're
  // safe to remove; anything queued/sending/sent is left alone - deleting
  // those would just hide history of an email that was actually sent.
  const isDeletable = (c) => c.status === 'draft' || c.status === 'failed'

  const promptDeleteCampaign = (c) => {
    c.confirmingDelete = true
    c.deleteConfirmLocked = true
    setTimeout(() => {
      c.deleteConfirmLocked = false
    }, 1000) // Delay to avoid misclick, matching the un-verify confirm on agent/settings
  }

  const cancelDeleteCampaign = (c) => {
    c.confirmingDelete = false
  }

  const deleteCampaign = async (c) => {
    c.deleting = true
    try {
      await pbAdmin.collection('email_campaigns').delete(c.id)
      if (editingCampaignId === c.id) editingCampaignId = null
      toast.push('Campaign deleted.', { classes: ['successToast'] })
      await loadCampaigns()
    } catch (err) {
      console.error(err)
      c.deleting = false
      c.confirmingDelete = false
      toast.push('Could not delete the campaign.', { classes: ['errorToast'] })
    }
  }

  // Viewing a failed campaign's saved error - an admin can then use the
  // existing "load into composer" flow (clicking the row) to adjust and
  // resend it as a new draft.
  let viewingErrorCampaign = $state(null)
  let showErrorModal = $state(false)

  const viewCampaignError = (c) => {
    viewingErrorCampaign = c
    showErrorModal = true
  }

  // Set while the composer holds a draft loaded from history, so Save
  // Draft/Send update that same record instead of creating a duplicate.
  // Cleared once a campaign is actually sent/queued (editing a record that
  // left "draft" status wouldn't make sense) or the admin starts fresh.
  let editingCampaignId = $state(null)

  const clearComposer = () => {
    campaignSubject = ''
    campaignBody = ''
    requireOptIn = true
    targetRules = []
    editingCampaignId = null
    recipientCount = null
    campaignError = ''
    campaignSuccess = ''
  }

  // Loads a history entry back into the composer. Drafts are restored for
  // continued editing (editingCampaignId set, so saving/sending updates the
  // same record); anything else is loaded as a starting template for a new
  // campaign instead, since a queued/sending/sent record shouldn't be
  // mutated after the fact.
  const loadCampaignIntoComposer = async (campaign) => {
    campaignSubject = campaign.subject
    campaignBody = campaign.body
    const targeting = campaign.targeting || {}
    requireOptIn = !!targeting.requireOptIn

    const rules = []
    for (const rule of targeting.rules || []) {
      if (rule.type === 'user' && rule.userIds?.length) {
        let users = []
        try {
          const idFilter = rule.userIds.map((_, i) => `id = {:id${i}}`).join(' || ')
          const idParams = Object.fromEntries(rule.userIds.map((id, i) => [`id${i}`, id]))
          users = await pbAdmin.collection('users').getFullList({ filter: pbAdmin.filter(idFilter, idParams) })
        } catch (err) {
          console.error(err)
        }
        rules.push({ id: nextRuleId(), type: 'user', factions: [], users, searchQuery: '', searchResults: [], searching: false })
      } else if (rule.type === 'faction') {
        rules.push({ id: nextRuleId(), type: 'faction', factions: rule.factions || [], users: [], searchQuery: '', searchResults: [], searching: false })
      } else {
        rules.push({ id: nextRuleId(), type: rule.type, factions: [], users: [], searchQuery: '', searchResults: [], searching: false })
      }
    }
    targetRules = rules

    campaignError = ''
    if (campaign.status === 'draft') {
      editingCampaignId = campaign.id
      campaignSuccess = `Editing draft "${campaign.subject || '(no subject)'}".`
    } else {
      editingCampaignId = null
      campaignSuccess = `Loaded "${campaign.subject || '(no subject)'}" as a new draft - it won't overwrite the original.`
    }

    schedulePreviewCount()
  }

  const saveDraft = async () => {
    campaignError = ''
    campaignSuccess = ''
    savingCampaign = true
    try {
      const payload = {
        subject: campaignSubject,
        body: campaignBody,
        targeting: buildTargeting(),
        status: 'draft'
      }
      if (editingCampaignId) {
        await pbAdmin.collection('email_campaigns').update(editingCampaignId, payload)
        campaignSuccess = 'Draft updated.'
      } else {
        const record = await pbAdmin.collection('email_campaigns').create(payload)
        editingCampaignId = record.id
        campaignSuccess = 'Saved as draft.'
      }
      await loadCampaigns()
    } catch (err) {
      console.error(err)
      if (err?.status === 409) {
        // The backend refused because this record already left the
        // draft/queued stage (e.g. it was sent from another tab).
        // Detach so the next save creates a fresh record instead of
        // trying to rewrite a sent campaign's history.
        campaignError = 'This campaign was already sent, so it can\'t be edited - saving again will store your text as a new draft.'
        editingCampaignId = null
        await loadCampaigns()
      } else {
        campaignError = 'Could not save the campaign.'
      }
    } finally {
      savingCampaign = false
    }
  }

  // Emails going to 50 or fewer people are sent right away; anything
  // bigger is left "queued" for the backend's cron job to pick up within a
  // few minutes, so a large send doesn't block the admin panel on a long
  // request. The recipient count is re-resolved fresh here (not read from
  // the debounced preview) so the instant-vs-queue decision is never based
  // on stale data.
  const INSTANT_SEND_THRESHOLD = 50

  const sendCampaign = async () => {
    campaignError = ''
    campaignSuccess = ''
    sendingCampaign = true
    try {
      const targeting = buildTargeting()
      const { count } = await pbAdmin.send('/api/admin/campaigns/preview-count', {
        method: 'POST',
        body: { targeting }
      })

      const payload = { subject: campaignSubject, body: campaignBody, targeting, status: 'queued' }
      if (!editingCampaignId) {
        // Create as an inert draft first, remember its id, and only then
        // flip it to "queued" below. If any of these calls fail (even with
        // the work done server-side but the response lost), a retry
        // re-targets this same record instead of creating a second queued
        // campaign - the worst possible orphan is a draft, which never
        // sends. A duplicate "queued" record would email everyone twice.
        const draft = await pbAdmin.collection('email_campaigns').create({ ...payload, status: 'draft' })
        editingCampaignId = draft.id
      }
      const record = await pbAdmin.collection('email_campaigns').update(editingCampaignId, payload)

      if (count <= INSTANT_SEND_THRESHOLD) {
        const result = await pbAdmin.send(`/api/admin/campaigns/${record.id}/dispatch`, { method: 'POST' })
        campaignSuccess = `Sent instantly to ${result.recipientCount} recipient${result.recipientCount === 1 ? '' : 's'}.`
      } else {
        campaignSuccess = `Queued for ${count} recipients - a background job dispatches queued campaigns every few minutes.`
      }
      // The record is no longer a draft once queued/sent - further edits
      // in the composer should start a new campaign, not mutate this one.
      editingCampaignId = null
      await loadCampaigns()
    } catch (err) {
      console.error(err)
      if (err?.status === 409) {
        // Not a failure: either the cron claimed the campaign in the moment
        // between queueing it and the dispatch call, or a retried send found
        // it already sent. Either way it's handled - retrying would only
        // risk sending it twice.
        campaignSuccess = 'This campaign was already picked up and is being (or has been) sent - see the history below.'
        editingCampaignId = null
        await loadCampaigns()
      } else {
        campaignError = 'Could not send the campaign. Retrying is safe - it will not send duplicate emails.'
      }
    } finally {
      sendingCampaign = false
    }
  }

  const sendTest = async () => {
    campaignError = ''
    campaignSuccess = ''
    sendingTest = true
    try {
      await pbAdmin.send('/api/admin/campaigns/send-test', {
        method: 'POST',
        body: { subject: campaignSubject, html: campaignBody }
      })
      campaignSuccess = `Test email sent to ${adminEmail}.`
    } catch (err) {
      console.error(err)
      campaignError = 'Could not send the test email.'
    } finally {
      sendingTest = false
    }
  }
</script>

<svelte:head>
  <title>Ingress Plus &middot; Admin</title>
</svelte:head>

<div class="page">
  <h1>Admin Panel</h1>

  {#if isAuthenticated}
    <div class="card">
      <p>Logged in as <strong>{adminEmail}</strong>.</p>
      <button type="button" class="cta" onclick={handleLogout}>Log Out</button>
    </div>

    {#if impersonation}
      <div class="card impersonation-banner">
        <p>
          Currently impersonating <strong>{impersonation.username}</strong>.
          <a href={resolve('/agent')}>Go to their profile &rarr;</a>
        </p>
        <button type="button" class="cta" onclick={stopImpersonating}>Stop Impersonating</button>
      </div>
    {/if}

    <div class="admin-tabs">
      {#each tabs as tab (tab.id)}
        <button
          type="button"
          class:active={activeTab === tab.id}
          onclick={() => switchTab(tab.id)}
        >
          {tab.label}
        </button>
      {/each}
    </div>

    {#if activeTab === 'impersonation'}
      <div class="card">
        <h2>Impersonate a User</h2>
        <form class="search-row" onsubmit={(e) => { e.preventDefault(); searchUsers() }}>
          <input type="text" bind:value={searchQuery} placeholder="Search by username or email…" />
          <button type="submit" class="cta" disabled={searching || !searchQuery.trim()}>
            {searching ? 'Searching…' : 'Search'}
          </button>
        </form>

        {#if searchError}
          <Callout variant="error">{searchError}</Callout>
        {/if}
        {#if impersonateError}
          <Callout variant="error">{impersonateError}</Callout>
        {/if}

        {#if searchResults.length > 0}
          <ul class="results">
            {#each searchResults as user (user.id)}
              <li>
                <img src="{user.avatar}" alt="" onerror={(e) => (e.currentTarget.style.visibility = 'hidden')} />
                <div class="user-info">
                  <strong>{user.username}</strong>
                  <span>{user.email}</span>
                </div>
                <button
                  type="button"
                  class="cta"
                  disabled={impersonatingId === user.id}
                  onclick={() => impersonate(user)}
                >
                  {impersonatingId === user.id ? 'Impersonating…' : 'Impersonate'}
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {:else if activeTab === 'emails'}
      <div class="card">
        <div class="composer-header">
          <h2>Send an Email Campaign</h2>
          {#if editingCampaignId}
            <button type="button" class="new-campaign-link" onclick={clearComposer}>+ New Campaign</button>
          {/if}
        </div>
        {#if editingCampaignId}
          <p class="editing-note">Editing a saved draft - Save Draft will update it instead of creating a new one.</p>
        {/if}

        <label>
          Subject
          <input
            type="text"
            bind:value={campaignSubject}
            bind:this={subjectInputEl}
            onfocus={() => (lastFocusedField = 'subject')}
            placeholder="Subject line…"
          />
        </label>
        <label>
          Body (HTML)
          <textarea
            bind:value={campaignBody}
            bind:this={bodyInputEl}
            onfocus={() => (lastFocusedField = 'body')}
            rows="8"
            placeholder="<p>Hello Agent...</p>"
          ></textarea>
        </label>

        <div class="placeholder-row">
          <span>Insert placeholder:</span>
          {#each PLACEHOLDERS as token (token)}
            <button type="button" class="placeholder-button" onclick={() => insertPlaceholder(token)}>{token}</button>
          {/each}
        </div>

        <div class="targeting">
          <h3>Send To</h3>

          {#each targetRules as rule (rule.id)}
            <div class="rule-card">
              <div class="rule-card-header">
                <strong>{RULE_TYPE_OPTIONS.find(o => o.value === rule.type)?.label}</strong>
                <button type="button" class="remove-rule" onclick={() => removeRule(rule.id)}>Remove</button>
              </div>

              {#if rule.type === 'faction'}
                <div class="faction-options">
                  {#each FACTION_OPTIONS as opt (opt.value)}
                    <label class="checkbox-label">
                      <input
                        type="checkbox"
                        checked={rule.factions.includes(opt.value)}
                        onchange={() => toggleRuleFaction(rule, opt.value)}
                      />
                      {opt.label}
                    </label>
                  {/each}
                </div>
              {:else if rule.type === 'user'}
                {#if rule.users.length > 0}
                  <div class="chips">
                    {#each rule.users as u (u.id)}
                      <span class="chip">
                        {u.username}
                        <button type="button" onclick={() => removeUserFromRule(rule, u.id)}>&times;</button>
                      </span>
                    {/each}
                  </div>
                {/if}
                <form class="search-row" onsubmit={(e) => { e.preventDefault(); searchUsersForRule(rule) }}>
                  <input type="text" bind:value={rule.searchQuery} placeholder="Search by username or email…" />
                  <button type="submit" class="cta" disabled={rule.searching || !rule.searchQuery.trim()}>
                    {rule.searching ? 'Searching…' : 'Search'}
                  </button>
                </form>
                {#if rule.searchResults.length > 0}
                  <ul class="results">
                    {#each rule.searchResults as u (u.id)}
                      <li>
                        <div class="user-info">
                          <strong>{u.username}</strong>
                          <span>{u.email}</span>
                        </div>
                        <button type="button" class="cta" onclick={() => addUserToRule(rule, u)}>Add</button>
                      </li>
                    {/each}
                  </ul>
                {/if}
              {/if}
            </div>
          {/each}

          <div class="add-rule-row">
            <select bind:value={addRuleType}>
              {#each RULE_TYPE_OPTIONS as opt (opt.value)}
                <option value={opt.value}>{opt.label}</option>
              {/each}
            </select>
            <button type="button" class="cta" onclick={addRule}>+ Add Target</button>
          </div>

          <label class="checkbox-label">
            <input type="checkbox" bind:checked={requireOptIn} onchange={schedulePreviewCount} />
            Only send to users who opted in to newsletters
          </label>

          {#if targetRules.length > 0}
            <p class="recipient-count">
              {#if previewingCount}
                Calculating recipients…
              {:else if recipientCount !== null}
                This will reach <strong>{recipientCount}</strong> recipient{recipientCount === 1 ? '' : 's'}
                &middot; {recipientCount <= INSTANT_SEND_THRESHOLD ? 'sent instantly' : 'will be queued'}
              {/if}
            </p>
          {/if}
        </div>

        {#if campaignError}
          <Callout variant="error">{campaignError}</Callout>
        {/if}
        {#if campaignSuccess}
          <Callout variant="warning">{campaignSuccess}</Callout>
        {/if}

        <div class="campaign-actions">
          <button type="button" class="cta" disabled={campaignBusy || !campaignSubject.trim()} onclick={sendTest}>
            {sendingTest ? 'Sending…' : 'Send Test Email to Me'}
          </button>
          <button type="button" class="cta" disabled={campaignBusy || !campaignSubject.trim()} onclick={saveDraft}>
            {savingCampaign ? 'Saving…' : 'Save Draft'}
          </button>
          <button type="button" class="cta" disabled={campaignBusy || !campaignSubject.trim() || targetRules.length === 0} onclick={sendCampaign}>
            {sendingCampaign ? 'Sending…' : 'Send Campaign'}
          </button>
        </div>
      </div>

      <div class="card">
        <h2>Campaign History</h2>
        {#if loadingCampaigns}
          <p>Loading…</p>
        {:else if campaigns.length === 0}
          <p>No campaigns yet.</p>
        {:else}
          <ul class="results">
            {#each campaigns as c (c.id)}
              <li class="campaign-row" class:editing={editingCampaignId === c.id}>
                <button type="button" class="campaign-row-button" onclick={() => loadCampaignIntoComposer(c)}>
                  <div class="user-info">
                    <strong>{c.subject || '(no subject)'}</strong>
                    <span>
                      {c.status}
                      {#if c.recipientCount}&middot; {c.recipientCount} recipients{/if}
                    </span>
                  </div>
                </button>
                <div class="campaign-row-actions">
                  <span class="status-badge status-{c.status}">{c.status}</span>
                  {#if c.status === 'failed'}
                    <button type="button" class="row-action" onclick={() => viewCampaignError(c)}>View Error</button>
                  {/if}
                  {#if isDeletable(c)}
                    {#if c.confirmingDelete}
                      <button
                        type="button"
                        class="row-action danger"
                        disabled={c.deleteConfirmLocked || c.deleting}
                        onclick={() => deleteCampaign(c)}
                      >
                        {c.deleting ? 'Deleting…' : 'Confirm Delete'}
                      </button>
                      <button type="button" class="row-action" disabled={c.deleting} onclick={() => cancelDeleteCampaign(c)}>
                        Cancel
                      </button>
                    {:else}
                      <button type="button" class="row-action danger" onclick={() => promptDeleteCampaign(c)}>Delete</button>
                    {/if}
                  {/if}
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <Modal bind:showModal={showErrorModal}>
        <div class="card error-modal">
          <h2>Campaign Error</h2>
          <p><strong>{viewingErrorCampaign?.subject || '(no subject)'}</strong></p>
          <p class="error-text">{viewingErrorCampaign?.error || 'No error message was recorded.'}</p>
          <button type="button" class="cta" onclick={() => (showErrorModal = false)}>Close</button>
        </div>
      </Modal>
    {:else if activeTab === 'flags'}
      <div class="card">
        <h2>Feature Flags</h2>
        {#if loadingFlags}
          <p>Loading…</p>
        {:else if featureFlags.length === 0}
          <p>No feature flags found.</p>
        {:else}
          {#each featureFlags as flag (flag.id)}
            <label class="checkbox-label">
              <input type="checkbox" checked={flag.enabled} disabled={flag.busy} onchange={() => toggleFlag(flag)} />
              {flag.name}
            </label>
          {/each}
        {/if}
      </div>
    {/if}
  {:else}
    <form class="card" onsubmit={(e) => { e.preventDefault(); handleLogin() }}>
      <label>
        Email
        <input type="email" bind:value={email} autocomplete="username" required />
      </label>
      <label>
        Password
        <input type="password" bind:value={password} autocomplete="current-password" required />
      </label>

      {#if loginError}
        <Callout variant="error">{loginError}</Callout>
      {/if}

      <button type="submit" class="cta" disabled={loggingIn}>
        {loggingIn ? 'Logging in…' : 'Log In'}
      </button>
    </form>
  {/if}
</div>

<style>
  div.page {
    max-width: 700px;
    margin: auto;
    padding: 0 1em;
    line-height: 1.2em;
  }
  h1 {
    text-align: center;
    text-shadow: 0 0 10px black;
  }
  h2 {
    margin: 0;
    text-align: center;
    text-shadow: 0 0 10px black;
  }
  div.admin-tabs {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    width: fit-content;
    max-width: 100%;
    margin: 1.5em auto 0;
    border: 3px double #5e5a75;
    border-radius: 8px;
    overflow: hidden;
  }
  div.admin-tabs button {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.75);
    cursor: pointer;
    padding: 0.6em 1.2em;
    font-size: 1em;
    transition: background 0.3s ease-in-out, color 0.3s ease-in-out;
  }
  div.admin-tabs button:not(:last-child) {
    border-right: 1px solid #5e5a75;
  }
  div.admin-tabs button.active {
    background: rgba(94, 90, 117, 0.4);
    color: #fff;
  }
  div.admin-tabs button:not(.active):hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }
  .card {
    display: flex;
    flex-direction: column;
    gap: 1em;
    background: rgba(14, 11, 28, 0.9);
    border: 3px double #5e5a75;
    border-radius: 8px;
    padding: 1.5em;
    margin-top: 1.5em;
  }
  .card p {
    margin: 0;
    text-align: center;
  }
  .card.impersonation-banner {
    background: rgba(150, 90, 0, 0.15);
    border-color: #a06b2a;
  }
  .card.impersonation-banner a {
    color: #ffb84d;
    text-decoration: underline;
    font-weight: bold;
  }
  .card.impersonation-banner button.cta {
    max-width: none;
    padding-left: 1em;
    padding-right: 1em;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.35em;
    text-align: left;
  }
  label input {
    width: auto;
  }
  button.cta {
    align-self: center;
    white-space: nowrap;
  }
  button.cta:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  form.search-row {
    display: flex;
    gap: 0.75em;
  }
  form.search-row input {
    flex: 1;
    width: auto;
  }
  form.search-row button {
    flex-shrink: 0;
  }
  ul.results {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75em;
  }
  ul.results li {
    display: flex;
    align-items: center;
    gap: 0.75em;
    padding: 0.5em;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
  }
  ul.results li img {
    height: 2.5em;
    width: 2.5em;
    border-radius: 50%;
    flex-shrink: 0;
    object-fit: cover;
  }
  li.campaign-row {
    padding: 0;
    overflow: hidden;
    flex-wrap: wrap;
  }
  li.campaign-row.editing {
    border-color: #9593c3;
    box-shadow: #9593c3 0px 0px 5px 1px;
  }
  button.campaign-row-button {
    flex: 1 1 12em;
    display: flex;
    align-items: center;
    text-align: left;
    padding: 0.5em 0.75em;
    cursor: pointer;
    color: inherit;
    font: inherit;
  }
  button.campaign-row-button:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  div.campaign-row-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5em;
    margin-right: 0.75em;
    flex-shrink: 0;
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
  button.row-action:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
  }
  button.row-action.danger {
    border-color: rgba(255, 60, 60, 0.4);
    color: #ff8a8a;
  }
  button.row-action.danger:hover {
    background: rgba(255, 60, 60, 0.15);
    color: #ffb3b3;
  }
  button.row-action:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  div.error-modal {
    margin: 0;
  }
  p.error-text {
    text-align: left;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: monospace;
    font-size: 0.9em;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 6px;
    padding: 0.75em;
    max-height: 50vh;
    overflow: auto;
  }
  div.composer-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.5em 1em;
  }
  div.composer-header h2 {
    flex: 1;
    min-width: 0;
  }
  button.new-campaign-link {
    /* A normal flex item, not position:absolute - on narrow screens the
       h2 next to it can wrap onto two lines, and an absolutely positioned
       button doesn't reliably follow that height change, so it could end
       up rendered outside the visible card. */
    flex: 0 0 auto;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.75);
    text-decoration: underline;
    cursor: pointer;
    font-size: 0.85em;
    white-space: nowrap;
  }
  button.new-campaign-link:hover {
    color: #fff;
  }
  p.editing-note {
    margin: -0.5em 0 0;
    text-align: center;
    font-size: 0.85em;
    color: #ffb84d;
  }
  div.user-info {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    text-align: left;
  }
  div.user-info span {
    font-size: 0.85em;
    color: rgba(255, 255, 255, 0.6);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
    padding: 0.5em;
    resize: vertical;
  }
  div.targeting {
    display: flex;
    flex-direction: column;
    gap: 0.75em;
    text-align: left;
  }
  h3 {
    margin: 0;
    text-shadow: 0 0 10px black;
  }
  div.rule-card {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    padding: 0.75em;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
  }
  div.rule-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  button.remove-rule {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    text-decoration: underline;
    cursor: pointer;
    font-size: 0.85em;
  }
  button.remove-rule:hover {
    color: #fff;
  }
  div.faction-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75em;
  }
  label.checkbox-label {
    flex-direction: row;
    align-items: center;
    gap: 0.4em;
  }
  label.checkbox-label input {
    width: auto;
  }
  div.chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5em;
  }
  span.chip {
    display: inline-flex;
    align-items: center;
    gap: 0.4em;
    background: rgba(94, 90, 117, 0.4);
    border-radius: 999px;
    padding: 0.2em 0.7em;
    font-size: 0.85em;
  }
  span.chip button {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.75);
    cursor: pointer;
    font-size: 1em;
    line-height: 1;
  }
  span.chip button:hover {
    color: #fff;
  }
  div.add-rule-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75em;
  }
  div.add-rule-row select {
    flex: 1;
    width: auto;
    min-width: 8em;
  }
  div.add-rule-row button.cta {
    /* button.cta defaults to width:100%, which flexbox reads as a huge
       flex-basis - without this it gets crushed down toward its 20px
       min-width by the select's flex:1 on narrow viewports. */
    flex: 0 0 auto;
    width: auto;
    min-width: 8em;
  }
  div.campaign-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75em;
    justify-content: center;
  }
  div.campaign-actions button.cta {
    flex: 1;
    min-width: 10em;
    white-space: normal;
    line-height: 1.3em;
  }
  div.placeholder-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5em;
    font-size: 0.85em;
    color: rgba(255, 255, 255, 0.6);
  }
  button.placeholder-button {
    background: rgba(94, 90, 117, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 999px;
    color: #fff;
    cursor: pointer;
    font-family: monospace;
    font-size: 0.9em;
    padding: 0.15em 0.6em;
  }
  button.placeholder-button:hover {
    background: rgba(94, 90, 117, 0.6);
  }
  p.recipient-count {
    margin: 0;
    text-align: left;
    font-size: 0.9em;
    color: rgba(255, 255, 255, 0.75);
  }
  span.status-badge {
    flex-shrink: 0;
    font-size: 0.8em;
    padding: 0.2em 0.6em;
    border-radius: 999px;
    text-transform: capitalize;
    background: rgba(255, 255, 255, 0.1);
  }
  span.status-sent {
    background: rgba(0, 176, 86, 0.25);
  }
  span.status-failed {
    background: rgba(255, 32, 32, 0.25);
  }
  span.status-queued,
  span.status-sending {
    background: rgba(150, 90, 0, 0.25);
  }
</style>
