<script>
  import { pb } from '$lib/pocketbase'
  import { badgeSize } from '$lib/stores'
  import { thumbSize } from '$lib/utils'

  // `owned` is a user_badges record expanded with badge,badge.category.
  const { owned } = $props()

  const badge = $derived(owned.expand.badge)
  // Same rule as Badge.svelte: wings only ever show on a badge's highest tier.
  const tiers = $derived((badge.expand?.category?.tiers || '').split(',').filter(t => t))
  const wingsOwned = $derived(
    owned.hasWings === true &&
    badge.wings_possible &&
    (tiers.length > 0 ? owned.tier === tiers.length - 1 : true)
  )
</script>

<span>
  <img height="{$badgeSize}" width="{$badgeSize}" alt="{badge.title}"
    src={pb.files.getURL(badge, badge.image[owned.tier], { thumb: thumbSize($badgeSize) })} />
  {#if wingsOwned}
    <img class="wings" src="/images/badges/recursed_flair.png" alt="Wings earned" />
  {/if}
</span>

<style>
  span {
    position: relative;
    display: inline-block;
  }
  img.wings {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 65%;
    height: auto;
    pointer-events: none;
  }
</style>
