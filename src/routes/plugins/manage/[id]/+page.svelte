<script>
  import { page } from '$app/state'
  import { goto } from '$app/navigation'
  import { resolve } from '$app/paths'
  import { MarkdownEditor } from 'carta-md'
  import Time from 'svelte-time'
  import { toast } from '@zerodevx/svelte-toast'
  import { pb } from '$lib/pocketbase'
  import { authData } from '$lib/stores'
  import { featureFlags } from '$lib/featureFlags'
  import { pluginCarta, STATUS_LABELS, VERSION_STATUS_LABELS } from '$lib/plugins'
  import AccessRulesEditor from '$lib/components/plugins/AccessRulesEditor.svelte'
  import Callout from '$lib/components/Callout.svelte'
  import Modal from '$lib/components/Modal.svelte'

  const carta = pluginCarta()

  let plugin = $state(null)
  let versions = $state([])
  let notFound = $state(false)

  // Editable copies, so a failed save doesn't leave the page showing values
  // that were never stored.
  let form = $state({ name: '', category: '', homepage_url: '', description: '' })
  let access = $state({ rules: [] })
  let iconInput = $state()
  let saving = $state(false)

  const load = async (id) => {
    try {
      plugin = await pb.collection('iitc_plugins').getOne(id, { expand: 'current_version', requestKey: null })
      form = {
        name: plugin.name,
        category: plugin.category,
        homepage_url: plugin.homepage_url,
        description: plugin.description
      }
      access = plugin.access && plugin.access.rules ? plugin.access : { rules: [] }
      versions = await pb.collection('iitc_plugin_versions').getFullList({
        filter: pb.filter('plugin = {:id}', { id }),
        sort: '-created',
        requestKey: null
      })
    } catch (err) {
      if (err.status === 404) notFound = true
      else console.error(err)
    }
  }

  $effect(() => {
    const id = page.params.id
    if ($authData.isValid !== true || !$featureFlags.PLUGIN_STORE_ENABLED) return
    load(id)
  })

  const errorMessage = (err, fallback) => {
    const data = err?.response?.data || {}
    const fieldError = Object.entries(data).map(([k, v]) => `${k}: ${v.message}`).join('; ')
    return fieldError || err?.response?.message || fallback
  }

  const save = async () => {
    saving = true
    try {
      const body = new FormData()
      for (const [k, v] of Object.entries(form)) body.append(k, v || '')
      body.append('access', JSON.stringify(access))
      const icon = iconInput?.files?.[0]
      if (icon) body.append('icon', icon)
      plugin = await pb.collection('iitc_plugins').update(plugin.id, body, { expand: 'current_version' })
      if (iconInput) iconInput.value = ''
      toast.push('Saved.', { classes: ['successToast'] })
    } catch (err) {
      console.error(err)
      toast.push(errorMessage(err, 'Could not save the plugin.'), { classes: ['errorToast'] })
    } finally {
      saving = false
    }
  }

  const setStatus = async (status, message) => {
    try {
      plugin = await pb.collection('iitc_plugins').update(plugin.id, { status }, { expand: 'current_version' })
      toast.push(message, { classes: ['successToast'] })
    } catch (err) {
      console.error(err)
      toast.push(errorMessage(err, 'Could not change the status.'), { classes: ['errorToast'] })
    }
  }

  // ---- version upload ----
  let fileInput = $state()
  let newVersion = $state('')
  let changelog = $state('')
  let uploading = $state(false)
  const pendingVersion = $derived(versions.find(v => v.status === 'pending'))

  // Fill the version from the userscript header, which the server checks
  // the field against anyway.
  const readHeaderVersion = async () => {
    const file = fileInput?.files?.[0]
    if (!file) return
    const head = await file.slice(0, 16384).text()
    const match = head.match(/^\/\/\s*@version\s+(\S+)/m)
    if (match) newVersion = match[1]
  }

  const upload = async () => {
    const file = fileInput?.files?.[0]
    if (!file) return
    uploading = true
    try {
      const body = new FormData()
      body.append('plugin', plugin.id)
      body.append('version', newVersion.trim())
      body.append('changelog', changelog)
      body.append('file', file)
      await pb.collection('iitc_plugin_versions').create(body)
      toast.push(`Version ${newVersion} uploaded. It is now waiting for review.`, { classes: ['successToast'] })
      newVersion = ''
      changelog = ''
      fileInput.value = ''
      await load(plugin.id)
    } catch (err) {
      console.error(err)
      toast.push(errorMessage(err, 'Could not upload the version.'), { classes: ['errorToast'] })
    } finally {
      uploading = false
    }
  }

  // ---- delete ----
  let showDelete = $state(false)
  let deleteConfirm = $state('')
  const remove = async () => {
    try {
      await pb.collection('iitc_plugins').delete(plugin.id)
      toast.push(`Deleted ${plugin.name}.`, { classes: ['successToast'] })
      await goto(resolve('/plugins/manage'))
    } catch (err) {
      console.error(err)
      toast.push('Could not delete the plugin.', { classes: ['errorToast'] })
    }
  }
</script>

<svelte:head>
  <title>Ingress Plus &middot; {plugin?.name || 'Plugin'}</title>
</svelte:head>

