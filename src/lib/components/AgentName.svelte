<script>
  import { onMount } from 'svelte'

  import { pb } from '$lib/pocketbase'
  import zalgo from '$lib/zalgo'

  export let id = null
  export let user = null
  export let factionLogo = true
  export let linkable = true

  $: url = linkable && user?.public ? `/agent/${user.username}` : null

  onMount(async () => {
    if (id || !user) user = await pb.collection('public_users').getFirstListItem(`id="${id}"`, { requestKey: null })
    if (!!user.username && user.supporter === undefined) {
      const lateUser = await pb.collection('public_users').getFirstListItem(`username="${user.username}"`, { requestKey: null })
      user.public = lateUser.public
      user.supporter = lateUser.supporter
    }
  })

  $: logo = user?.faction === 'machina'
    ? 'machina.png'
    : `${user?.faction || 'unaligned'}.svg`
</script>

{#if user}
  <a href={url} style="color: var(--color-faction-{user.faction || 'unaligned'})"
    class:supporter-unaligned={user?.supporter && !user?.faction}
    class:supporter-machina={user?.supporter && user?.faction === 'machina'}
    class:supporter-enlightened={user?.supporter && user?.faction === 'enlightened'}
    class:supporter-resistance={user?.supporter && user?.faction === 'resistance'} >
    {#if factionLogo}
      <img src="/images/{logo}" height="32" class={user?.faction || 'unaligned'} alt={user?.faction || 'Unaligned'} />
    {/if}
    {#if user.faction === 'machina'}
      {zalgo(user.username)}
    {:else}
      {user.username}
    {/if}
  </a>
{/if}

<style>
  a {
    display: inline-flex;
    align-items: center;
    gap: 0.25em;
    vertical-align: middle;
  }
  img {
    margin-left: 0.25em;
    width: 32px;
  }
  img.machina {
    width: 22px;
    margin: 0 calc((32px - 22px) / 2);
  }
</style>
