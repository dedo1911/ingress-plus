<script async>
  import { slide } from 'svelte/transition'
  import {categories, badgeSize, siteSettings, authData} from '$lib/stores'
  import Category from '../components/Category.svelte'

  let width = 1024
  $: badgeSize.set(Math.min(128, width / 7))

  $: $siteSettings
  $: badgeCategories = $categories.map(c => ({
      ...c,
      badges: c.badges.filter(b => $siteSettings.showUnobtainable ? true : !b.unobtainable)
    }))

  const toggleSiteSettings = (name) => {
    return () => {
      const newValue = !$siteSettings[name]
      localStorage.setItem(`siteSettings:${name}`, newValue)
      siteSettings.set({
        ...$siteSettings,
        [name]: newValue
      })
    }
  }
</script>

<svelte:head>
    <title>Ingress Plus</title>
</svelte:head>

<section bind:clientWidth={width}>
  {#if $authData.isValid === true}
    <div class="controls" transition:slide>
      <button on:click={toggleSiteSettings('showUnobtainable')}>
        <img src={`/images/${$siteSettings.showUnobtainable ? 'hide' : 'show'}.svg`} height="24" alt="Show unobtainable badges" />
        {$siteSettings.showUnobtainable ? 'Hide' : 'Show'} unobtainable badges
      </button>
      <button on:click={toggleSiteSettings('opaqueOwned')}>
        <img src="/images/shuffle.svg" height="24" alt="Invert highlights" />
        Highlight {$siteSettings.opaqueOwned ? 'obtained' : 'unobtained'}
      </button>
    </div>
  {/if}

  {#each badgeCategories as category}
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
    margin: 1em;
    justify-content: flex-end;
  }
  div.controls button {
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
  }
  div.controls button img {
    margin-right: 0.5em;
  }
  div.controls button:hover {
    border-bottom: 1px solid rgba(255, 255, 255, 1);
  }
</style>
