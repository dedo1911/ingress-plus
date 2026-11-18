<script>
  import { resolve } from '$app/paths'
  import { authData } from '#lib/stores/index.js'
  import { featureFlags, featureFlagsLoaded } from '#lib/featureFlags.js'
  import { listPlugins, SIDELOADER_URL } from '#lib/plugins.js'
  import Callout from '#lib/components/Callout.svelte'

  const OTHER = 'Other'

  let plugins = $state(null)
  let error = $state('')
  let query = $state('')
  let selected = $state(null)

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

  // Category is free text typed by authors, so "layer" and "Layer " are the
  // same category. Group case-insensitively and keep the first spelling seen.
  const categoryKey = (plugin) => (plugin.category || '').trim().toLowerCase() || OTHER.toLowerCase()

  // Descriptions are markdown; a rough strip is enough for a card excerpt.
  const excerpt = (md) => (md || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^\s*#+\s.*$/gm, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s*(?:[-+*]|\d+\.)\s+/gm, '')
    .replace(/[#>*_`~|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const categories = $derived.by(() => {
    const byKey = {}
    for (const plugin of plugins || []) {
      const key = categoryKey(plugin)
      byKey[key] ??= { key, label: plugin.category?.trim() || OTHER, count: 0 }
      byKey[key].count++
    }
    return Object.values(byKey).sort((a, b) => {
      if (a.label === OTHER) return 1
      if (b.label === OTHER) return -1
      return a.label.localeCompare(b.label)
    })
  })

  const matches = $derived.by(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
    return (plugins || []).filter(plugin => {
      if (selected && categoryKey(plugin) !== selected) return false
      if (terms.length === 0) return true
      const text = [plugin.name, plugin.author, plugin.category, plugin.description].join(' ').toLowerCase()
      return terms.every(term => text.includes(term))
    })
  })

  const groups = $derived(
    categories
      .map(category => ({
        ...category,
        plugins: matches
          .filter(plugin => categoryKey(plugin) === category.key)
          .sort((a, b) => a.name.localeCompare(b.name))
      }))
      .filter(group => group.plugins.length > 0)
  )

  const toggleCategory = (key) => () => {
    selected = selected === key ? null : key
  }
</script>

<svelte:head>
  <title>Ingress Plus &middot; IITC Plugins</title>
</svelte:head>

