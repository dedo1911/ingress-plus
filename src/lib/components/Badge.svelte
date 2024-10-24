<script>
  import { serverAddress } from '$lib/pocketbase'
  import { authData, ownedBadges, badgeSize, siteSettings } from '$lib/stores'
  import BadgeModal from '$lib/components/BadgeModal.svelte'

  let { category, index } = $props()

  const thumbSize = (badgeSize) => {
    if (badgeSize <= 64) return '96x96'
    if (badgeSize <= 128) return '128x128'
    return '256x256'
  }

  let showModal = $state(false)
  
  let tiers = $derived(category.tiers.split(',').filter(t => t))
  let hasTiers = $derived(tiers.length > 0)
  let badge = $derived(category.badges[hasTiers ? Math.floor(index / tiers.length) : index])
  let tier = $derived(hasTiers ? index % tiers.length : 0)
  let title = $derived(hasTiers ? `${badge?.title} - ${tiers[tier]}` : badge?.title)
  let owned = $derived(badge
    ? $ownedBadges.some(b => b.badge === badge.id && b.tier >= tier)
    : false)

  const onBadgeClick = () => (showModal = true)
  const onBadgeKeydown = (e) => {
    if (e.key === 'Escape') showModal = false
  }

  let opaque = $derived($authData.isValid ? ($siteSettings.opaqueOwned ? owned : !owned) : false)
</script>

{#if badge }
  <span onclick={onBadgeClick} onkeydown={onBadgeKeydown} role='button' tabindex='0'>
    <img loading="lazy" height="{$badgeSize}" width="{$badgeSize}" alt="{title}" class:opaque={opaque}
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
