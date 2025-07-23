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
  
  const tiers = $derived(category.tiers.split(',').filter(t => t))
  const hasTiers = $derived(tiers.length > 0)
  const badge = $derived(category.badges[hasTiers ? Math.floor(index / tiers.length) : index])
  const tier = $derived(hasTiers ? index % tiers.length : 0)
  const title = $derived(hasTiers ? `${badge?.title} - ${tiers[tier]}` : badge?.title)
  const owned = $derived(badge
    ? $ownedBadges.some(b => b.badge === badge.id && b.tier >= tier)
    : false)
  const opaque = $derived($authData.isValid ? ($siteSettings.opaqueOwned ? owned : !owned) : false)
  const placeholder = $derived(badge?.hasPlaceholderData)
  const hasWings = $derived(badge?.wings_possible)

  const onBadgeClick = () => (showModal = true)
  const onBadgeKeydown = (e) => {
    if (e.key === 'Escape') showModal = false
  }
</script>

{#if badge }
  <span onclick={onBadgeClick} onkeydown={onBadgeKeydown} role='button' tabindex='0' class="badge-wrapper">
    <img loading="lazy" height="{$badgeSize}" width="{$badgeSize}" alt="{title}" class:opaque={opaque}
    src="{serverAddress}/api/files/{badge.collectionId}/{badge.id}/{badge.image[tier]}?thumb={thumbSize($badgeSize)}" />

    {#if placeholder}
      <img
        class="placeholder_overlay"
        src="images/badges/placeholder_ribbon.png"
        alt="Placeholder"
        height="{$badgeSize}"
        width="{$badgeSize}"
      />
    {/if}
  </span>
  <BadgeModal bind:showModal {badge} {tier} {owned} {title} {hasWings}/>
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
  .badge-wrapper {
    position: relative;
    display: inline-block;
  }

  .badge-wrapper img.placeholder_overlay {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
  }
</style>
