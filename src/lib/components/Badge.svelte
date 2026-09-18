<script>
  import { pb } from '$lib/pocketbase'
  import { thumbSize } from '$lib/utils'
  import { authData, ownedBadgesByBadge, badgeSize, siteSettings } from '$lib/stores'
  import BadgeModal from '$lib/components/BadgeModal.svelte'

  const { category, index } = $props()

  let showModal = $state(false)

  const tiers = $derived(category.tiers.split(',').filter(t => t))
  const hasTiers = $derived(tiers.length > 0)
  const badge = $derived(category.badges[hasTiers ? Math.floor(index / tiers.length) : index])
  const tier = $derived(hasTiers ? index % tiers.length : 0)
  const title = $derived(hasTiers ? `${badge?.title} - ${tiers[tier]}` : badge?.title)
  const owned = $derived(badge
    ? $ownedBadgesByBadge.get(badge.id)?.tier >= tier
    : false)
  const opaque = $derived($authData.isValid ? ($siteSettings.opaqueOwned ? owned : !owned) : false)
  const placeholder = $derived(badge?.hasPlaceholderData)
  const hasWings = $derived(badge?.wings_possible)
  const wingsOwned = $derived(
    hasWings &&
    (hasTiers ? tier === tiers.length - 1 : true) &&
    $ownedBadgesByBadge.get(badge?.id)?.hasWings === true
  )

  const onBadgeClick = () => (showModal = true)
  const onBadgeKeydown = (e) => {
    if (e.key === 'Escape') showModal = false
  }
</script>

{#if badge }
  <span onclick={onBadgeClick} onkeydown={onBadgeKeydown} role='button' tabindex='0' class="badge-wrapper">
    <span class="sr-only">{title}</span>
    <img loading="lazy" height="{$badgeSize}" width="{$badgeSize}" alt="{title}" class:opaque={opaque}
    src={pb.files.getURL(badge, badge.image[tier], { thumb: thumbSize($badgeSize) })} />

    {#if placeholder}
      <img
        class="placeholder_overlay"
        src="images/badges/placeholder_ribbon.png"
        alt="Placeholder"
        height="{$badgeSize}"
        width="{$badgeSize}"
      />
    {/if}
    {#if wingsOwned}
      <img
        class="wings_overlay"
        class:opaque={opaque}
        src="images/badges/recursed_flair.png"
        alt="Wings earned"
      />
    {/if}
  </span>
  <!-- Mounted only while open: /badges renders ~700 cells, and each modal
       instance carries its own $derived/$effect subscriptions. BadgeModal
       fetches on an $effect keyed on showModal, so mount-on-open is enough. -->
  {#if showModal}
    <BadgeModal bind:showModal {badge} {tier} {owned} {title} {hasWings} totalTiers={tiers.length}/>
  {/if}
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
  .badge-wrapper img.wings_overlay {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 65%;
    height: auto;
    pointer-events: none;
  }
  .badge-wrapper img.wings_overlay.opaque {
    opacity: 0.2;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
