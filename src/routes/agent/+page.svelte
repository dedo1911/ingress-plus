<script>
  import sortBy from 'lodash.sortby'
  import { toast } from '@zerodevx/svelte-toast'
  import { goto } from '$app/navigation'
  import { browser } from '$app/environment'
  import { badgeSize, authData, ownedBadges } from '$lib/stores'
  import { pb, serverAddress } from '$lib/pocketbase'
  import AgentName from '$lib/components/AgentName.svelte'

  const thumbSize = (badgeSize) => {
    if (badgeSize <= 64) return '96x96'
    if (badgeSize <= 128) return '128x128'
    return '256x256'
  }

  let editVisible = $state(false)
  let width = $state(1)

  const badgesPerRow = 6
  const rows = $derived(Math.ceil($ownedBadges.length / badgesPerRow))
  const sortedBadges = $derived(sortBy($ownedBadges.filter(b => b.expand?.badge?.expand?.category?.profile_visible || false), [
    'expand.badge.expand.category.sorting',
    'expand.badge.sorting'
  ]).reverse())

  $effect(() => {
    if (browser && $authData.isValid === false) goto('/')
  })

  $effect(() => {
    badgeSize.set(Math.min(128, width / 7))
  })

  const toggleFaction = async () => {
    $authData.baseModel.faction = $authData.baseModel.faction === 'enlightened' ? 'resistance' : 'enlightened'
    await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
  }

  const togglePublic = async () => {
    $authData.baseModel.public = !$authData.baseModel.public
    await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
  }

  const username = $derived($authData?.baseModel?.username || '')
  let newUsername = $state('')
  $effect(() => {
    newUsername = username
  })

  const saveUsername = async () => {
    const oldUsername = $authData.baseModel.username
    try {
      $authData.baseModel.username = newUsername
      await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
    } catch (err) {
      $authData.baseModel.username = oldUsername
      console.error(username, err)
      toast.push('An error has occurred.', { classes: ['errorToast'] })
      return
    }
    editVisible = false
  }

  const factionLogo = $derived($authData?.baseModel?.faction === 'machina'
    ? 'machina.png'
    : `${$authData?.baseModel?.faction || 'unaligned'}.svg`)

  const verification = $derived($authData?.baseModel?.verification || '')

  const copyProfileLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://ingress.plus/agent/${newUsername}`)
      toast.push('Copied to clipboard!', { classes: ['successToast'] })
    } catch (err) {
      console.error(err)
      toast.push('An error has occurred.', { classes: ['errorToast'] })
    }
  }
</script>

<svelte:head>
    <title>Ingress Plus &middot; {username || 'Agent Profile'}</title>
</svelte:head>

<section bind:clientWidth={width} style="--badge-size: {$badgeSize}px">
    <h2>
      <AgentName user={{ username: username }} linkable={false} factionLogo={true} />
    </h2>
  {#if $authData?.baseModel?.verification != ''}
      <p>Your Verification level is <a href="/verify"><code>{verification.toUpperCase()}</code></a> | <a href="agent/settings">Open Profile Settings</a></p>
      {:else}
      <p>You are currently not <a href="/verify">verified</a>. | <a href="agent/settings">Open Profile Settings</a></p>
      {/if}

  <div class="badges">
    {#each { length: rows } as _, r}
      <div>
      {#each { length: badgesPerRow } as _, c}
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
    p {
        text-align: center;
        margin-left: 5%;
        margin-right: 5%;
    }
  h2 {
    text-align: center;
    margin: calc(var(--badge-size) / 6) 0;
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
