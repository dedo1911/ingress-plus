<script>
  import { serverAddress } from '$lib/pocketbase'
  import { categories, badgeSize } from '$lib/stores'
  import Modal from './Modal.svelte'

  export let categoryIndex
  export let index

  const thumbSize = (badgeSize) => {
    if (badgeSize <= 64) return '96x96'
    if (badgeSize <= 128) return '128x128'
    return '256x256'
  }

  let badge = {}
  let category = {}
  let hasTiers = false
  let tiers = []
  let tier = 0
  let title = ''
  let showModal = false
  
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
  
  function onBadgeClick () {
    showModal = true
  }
  function onBadgeKeydown (e) {
    if (e.key === 'Escape') showModal = false
  }
</script>

{#if badge }
  <span on:click={onBadgeClick} on:keydown={onBadgeKeydown} role='button' tabindex='0'>
    <img height="{$badgeSize}" width="{$badgeSize}" alt="{title}"
    src="{serverAddress}/api/files/{badge.collectionId}/{badge.id}/{badge.image[tier]}?thumb={thumbSize($badgeSize)}" />
  </span>
  <Modal bind:showModal>
    <img slot="image" height={$badgeSize*2} width={$badgeSize*2} alt="{title}"
    src="{serverAddress}/api/files/{badge.collectionId}/{badge.id}/{badge.image[tier]}?thumb={$badgeSize*2}x{$badgeSize*2}" />
    <h2 slot="title">{title}</h2>
    <p>{badge.description}</p>
  </Modal>
{/if}

<style>
  img {
    display: inline-block;
    cursor: pointer;
  }
</style>
