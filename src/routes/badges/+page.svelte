<script>
  import { fly, slide } from 'svelte/transition'
  import { SvelteSet } from 'svelte/reactivity'
  import { tick } from 'svelte'
  import { resolve } from '$app/paths'
  import { badgeSize, siteSettings, authData } from '$lib/stores'
  import Category from '$lib/components/Category.svelte'
  import CategoryGroup from '$lib/components/CategoryGroup.svelte'
  import { nestCategories } from '$lib/categories'
  import { onMount } from 'svelte'

  const { data } = $props()
  let width = $state(1024)
  $effect(() => {
    badgeSize.set(Math.min(128, width / 7))
  })

  let searchQuery = $state('')
  let showSearch = $state(false)
  let searchInput = $state(null)

  const toggleSearch = async () => {
    showSearch = !showSearch
    if (!showSearch) {
      searchQuery = ''
    } else {
      await tick()
      searchInput?.focus()
    }
  }

  const badgeCategories = $derived(
    data.categories
      .map(c => ({
        ...c,
        badges: c.badges.filter(b => {
          if (!$siteSettings.showUnobtainable && b.unobtainable) return false
          if (searchQuery && !b.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
          return true
        })
      }))
      .filter(c => c.badges.length > 0)
  )

  // A parent category may have no badges of its own, so it is looked up in the
  // full list rather than in badgeCategories (which drops empty categories).
  const categoriesById = $derived(new Map(data.categories.map(c => [c.id, c])))
  const tree = $derived(nestCategories(badgeCategories, c => categoriesById.get(c.parent)))

  // Ids of collapsed categories and subcategories. Not persisted: every visit
  // starts fully expanded, which is also what a #category link needs.
  const collapsed = new SvelteSet()
  const toggle = (key) => () => (collapsed.has(key) ? collapsed.delete(key) : collapsed.add(key))
  const allCollapsed = $derived(tree.length > 0 && tree.every(n => collapsed.has(n.key)))
  const toggleAll = () => {
    if (allCollapsed) collapsed.clear()
    else tree.forEach(n => collapsed.add(n.key))
  }
  // While searching, matches inside a collapsed category would be invisible.
  const isOpen = (key) => !!searchQuery || !collapsed.has(key)

  const toggleSiteSettings = (name) => {
    return () => {
      const newValue = !$siteSettings[name]
      window.localStorage.setItem(`siteSettings:${name}`, newValue)
      siteSettings.set({
        ...$siteSettings,
        [name]: newValue
      })
    }
  }

  // Category heading anchors are plain <a href="#id"> - the browser handles
  // the jump and the hash, and html { scroll-behavior: smooth } (style.css)
  // makes it smooth. Only the initial hash needs help: the grid is laid out
  // after hydration, so the browser's own jump lands on the wrong spot.
  onMount(() => {
    if (window.location.hash) {
      setTimeout(() => {
        document.querySelector(window.location.hash)?.scrollIntoView()
      }, 1)
    }
  })
</script>

<svelte:head>
    <title>Ingress Plus &middot; Badges</title>
</svelte:head>

<section bind:clientWidth={width}>
    <div class="controls">
      <div class="buttons">
        <button onclick={toggleSearch} class:active={showSearch}>
          <img src="/images/glasses.svg" height="24" alt="Search badges" />
          Search
        </button>
        <button onclick={toggleAll}>
          {allCollapsed ? '▸ Expand all' : '▾ Collapse all'}
        </button>
        <button onclick={toggleSiteSettings('showUnobtainable')}>
          <img src={`/images/${$siteSettings.showUnobtainable ? 'hide' : 'show'}.svg`} height="24" alt="Show unobtainable badges" />
          {$siteSettings.showUnobtainable ? 'Hide' : 'Show'} unobtainable
        </button>
        {#if $authData.isValid === true}
          <button onclick={toggleSiteSettings('opaqueOwned')} transition:fly={{ x: 50, duration: 500 }}>
            <img src="/images/shuffle.svg" height="24" alt="Invert highlights" />
            Highlight {$siteSettings.opaqueOwned ? 'obtained' : 'unobtained'}
          </button>
          <a href={resolve('/badges/import')} transition:fly={{ x: 50, duration: 500 }}>
            <img src="/images/upload.svg" height="24" alt="Import stats" />
            Import stats
          </a>
        {/if}
      </div>
      {#if showSearch}
        <div class="search-bar" transition:slide={{ duration: 250 }}>
          <input
            bind:this={searchInput}
            type="search"
            placeholder="Search badges…"
            bind:value={searchQuery}
          />
        </div>
      {/if}
    </div>

  {#if searchQuery && tree.length === 0}
    <p class="no-results">No badges with "{searchQuery}" in their title have been found.</p>
  {/if}

  {#each tree as node (node.key)}
    <CategoryGroup anchor title={node.title} open={isOpen(node.key)} ontoggle={toggle(node.key)}>
      {#if node.own}
        <Category {width} category={node.own} />
      {/if}
      {#each node.children as child (child.id)}
        <CategoryGroup anchor level={3} title={child.title} open={isOpen(child.id)} ontoggle={toggle(child.id)}>
          <Category {width} category={child} />
        </CategoryGroup>
      {/each}
    </CategoryGroup>
    <hr />
  {/each}

</section>

<style>
  section {
    max-width: 1200px;
    margin: auto;
  }
  div.controls {
    display: flex;
    flex-direction: column;
    margin: 1em;
  }
  div.buttons {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
  div.buttons button,
  div.buttons a {
    background: none;
    border: none;
    cursor: pointer;
    color: #FFF;
    font-size: 1em;
    margin: 1em 0 1em 1em;
    padding-bottom: 0.5em;
    display: flex;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0);
    transition: border 0.3s ease-in-out;
    white-space: nowrap;
  }
  div.buttons button img,
  div.buttons a img {
    margin-right: 0.5em;
  }
  div.buttons button:hover,
  div.buttons button.active,
  div.buttons a:hover {
    border-bottom: 1px solid rgba(255, 255, 255, 1);
  }
  div.search-bar {
    width: 100%;
  }
  div.search-bar input[type="search"] {
    width: 100%;
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
  div.search-bar input[type="search"]:focus {
    border-bottom-color: rgba(255, 255, 255, 1);
  }
  div.search-bar input[type="search"]::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
  div.search-bar :global(input[type="search"]::-webkit-search-cancel-button) {
    filter: invert(1);
    cursor: pointer;
  }
  p.no-results {
    text-align: center;
    color: rgba(255, 255, 255, 0.6);
    margin: 2em 1em;
  }
</style>
