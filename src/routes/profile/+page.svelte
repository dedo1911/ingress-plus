<script>
  import { goto } from '$app/navigation'
  import { browser } from '$app/environment'
  import { badgeSize, authData, ownedBadges } from '$lib/stores'
  import { pb, serverAddress } from '$lib/pocketbase'
  import sortBy from 'lodash.sortby'
  import { slide } from 'svelte/transition'
  import zalgo from '$lib/zalgo'

  const thumbSize = (badgeSize) => {
    if (badgeSize <= 64) return '96x96'
    if (badgeSize <= 128) return '128x128'
    return '256x256'
  }

  let editVisible = false

  let width = 1
  const badgesPerRow = 6
  let rows = 1
  let sortedBadges = []

  $: badgeSize.set(Math.min(128, width / 7))
  $: rows = Math.ceil($ownedBadges.length / badgesPerRow)
  $: sortedBadges = sortBy($ownedBadges.filter(b => b.expand.badge.expand.category.profile_visible), [
    'expand.badge.expand.category.sorting',
    'expand.badge.sorting'
  ]).reverse()

  $: if (browser && !$authData.isValid) goto('/')

  const toggleFaction = async () => {
    $authData.baseModel.faction = $authData.baseModel.faction === 'enlightened' ? 'resistance' : 'enlightened'
    await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
  }

  let username = $authData?.baseModel?.username || ''
  const saveUsername = async () => {
    $authData.baseModel.username = username
    try {
      await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
    } catch (err) {
      alert(err)
      return
    }
    editVisible = false
  }
</script>

<svelte:head>
    <title>Ingress Plus &middot; {$authData?.baseModel?.username || 'Profile'}</title> 
</svelte:head>

<section bind:clientWidth={width} style="--badge-size: {$badgeSize}px">
  {#if !editVisible}
    <h2 transition:slide style="color: var(--color-faction-{$authData?.baseModel?.faction || 'unaligned'})" on:click={() => editVisible = true}>
      {#if $authData?.baseModel?.faction === 'machina'}
        {zalgo($authData?.baseModel?.username || '')}
      {:else}
        {$authData?.baseModel?.username || ''}
      {/if}
    </h2>
  {:else}
    <div transition:slide class="editbox">
      <img src="/images/{$authData?.baseModel?.faction || 'unaligned'}.svg" height="64" alt={$authData?.baseModel?.faction || 'unaligned'} on:click={toggleFaction} />
      <input type="text" bind:value={username} style="color: var(--color-faction-{$authData?.baseModel?.faction || 'unaligned'})" />
      <img src="/images/accept.svg" height="32" alt="Save" on:click={saveUsername} />
    </div>
  {/if}

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
  div.editbox {
    display: flex;
    margin: 2em 1em;
    align-items: center;
    justify-content: space-around;
  }
  div.editbox img {
    cursor: pointer;
  }
  input {
    font-size: 1.5em;
    background: rgba(14, 11, 28, 0.9);
    border: 3px double #5e5a75;
    border-radius: 8px;
    padding: 0.25em 0.5em;
    text-align: center;
    min-width: 20px;
    margin: 0 0.5em;
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