<div class="page">
  <h1>IITC Plugins</h1>

  {#if $featureFlagsLoaded && !$featureFlags.PLUGIN_STORE_ENABLED}
    <div class="card"><p>The plugin store isn't open yet. Check back soon!</p></div>
  {:else}
    <details class="card intro" open={$authData.isValid === false || plugins?.length === 0}>
      <summary>How to install</summary>
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
    </details>

    {#if $authData.isValid === false}
      <div class="card"><p>Sign in to see the plugins available to you.</p></div>
    {:else if error}
      <Callout variant="error">{error}</Callout>
    {:else if plugins && plugins.length === 0}
      <div class="card">
        <p>No plugins are available to you yet.</p>
        <p><a href={resolve('/plugins/manage')}>Publish your own plugin &rarr;</a></p>
      </div>
    {:else if plugins}
      <div class="toolbar">
        <input type="search" placeholder="Search plugins…" aria-label="Search plugins by name, author or description" bind:value={query} />
        <a class="publish" href={resolve('/plugins/manage')}>Publish your own</a>
      </div>

      <div class="chips" role="group" aria-label="Categories">
        <button class:active={selected === null} aria-pressed={selected === null} onclick={() => { selected = null }}>
          All <span>{plugins.length}</span>
        </button>
        {#each categories as category (category.key)}
          <button class:active={selected === category.key} aria-pressed={selected === category.key} onclick={toggleCategory(category.key)}>
            {category.label} <span>{category.count}</span>
          </button>
        {/each}
      </div>

      {#if groups.length === 0}
        <p class="no-results">
          No plugins match "{query}"{#if selected} in {categories.find(c => c.key === selected)?.label}{/if}.
        </p>
      {/if}

      {#each groups as group (group.key)}
        <section>
          {#if !selected}<h2>{group.label}</h2>{/if}
          <ul class="grid">
            {#each group.plugins as plugin (plugin.slug)}
              <li>
                <a href={resolve('/plugins/[slug]', { slug: plugin.slug })}>
                  {#if plugin.icon}
                    <img src={plugin.icon} alt="" />
                  {:else}
                    <img src="/images/tools.svg" alt="" class="placeholder" />
                  {/if}
                  <div>
                    <b>{plugin.name}</b>
                    <span class="meta">
                      {plugin.version ? `v${plugin.version}` : 'not published'}
                      {#if plugin.author}&middot; {plugin.author}{/if}
                    </span>
                    {#if plugin.description}<span class="description">{excerpt(plugin.description)}</span>{/if}
                    {#if plugin.isAuthor}<span class="mine">Your plugin</span>{/if}
                  </div>
                </a>
              </li>
            {/each}
          </ul>
        </section>
      {/each}
    {/if}
  {/if}
</div>

<style>
  div.page {
    max-width: 900px;
    margin: auto;
    padding: 0 1em;
  }
  h1 {
    text-align: center;
    text-shadow: 0 0 10px black;
  }
  div.card,
  details.card {
    background: rgba(14, 11, 28, 0.9);
    border: 3px double #5e5a75;
    border-radius: 8px;
    padding: 1em 1.5em;
    margin-bottom: 1.5em;
  }
  div.card p {
    text-align: center;
  }
  details.intro summary {
    cursor: pointer;
    font-weight: bold;
  }
  details.intro p,
  details.intro ol {
    text-align: left;
    line-height: 1.4em;
  }
  .card a {
    text-decoration: underline;
  }

  div.toolbar {
    display: flex;
    gap: 1em;
    align-items: center;
    margin-bottom: 0.75em;
  }
  div.toolbar input[type="search"] {
    flex: 1;
    min-width: 0;
    box-sizing: border-box;
    background: none;
    border: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.3);
    color: #fff;
    font-size: 1em;
    padding: 0.4em 0.2em;
    outline: none;
    transition: border 0.3s ease-in-out;
  }
  div.toolbar input[type="search"]:focus {
    border-bottom-color: rgba(255, 255, 255, 1);
  }
  div.toolbar input[type="search"]::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
  div.toolbar :global(input[type="search"]::-webkit-search-cancel-button) {
    filter: invert(1);
    cursor: pointer;
  }
  a.publish {
    flex-shrink: 0;
    font-size: 0.9em;
    border-bottom: 1px solid transparent;
    transition: border 0.3s ease-in-out;
  }
  a.publish:hover {
    border-bottom-color: #fff;
  }

  div.chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5em;
    margin-bottom: 1.5em;
  }
  div.chips button {
    font: inherit;
    font-size: 0.9em;
    color: #fff;
    background: rgba(14, 11, 28, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 999px;
    padding: 0.3em 0.9em;
    cursor: pointer;
    transition: border-color 0.2s ease-in-out, background 0.2s ease-in-out;
  }
  div.chips button:hover {
    border-color: #9593c3;
  }
  div.chips button.active {
    background: #5e5a75;
    border-color: #9593c3;
  }
  div.chips button span {
    color: rgba(255, 255, 255, 0.6);
    margin-left: 0.25em;
  }

  section {
    margin-bottom: 2em;
  }
  h2 {
    font-size: 1.1em;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.75);
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    padding-bottom: 0.3em;
    margin: 0 0 0.75em;
  }

  ul.grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1em;
  }
  ul.grid a {
    display: flex;
    gap: 0.75em;
    align-items: flex-start;
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
  span.description {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    color: rgba(255, 255, 255, 0.75) !important;
  }
  span.mine {
    color: #ffb84d !important;
  }
  p.no-results {
    text-align: center;
    color: rgba(255, 255, 255, 0.6);
    margin: 2em 1em;
  }

  @media (max-width: 500px) {
    div.toolbar {
      flex-direction: column;
      align-items: stretch;
    }
    a.publish {
      align-self: flex-end;
    }
  }
</style>
