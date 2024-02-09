<script async>
  import { categories, badgeSize } from '$lib/stores'
  import Category from '../components/Category.svelte'

  let width = 1024
  $: badgeSize.set(Math.min(128, width / 7))
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
