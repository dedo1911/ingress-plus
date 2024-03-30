<script>
  import {onMount} from "svelte"
  import { pb } from "$lib/pocketbase"
  import zalgo from '$lib/zalgo'

  export let id = null
  export let user = null
  export let factionLogo = true

  $: url = user?.public ? `/agent/${user.username}` : null

  onMount(async () => {
    if (id || !user) user = await pb.collection('public_users').getFirstListItem(`id="${id}"`, { requestKey: null })
    if (!!user.username && user.public === undefined) {
      const lateUser = await pb.collection('public_users').getFirstListItem(`username="${user.username}"`, { requestKey: null })
      user.public = lateUser.public
    }
  })

  $: logo = user?.faction === 'machina'
    ? 'machina.png'
    : `${user?.faction || 'unaligned'}.svg`
</script>

{#if user}
  <a href={url} style="color: var(--color-faction-{user.faction || 'unaligned'})">
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
    margin-left: 0.25em;
  }
  img {
    width: 32px;
  }
  img.machina {
    width: 21.7px;
    margin: 0 calc((32px - 21.7px) / 2);
  }
</style>