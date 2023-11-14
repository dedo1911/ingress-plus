<script>
  import { goto } from '$app/navigation'
  import { browser } from '$app/environment'
  import { badgeSize } from '$lib/stores'
  import { pb, serverAddress } from '$lib/pocketbase'
  import sortBy from 'lodash.sortby'
  import { slide } from 'svelte/transition'
  import zalgo from '$lib/zalgo'

  const thumbSize = (badgeSize) => {
    if (badgeSize <= 64) return '96x96'
    if (badgeSize <= 128) return '128x128'
    return '256x256'
  }
  export let data;
  $: publicUser = data.publicUser
  $: sortedBadges = sortBy((data?.ownedBadges || []).filter(b => b.expand?.badge?.expand?.category?.profile_visible || false), [
    'expand.badge.expand.category.sorting',
    'expand.badge.sorting'
  ]).reverse()

  let width = 1
  const badgesPerRow = 6
  let rows = 1

  $: badgeSize.set(Math.min(128, width / 7))
  $: rows = Math.ceil(sortedBadges.length / badgesPerRow)
  $: username = publicUser?.username || ''
</script>

<svelte:head>
    <title>Ingress Plus &middot; {publicUser?.username || 'Profile'}</title> 
</svelte:head>

<section bind:clientWidth={width} style="--badge-size: {$badgeSize}px">
  <h2 transition:slide style="color: var(--color-faction-{publicUser?.faction || 'unaligned'})">
    {#if publicUser?.faction === 'machina'}
      {zalgo(username)}
    {:else}
      {username}
    {/if}
  </h2>

  <div class="badges">
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
  </div>
</section>

<style>
  h2 {
    text-align: center;
    margin: calc(var(--badge-size) / 2) 0;
    font-size: 1.75em;
    text-shadow: 0 0 10px black;
    display: flex;
    align-content: center;
    justify-content: center;
    cursor: pointer;
  }
	section {
    max-width: 1200px;
    margin: auto;
  }
  div.badges {
    margin: auto;
    width: fit-content;
    margin-top: 3em;
  }
  div.badges div {
    white-space: nowrap;
    margin-top: calc(var(--badge-size) / -5);
  }
  div.badges div:nth-child(even of div) {
    margin-left: calc(var(--badge-size) / 2);
  }
</style>
