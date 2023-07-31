<script>
  import { serverAddress } from '$lib/pocketbase'
  import { categories, badgeSize } from '$lib/stores'

  export let categoryIndex
  export let index

  let badge = {}
  let category = {}
  let hasTiers = false
  let tiers = []
  let tier = 0
  let title = ''
  
  $: index
  $: category = $categories[categoryIndex]
  $: hasTiers = tiers.length > 0
  $: tiers = category.tiers.split(',').filter(t => t)
  $: badge = hasTiers
    ? category.badges[Math.floor(index/tiers.length)]
    : category.badges[index]
  $: tier = hasTiers
    ? index % tiers.length
    : 0
  $: title = hasTiers
    ? `${badge?.title} - ${tiers[tier]}`
    : badge?.title
</script>

{#if badge }
  <img height="{$badgeSize}" width="{$badgeSize}" alt="{title}"
  src="{serverAddress}/api/files/{badge.collectionId}/{badge.id}/{badge.image[tier]}?thumb={$badgeSize}x{$badgeSize}" />
{/if}

<style>
  img {
    display: inline-block;
  }
</style>
