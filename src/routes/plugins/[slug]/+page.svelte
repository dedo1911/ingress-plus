<script>
  import { page } from '$app/state'
  import { resolve } from '$app/paths'
  import { CartaViewer } from 'carta-md'
  import Time from 'svelte-time'
  import { authData } from '#lib/stores/index.js'
  import { featureFlags } from '#lib/featureFlags.js'
  import { getPlugin, pluginCarta, describeAccess, STATUS_LABELS, VERSION_STATUS_LABELS, SIDELOADER_URL } from '#lib/plugins.js'
  import Callout from '#lib/components/Callout.svelte'
  import Changelog from '#lib/components/plugins/Changelog.svelte'

  const carta = pluginCarta()

  let plugin = $state(null)
  let notFound = $state(false)
  let error = $state('')

  $effect(() => {
    const slug = page.params.slug
    if ($authData.isValid !== true || !$featureFlags.PLUGIN_STORE_ENABLED) return
    plugin = null
    notFound = false
    getPlugin(slug)
      .then(p => { plugin = p })
      .catch(err => {
        // 404 covers both "doesn't exist" and "not available to you".
        if (err.status === 404) notFound = true
        else {
          console.error(err)
          error = 'Could not load this plugin. Please try again later.'
        }
      })
  })
</script>

<svelte:head>
  <title>Ingress Plus &middot; {plugin?.name || 'IITC Plugin'}</title>
</svelte:head>

<div class="page">
  <p class="back"><a href={resolve('/plugins')}>&larr; All plugins</a></p>

  {#if $authData.isValid === false}
    <div class="card"><p>Sign in to see this plugin.</p></div>
  {:else if notFound}
    <div class="card"><p>Plugin not found.</p></div>
  {:else if error}
    <Callout variant="error">{error}</Callout>
  {:else if plugin}
    <div class="card">
      <div class="title">
        {#if plugin.icon}<img src={plugin.icon} alt="" />{/if}
        <div>
          <h1>{plugin.name}</h1>
          <p class="meta">
            {plugin.version ? `v${plugin.version}` : 'Not published yet'}
            {#if plugin.author}&middot; by <a href={resolve('/agent/[username]', { username: plugin.author })}>{plugin.author}</a>{/if}
            {#if plugin.category}&middot; {plugin.category}{/if}
            {#if plugin.homepageUrl}&middot;
              <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- external, author-supplied URL -->
              <a href={plugin.homepageUrl} target="_blank" rel="noopener noreferrer nofollow">Homepage</a>{/if}
          </p>
        </div>
      </div>

      {#if plugin.isAuthor}
        <Callout>
          <p><b>Status:</b> {STATUS_LABELS[plugin.status] || plugin.status}</p>
          <p><b>Who can use it:</b> {describeAccess(plugin.access)} (and you)</p>
          {#if plugin.reviewNotes}<p><b>Notes from the Ingress Plus team:</b> {plugin.reviewNotes}</p>{/if}
          <p><a href={resolve('/plugins/manage/[id]', { id: plugin.id })}>Manage this plugin &rarr;</a></p>
        </Callout>
      {/if}

      {#if plugin.description}
        <div class="description">
          <CartaViewer {carta} value={plugin.description} theme="ingressplus" />
        </div>
      {/if}

      <p class="install">
        Enable it from <em>Toolbox → Ingress Plus</em> in IITC.
        Don't have the sideloader yet? <a href={resolve(SIDELOADER_URL)} target="_blank" rel="noopener">Install it</a>.
      </p>
    </div>

    {#if plugin.versions.length > 0}
      <div class="card">
        <h2>Versions</h2>
        <ul class="versions">
          {#each plugin.versions as v (v.version)}
            <li>
              <b>v{v.version}</b>
              <span class="meta"><Time timestamp={v.created} format="YYYY-MM-DD" />
                {#if v.status}&middot; {VERSION_STATUS_LABELS[v.status] || v.status}{/if}</span>
              {#if v.changelog}<Changelog value={v.changelog} />{/if}
              {#if v.reviewNotes}<p class="changelog notes">Review: {v.reviewNotes}</p>{/if}
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  {/if}
</div>

<style>
  div.page {
    max-width: 800px;
    margin: auto;
    padding: 0 1em;
  }
  p.back a,
  div.card a {
    text-decoration: underline;
  }
  div.card {
    background: rgba(14, 11, 28, 0.9);
    border: 3px double #5e5a75;
    border-radius: 8px;
    padding: 1em 1.5em;
    margin-bottom: 1.5em;
    text-align: left;
  }
  div.title {
    display: flex;
    gap: 1em;
    align-items: center;
  }
  div.title img {
    width: 64px;
    height: 64px;
    object-fit: contain;
  }
  h1,
  h2 {
    margin: 0;
    text-shadow: 0 0 10px black;
  }
  p.meta,
  span.meta {
    margin: 0.25em 0 0;
    font-size: 0.9em;
    color: rgba(255, 255, 255, 0.6);
  }
  div.description {
    margin-top: 1em;
  }
  p.install {
    font-size: 0.9em;
  }
  ul.versions {
    list-style: none;
    margin: 1em 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75em;
  }
  p.changelog {
    margin: 0.3em 0 0;
    white-space: pre-wrap;
    font-size: 0.9em;
  }
  ul.versions :global(div.changelog) {
    margin-top: 0.3em;
  }
  p.notes {
    color: #ffb84d;
  }
</style>
