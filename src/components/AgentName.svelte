<script>
  import {onMount} from "svelte"
  import { pb } from "$lib/pocketbase"
  import zalgo from '$lib/zalgo'

  export let id = null
  export let user = null
  export let factionLogo = true

  $: url = user?.public ? `/agent/${user.username}` : '#'

  onMount(async () => {
    if (id || !user) user = await pb.collection('public_users').getFirstListItem(`id="${id}"`, { requestKey: null })
  })

  $: logo = user?.faction === 'machina'
    ? 'machina.png'
    : `${user?.faction || 'unaligned'}.svg`
</script>

{#if user}
  <a href={url} style="color: var(--color-faction-{user.faction || 'unaligned'})">
    {#if factionLogo}
      <img src="/images/{logo}" height="32" alt={user?.faction || 'Unaligned'} />
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
    gap: 0.5em;
    vertical-align: middle;
  }
</style>