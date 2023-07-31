<script async>
  import { onMount } from 'svelte'
  import { client } from '$lib/pocketbase'
  import { categories } from '$lib/stores'
  import sortBy from 'lodash.sortby'

  import Category from '../components/Category.svelte'

  onMount(async () => {
    const items = await client.collection('categories').getFullList({
      sort: '-sorting',
      expand: 'badges(category)'
    })
    categories.set(items.map(i => {
      const r = { ...i, badges: sortBy(i.expand['badges(category)'] || [] ).reverse() }
      delete r.expand
      return r
    }))
  })
  let width
</script>

<svelte:head>
    <title>Ingress Badges</title> 
</svelte:head>

{#each $categories as category, index}
  {#if category.badges.length > 0 }
    <Category {width} {category} {index} />
  {/if}
{/each}

<div bind:clientWidth={width} />

<style>
	div {
    max-width: 1200px;
    margin: auto;
  }
</style>
