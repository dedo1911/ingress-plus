<script>
  import { serverAddress } from '$lib/pocketbase'
  import { ownedBadges, badgeSize, siteSettings } from '$lib/stores'
  import BadgeModal from './BadgeModal.svelte'

  export let category
  export let index

  const thumbSize = (badgeSize) => {
    if (badgeSize <= 64) return '96x96'
    if (badgeSize <= 128) return '128x128'
    return '256x256'
  }

  let badge = {}
  let hasTiers = false
  let tiers = []
  let tier = 0
  let title = ''
  let showModal = false

  $: index
  $: tiers = category.tiers.split(',').filter(t => t)
  $: hasTiers = tiers.length > 0
  $: badge = hasTiers
    ? category.badges[Math.floor(index/tiers.length)]
    : category.badges[index]
  $: tier = hasTiers
    ? index % tiers.length
    : 0
  $: title = hasTiers
    ? `${badge?.title} - ${tiers[tier]}`
    : badge?.title
  $: owned = badge
    ? $ownedBadges.some(b => b.badge === badge.id && b.tier >= tier)
    : false

  const onBadgeClick = () => (showModal = true)
  const onBadgeKeydown = (e) => {
    if (e.key === 'Escape') showModal = false
  }
</script>

{#if badge }
  <span on:click={onBadgeClick} on:keydown={onBadgeKeydown} role='button' tabindex='0'>
    <img height="{$badgeSize}" width="{$badgeSize}" alt="{title}" class:opaque={$siteSettings.opaqueOwned ? owned : !owned}
    src="{serverAddress}/api/files/{badge.collectionId}/{badge.id}/{badge.image[tier]}?thumb={thumbSize($badgeSize)}" />
  </span>
  <BadgeModal bind:showModal {badge} {tier} {owned} {title} />
{/if}

<style>
  img {
    display: inline-block;
    cursor: pointer;
    transition: opacity 0.3s ease-in-out;
    opacity: 1;
  }
  img.opaque {
    opacity: 0.1;
  }
</style>