<div class="page">
  <p class="back"><a href={resolve('/plugins/manage')}>&larr; My plugins</a></p>

  {#if $authData.isValid === false}
    <div class="card"><p>Sign in to manage your plugins.</p></div>
  {:else if notFound}
    <div class="card"><p>Plugin not found.</p></div>
  {:else if plugin}
    <h1>{plugin.name}</h1>
    <p class="subtitle">
      <code>{plugin.slug}</code> &middot; {STATUS_LABELS[plugin.status] || plugin.status}
      {#if plugin.expand?.current_version}&middot; serving v{plugin.expand.current_version.version}{/if}
      &middot; <a href={resolve('/plugins/[slug]', { slug: plugin.slug })}>Store page</a>
    </p>

    {#if plugin.review_notes}
      <Callout><b>Notes from the Ingress Plus team:</b> {plugin.review_notes}</Callout>
    {/if}

    <div class="card">
      <h2>Details</h2>
      <form onsubmit={(e) => { e.preventDefault(); save() }}>
        <label>Name <input type="text" maxlength="80" bind:value={form.name} required /></label>
        <label>Category <input type="text" maxlength="40" bind:value={form.category} placeholder="e.g. Layer, Tweaks, Info" /></label>
        <label>Homepage <input type="url" bind:value={form.homepage_url} placeholder="https://" /></label>
        <label>
          Icon
          <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" bind:this={iconInput} />
          <span class="hint">Square, up to 256 KB.</span>
        </label>
        <div class="field">
          <span>Description</span>
          <MarkdownEditor {carta} bind:value={form.description} mode="tabs" theme="ingressplus" />
        </div>

        <h3>Who can use it</h3>
        <p class="hint">
          Agents who don't match any rule never see this plugin, not even in the list.
          Changes apply immediately, without review.
        </p>
        <AccessRulesEditor bind:access />

        <button type="submit" class="cta" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
      </form>
    </div>

    <div class="card">
      <h2>Versions</h2>
      {#if plugin.status === 'disabled'}
        <Callout variant="error">This plugin was disabled by the Ingress Plus team and can't receive new versions.</Callout>
      {:else if pendingVersion}
        <p class="hint">
          v{pendingVersion.version} is waiting for review. In IITC, tick
          <em>Use my version {pendingVersion.version}</em> under Ingress Plus to try it now.
        </p>
      {:else}
        <form onsubmit={(e) => { e.preventDefault(); upload() }}>
          <label>
            Userscript (.js)
            <input type="file" accept=".js,text/javascript" bind:this={fileInput} onchange={readHeaderVersion} required />
            <span class="hint">Needs a <code>// ==UserScript==</code> header; its <code>@version</code> must match below. Max 1 MB.</span>
          </label>
          <label>Version <input type="text" bind:value={newVersion} placeholder="1.0.0" required /></label>
          <label>Changelog <textarea rows="4" maxlength="5000" bind:value={changelog}></textarea></label>
          <button type="submit" class="cta" disabled={uploading || !newVersion}>{uploading ? 'Uploading…' : 'Submit for review'}</button>
        </form>
      {/if}

      {#if versions.length > 0}
        <ul class="versions">
          {#each versions as v (v.id)}
            <li>
              <b>v{v.version}</b>
              <span class="hint">
                <Time timestamp={v.created} format="YYYY-MM-DD HH:mm" /> &middot; {VERSION_STATUS_LABELS[v.status] || v.status}
                {#if plugin.current_version === v.id}&middot; <b>live</b>{/if}
              </span>
              {#if v.changelog}<p class="changelog">{v.changelog}</p>{/if}
              {#if v.review_notes}<p class="changelog notes">Review: {v.review_notes}</p>{/if}
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <div class="card">
      <h2>Publishing</h2>
      {#if plugin.status === 'approved'}
        <p class="hint">Unpublishing hides the plugin from everyone else and stops it loading in their IITC. You can publish it again later.</p>
        <button type="button" class="cta" onclick={() => setStatus('draft', 'Plugin unpublished.')}>Unpublish</button>
      {:else if plugin.status === 'draft' && plugin.current_version}
        <button type="button" class="cta" onclick={() => setStatus('approved', 'Plugin published again.')}>Publish again</button>
      {/if}
      <button type="button" class="cta danger" onclick={() => { deleteConfirm = ''; showDelete = true }}>Delete plugin</button>
    </div>

    <Modal bind:showModal={showDelete}>
      <h3>Delete {plugin.name}?</h3>
      <p>This deletes the plugin and every uploaded version, and it disappears from everyone's IITC. It can't be undone.</p>
      <label>Type <code>{plugin.slug}</code> to confirm <input type="text" bind:value={deleteConfirm} /></label>
      <button type="button" class="cta danger" disabled={deleteConfirm !== plugin.slug} onclick={remove}>Delete</button>
    </Modal>
  {/if}
</div>

<style>
  div.page {
    max-width: 800px;
    margin: auto;
    padding: 0 1em;
  }
  p.back a,
  p.subtitle a {
    text-decoration: underline;
  }
  h1,
  h2 {
    text-align: center;
    text-shadow: 0 0 10px black;
    margin-top: 0;
  }
  h3 {
    margin: 0.5em 0 0;
  }
  p.subtitle {
    text-align: center;
    color: rgba(255, 255, 255, 0.7);
  }
  div.card {
    display: flex;
    flex-direction: column;
    gap: 1em;
    background: rgba(14, 11, 28, 0.9);
    border: 3px double #5e5a75;
    border-radius: 8px;
    padding: 1em 1.5em;
    margin-bottom: 1.5em;
    text-align: left;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 1em;
  }
  label,
  div.field {
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
    resize: vertical;
  }
  .hint {
    font-size: 0.85em;
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
  }
  button.cta {
    align-self: center;
  }
  button.cta:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  button.danger {
    border-color: rgba(255, 60, 60, 0.6);
    color: #ff8a8a;
  }
  ul.versions {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75em;
  }
  ul.versions li {
    display: flex;
    flex-direction: column;
    gap: 0.2em;
    padding: 0.5em 0.75em;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
  }
  p.changelog {
    margin: 0;
    white-space: pre-wrap;
    font-size: 0.9em;
  }
  p.notes {
    color: #ffb84d;
  }
</style>
