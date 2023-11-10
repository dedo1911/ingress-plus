<script>
  import { badgeSize, authData, ownedBadges } from '$lib/stores'
  import { serverAddress } from '$lib/pocketbase'
  import sortBy from 'lodash.sortby'

  const thumbSize = (badgeSize) => {
    if (badgeSize <= 64) return '96x96'
    if (badgeSize <= 128) return '128x128'
    return '256x256'
  }

  let width = 1
  let badgesPerRow = 1
  let rows = 1
  let sortedBadges = []

  $: badgeSize.set(width < 600 ? 64 : 128)
  $: badgesPerRow = Math.max(1, Math.floor((width - $badgeSize) / $badgeSize))
  $: rows = Math.ceil($ownedBadges.length / badgesPerRow)
  $: sortedBadges = sortBy($ownedBadges, [
    'expand.badge.expand.category.sorting',
    'expand.badge.sorting'
  ]).reverse()
</script>

<svelte:head>
    <title>Ingress Plus &middot; {$authData?.baseModel?.username || 'Profile'}</title> 
</svelte:head>

<section bind:clientWidth={width} style="--badge-size: {$badgeSize}px">
  <h2>{$authData?.baseModel?.username || ''}</h2>

  {#each {length: rows} as _, r}
    <div>
    {#each {length: badgesPerRow} as _, c}
      {@const badge = sortedBadges[r * badgesPerRow + c]}
      {#if badge}
        <img height="{$badgeSize}" width="{$badgeSize}" alt="{badge.expand.badge.title}"
          src="{serverAddress}/api/files/{badge.expand.badge.collectionId}/{badge.expand.badge.id}/{badge.expand.badge.image[badge.tier]}?thumb={thumbSize($badgeSize)}" />
      {/if}
    {/each}
    </div>
  {/each}
</section>

<style>
	section {
    max-width: 1200px;
    margin: auto;
  }
  h2 {
    text-align: center;
    margin: calc(var(--badge-size) / 3) 0 calc(var(--badge-size) / 2) 0;
    font-size: 2em;
    text-shadow: 0 0 10px black;
    color: var(--color-faction-enl);
  }
	section {
    max-width: 1200px;
    margin: auto;
    padding-bottom: calc(var(--badge-size) / 4);
  }
  section div {
    white-space: nowrap;
    margin-top: calc(var(--badge-size) / -5);
  }
  section div:first-child {
    margin-top: 0;
  }
  section div:nth-child(even of div) {
    margin-left: calc(var(--badge-size) / 2);
  }
</style>
