<script async>
  import { onMount } from 'svelte'
  import { pb } from '$lib/pocketbase'
  import { categories, badgeSize } from '$lib/stores'
  import sortBy from 'lodash.sortby'

  import Category from '../components/Category.svelte'

  onMount(async () => {
    const items = await pb.collection('categories').getFullList({
      sort: '-sorting',
      expand: 'badges(category)'
    })
    categories.set(items.map(i => {
      const r = { ...i, badges: i.expand ? sortBy(i.expand['badges(category)'] || []).reverse() : [] }
      delete r.expand
      return r
    }))
  })
  let width
  $: badgeSize.set(width < 600 ? 64 : 128)
</script>

<svelte:head>
    <title>Ingress Plus</title> 
</svelte:head>

<section bind:clientWidth={width}>
  {#each $categories as category, index}
    {#if category.badges.length > 0 }
      <Category {width} {category} {index} />
    {/if}
  {/each}

</section>

<style>
	section {
    max-width: 1200px;
    margin: auto;
  }
</style>
