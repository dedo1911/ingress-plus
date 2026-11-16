<script>
  import { resolve } from '$app/paths'
  import { authData } from '$lib/stores'
  import { featureFlags, featureFlagsLoaded } from '$lib/featureFlags'
  import { listPlugins, SIDELOADER_URL } from '$lib/plugins'
  import Callout from '$lib/components/Callout.svelte'

  let plugins = $state(null)
  let error = $state('')

  // Only plugins this agent can access come back, so there is nothing to
  // show (or fetch) before sign-in.
  $effect(() => {
    if ($authData.isValid !== true || !$featureFlags.PLUGIN_STORE_ENABLED) return
    listPlugins()
      .then(list => { plugins = list })
      .catch(err => {
        console.error(err)
        error = 'Could not load the plugin list. Please try again later.'
      })
  })
</script>

<svelte:head>
  <title>Ingress Plus &middot; IITC Plugins</title>
</svelte:head>

<div class="page">
  <h1>IITC Plugins</h1>

  {#if $featureFlagsLoaded && !$featureFlags.PLUGIN_STORE_ENABLED}
    <div class="card"><p>The plugin store isn't open yet. Check back soon!</p></div>
  {:else}
    <div class="card intro">
      <p>
        Install the <b>Ingress Plus</b> sideloader once, connect it to your account,
        and pick the plugins you want from inside IITC. They load from ingress.plus
        every time IITC starts, always at their latest reviewed version.
      </p>
      <ol>
        <li>Install <a href="https://iitc.app/" target="_blank" rel="noopener noreferrer">IITC-CE</a> and a userscript manager.</li>
        <li><a href={resolve(SIDELOADER_URL)} target="_blank" rel="noopener">Install the Ingress Plus sideloader</a>.</li>
        <li>On intel.ingress.com, open <em>Toolbox → Ingress Plus</em> and press <em>Connect</em>.</li>
      </ol>
      {#if $authData.isValid}
        <p><a href={resolve('/plugins/manage')}>Publish your own plugin &rarr;</a></p>
      {/if}
    </div>

    {#if $authData.isValid === false}
      <div class="card"><p>Sign in to see the plugins available to you.</p></div>
    {:else if error}
      <Callout variant="error">{error}</Callout>
    {:else if plugins && plugins.length === 0}
      <div class="card"><p>No plugins are available to you yet.</p></div>
    {:else if plugins}
      <ul class="grid">
        {#each plugins as plugin (plugin.slug)}
          <li>
            <a href={resolve('/plugins/[slug]', { slug: plugin.slug })}>
              {#if plugin.icon}
                <img src={plugin.icon} alt="" />
              {:else}
                <img src="/images/tools.svg" alt="" class="placeholder" />
              {/if}
              <div>
                <b>{plugin.name}</b>
                <span>
                  {plugin.version ? `v${plugin.version}` : 'not published'}
                  {#if plugin.author}by {plugin.author}{/if}
                </span>
                {#if plugin.category}<span class="category">{plugin.category}</span>{/if}
                {#if plugin.isAuthor}<span class="mine">Your plugin</span>{/if}
              </div>
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>

<style>
  div.page {
    max-width: 800px;
    margin: auto;
    padding: 0 1em;
  }
  h1 {
    text-align: center;
    text-shadow: 0 0 10px black;
  }
  div.card {
    background: rgba(14, 11, 28, 0.9);
    border: 3px double #5e5a75;
    border-radius: 8px;
    padding: 1em 1.5em;
    margin-bottom: 1.5em;
  }
  div.card p {
    text-align: center;
  }
  div.intro p,
  div.intro ol {
    text-align: left;
    line-height: 1.4em;
  }
  div.card a {
    text-decoration: underline;
  }
  ul.grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1em;
  }
  ul.grid a {
    display: flex;
    gap: 0.75em;
    align-items: center;
    height: 100%;
    box-sizing: border-box;
    padding: 0.75em;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    background: rgba(14, 11, 28, 0.9);
    transition: border-color 0.2s ease-in-out;
  }
  ul.grid a:hover {
    border-color: #9593c3;
  }
  ul.grid img {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    object-fit: contain;
  }
  ul.grid img.placeholder {
    opacity: 0.4;
  }
  ul.grid div {
    display: flex;
    flex-direction: column;
    gap: 0.2em;
    min-width: 0;
  }
  ul.grid span {
    font-size: 0.85em;
    color: rgba(255, 255, 255, 0.6);
  }
  span.mine {
    color: #ffb84d !important;
  }
</style>
