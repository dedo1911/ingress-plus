<script>
  import { goto } from '$app/navigation'
  import { browser } from '$app/environment'
  import { badgeSize, authData, ownedBadges } from '$lib/stores'
  import { pb, serverAddress } from '$lib/pocketbase'
  import sortBy from 'lodash.sortby'
  import { slide } from 'svelte/transition'
  import zalgo from '$lib/zalgo'
  import { toast } from '@zerodevx/svelte-toast'

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
  $: sortedBadges = sortBy($ownedBadges.filter(b => b.expand?.badge?.expand?.category?.profile_visible || false), [
    'expand.badge.expand.category.sorting',
    'expand.badge.sorting'
  ]).reverse()

  $: if (browser && $authData.isValid === false) goto('/')

  const toggleFaction = async () => {
    $authData.baseModel.faction = $authData.baseModel.faction === 'enlightened' ? 'resistance' : 'enlightened'
    await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
  }

  const togglePublic = async () => {
    $authData.baseModel.public = !$authData.baseModel.public
    await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
  }

  let newUsername = ''
  $: username = $authData?.baseModel?.username || ''
  $: newUsername = username
  const saveUsername = async () => {
    const oldUsername = $authData.baseModel.username
    try {
      $authData.baseModel.username = newUsername
      await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
    } catch (err) {
      $authData.baseModel.username = oldUsername
      console.error(username, err)
      toast.push('An error has occurred.', { classes: [ 'errorToast' ]})
      return
    }
    editVisible = false
  }

  $: factionLogo = $authData?.baseModel?.faction === 'machina'
    ? 'machina.png'
    : `${$authData?.baseModel?.faction || 'unaligned'}.svg`
  
  const copyProfileLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://ingress.plus/agent/${newUsername}`)
      toast.push('Copied to clipboard!', { classes: [ 'successToast' ]})
    } catch (err) {
      console.error(err)
      toast.push('An error has occurred.', { classes: [ 'errorToast' ]})
    }
  }
</script>

<svelte:head>
    <title>Ingress Plus &middot; {username || 'Agent Profile'}</title> 
</svelte:head>

<section bind:clientWidth={width} style="--badge-size: {$badgeSize}px">
  {#if !editVisible}
    <h2 transition:slide style="color: var(--color-faction-{$authData?.baseModel?.faction || 'unaligned'})" on:click={() => editVisible = true}>
      {#if $authData?.baseModel?.faction === 'machina'}
        {zalgo(username)}
      {:else}
        {username}
      {/if}
    </h2>
  {:else}
    <div transition:slide class="editbox">
      <img src="/images/{factionLogo}" height="64" alt={$authData?.baseModel?.faction || 'unaligned'} on:click={toggleFaction} />
      <input type="text" bind:value={newUsername} style="color: var(--color-faction-{$authData?.baseModel?.faction || 'unaligned'})" />
      <div class="actions">
        <img src={$authData.baseModel.public ? '/images/public.svg':'/images/private.svg'} alt={$authData.baseModel.public ? 'Public' : 'Private'} height="32" on:click={togglePublic} />
        <img src="/images/accept.svg" height="32" alt="Save" on:click={saveUsername} />
      </div>
    </div>
    {#if $authData.baseModel.public}
      <p transition:slide class="publicNotice">
        Your profile is public and will be visible at:<br />
        <span on:click={copyProfileLink}>
          https://ingress.plus/agent/{newUsername}
        </span>
      </p>
    {/if}
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
    margin-left: 1em;
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
  p.publicNotice {
    text-align: center;
    color: var(--color-faction-unaligned)
  }
  p.publicNotice span {
    border: 3px double #5e5a75;
    border-radius: 8px;
    display: inline-block;
    padding: 1rem;
    margin-top: 1rem;
    cursor: pointer;
  }
</style>
