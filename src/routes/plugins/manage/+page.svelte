<script>
  import { goto } from '$app/navigation'
  import { resolve } from '$app/paths'
  import { toast } from '@zerodevx/svelte-toast'
  import { pb } from '$lib/pocketbase'
  import { authData } from '$lib/stores'
  import { featureFlags } from '$lib/featureFlags'
  import { STATUS_LABELS } from '$lib/plugins'

  // The collection's list rule already limits this to the agent's own plugins.
  let plugins = $state(null)
  let slug = $state('')
  let name = $state('')
  let creating = $state(false)

  $effect(() => {
    if ($authData.isValid !== true || !$featureFlags.PLUGIN_STORE_ENABLED) return
    pb.collection('iitc_plugins').getFullList({ sort: '-updated', expand: 'current_version', requestKey: null })
      .then(list => { plugins = list })
      .catch(err => {
        console.error(err)
        plugins = []
      })
  })

  const SLUG_PATTERN = '[a-z0-9][a-z0-9\\-]{1,38}[a-z0-9]'

  // Suggest a slug from the name until the author edits the slug themselves.
  let slugTouched = $state(false)
  const suggestSlug = () => {
    if (!slugTouched) slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)
  }

  const create = async () => {
    creating = true
    try {
      const record = await pb.collection('iitc_plugins').create({ slug, name, access: { rules: [] } })
      await goto(resolve('/plugins/manage/[id]', { id: record.id }))
    } catch (err) {
      console.error(err)
      const msg = err?.response?.data?.slug?.code === 'validation_not_unique'
        ? 'That plugin id is already taken.'
        : err?.response?.message || 'Could not create the plugin.'
      toast.push(msg, { classes: ['errorToast'] })
    } finally {
      creating = false
    }
  }
</script>

<svelte:head>
  <title>Ingress Plus &middot; My IITC Plugins</title>
</svelte:head>

<div class="page">
  <p class="back"><a href={resolve('/plugins')}>&larr; Plugin store</a></p>
  <h1>My IITC Plugins</h1>

  {#if $authData.isValid === false}
    <div class="card"><p>Sign in to publish plugins.</p></div>
  {:else if $authData.isValid}
    <div class="card">
      <h2>New plugin</h2>
      <p class="hint">
        Plugins are regular IITC userscripts. Every version is reviewed by the Ingress Plus
        team before other agents can load it; you can try your own pending versions in IITC
        straight away.
      </p>
      <form onsubmit={(e) => { e.preventDefault(); create() }}>
        <label>Name <input type="text" maxlength="80" bind:value={name} oninput={suggestSlug} required /></label>
        <label>
          Plugin id
          <input type="text" maxlength="40" bind:value={slug} oninput={() => { slugTouched = true }}
            pattern={SLUG_PATTERN} required />
          <span class="hint">Lowercase letters, digits and dashes. It can't be changed later.</span>
        </label>
        <button type="submit" class="cta" disabled={creating || !name || !slug}>{creating ? 'Creating…' : 'Create'}</button>
      </form>
    </div>

    {#if plugins && plugins.length > 0}
      <ul class="list">
        {#each plugins as plugin (plugin.id)}
          <li>
            <a href={resolve('/plugins/manage/[id]', { id: plugin.id })}>
              <b>{plugin.name}</b>
              <span>{plugin.slug} &middot; {plugin.expand?.current_version ? `v${plugin.expand.current_version.version}` : 'no published version'}</span>
              <span class="status status-{plugin.status}">{STATUS_LABELS[plugin.status] || plugin.status}</span>
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>

<style>
  div.page {
    max-width: 700px;
    margin: auto;
    padding: 0 1em;
  }
  p.back a {
    text-decoration: underline;
  }
  h1,
  h2 {
    text-align: center;
    text-shadow: 0 0 10px black;
    margin-top: 0;
  }
  div.card {
    background: rgba(14, 11, 28, 0.9);
    border: 3px double #5e5a75;
    border-radius: 8px;
    padding: 1em 1.5em;
    margin-bottom: 1.5em;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 1em;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.35em;
  }
  .hint {
    font-size: 0.85em;
    color: rgba(255, 255, 255, 0.6);
  }
  button.cta {
    align-self: center;
  }
  button.cta:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  ul.list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75em;
  }
  ul.list a {
    display: flex;
    flex-direction: column;
    gap: 0.2em;
    padding: 0.75em 1em;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    background: rgba(14, 11, 28, 0.9);
  }
  ul.list a:hover {
    border-color: #9593c3;
  }
  ul.list span {
    font-size: 0.85em;
    color: rgba(255, 255, 255, 0.6);
  }
  span.status-approved {
    color: #7dd87d !important;
  }
  span.status-pending_review {
    color: #ffb84d !important;
  }
  span.status-rejected,
  span.status-disabled {
    color: #ff8a8a !important;
  }
</style>
