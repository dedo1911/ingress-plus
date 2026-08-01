<script>
  import { fly, slide } from 'svelte/transition'
  import { tick } from 'svelte'
  import { categories, badgeSize, siteSettings, authData } from '$lib/stores'
  import Category from '$lib/components/Category.svelte'
  import { onMount } from 'svelte'

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
    $categories
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

  onMount(() => {
    width = document.getElementsByTagName('section')[0].clientWidth
    if (window.location.hash) {
      setTimeout(() => {
        document.querySelector(window.location.hash).scrollIntoView({ behavior: 'smooth' })
      }, 1)
    }
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault()
        document.querySelector(this.getAttribute('href')).scrollIntoView({
          behavior: 'smooth'
        })
        window.history.pushState({}, '', this.getAttribute('href'))
      })
    })
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
        <button onclick={toggleSiteSettings('showUnobtainable')}>
          <img src={`/images/${$siteSettings.showUnobtainable ? 'hide' : 'show'}.svg`} height="24" alt="Show unobtainable badges" />
          {$siteSettings.showUnobtainable ? 'Hide' : 'Show'} unobtainable
        </button>
        {#if $authData.isValid === true}
          <button onclick={toggleSiteSettings('opaqueOwned')} transition:fly={{ x: 50, duration: 500 }}>
            <img src="/images/shuffle.svg" height="24" alt="Invert highlights" />
            Highlight {$siteSettings.opaqueOwned ? 'obtained' : 'unobtained'}
          </button>
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

  {#if searchQuery && badgeCategories.length === 0}
    <p class="no-results">No badges with "{searchQuery}" in their title have been found.</p>
  {/if}

  {#each badgeCategories as category (category.id)}
    {#if category.badges.length > 0 }
      <Category {width} {category} />
    {/if}
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
  div.buttons button {
    background: none;
    border: none;
    cursor: pointer;
    color: #FFF;
    margin: 1em 0 1em 1em;
    padding-bottom: 0.5em;
    display: flex;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0);
    transition: border 0.3s ease-in-out;
    white-space: nowrap;
  }
  div.buttons button img {
    margin-right: 0.5em;
  }
  div.buttons button:hover,
  div.buttons button.active {
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
