<script>
  import {onMount} from "svelte"
  import { pb } from "$lib/pocketbase"
  import zalgo from '$lib/zalgo'

  export let id
  let user

  $: url = user?.public ? `/agent/${user.username}` : '#'

  onMount(async () => {
    user = await pb.collection('public_users').getFirstListItem(`id="${id}"`, { requestKey: null })
  })
</script>

{#if user}
  <a href={url} style="color: var(--color-faction-{user.faction || 'unaligned'})">
    {#if user.faction === 'machina'}
      {zalgo(user.username)}
    {:else}
      {user.username}
    {/if}
  </a>
{/if}
