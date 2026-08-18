<script>
  import { resolve } from '$app/paths'
  import { pb } from '$lib/pocketbase'
  import zalgo from '$lib/zalgo'

  let {
    id = null,
    user = $bindable(null),
    factionLogo = true,
    linkable = true
  } = $props()

  const url = $derived(linkable && user?.public
    ? resolve(`/agent/${user.username}`)
    : null)
  const logo = $derived(user?.faction === 'machina'
    ? 'machina.png'
    : `${user?.faction || 'unaligned'}.svg`)

  // An $effect (not onMount) so this re-runs if id/user.username only
  // become available after this component's first render - e.g. a parent
  // passing user={{ username }} sourced from authData, which resolves
  // asynchronously after a full page reload. onMount only fires once, so
  // if that data wasn't ready yet at the initial mount, the fetch below
  // would never happen and the component would stay permanently hidden
  // until the page was fully remounted (navigating away and back).
  $effect(() => {
    if (id) {
      pb.collection('public_users').getFirstListItem(`id="${id}"`, { requestKey: null }).then(record => { user = record })
      return
    }
    if (user?.username && user.supporter === undefined) {
      pb.collection('public_users').getFirstListItem(`username="${user.username}"`, { requestKey: null }).then(record => { user = record })
    }
  })
</script>

{#if user && user.faction !== undefined }
  <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- url is pre-resolved -->
  <a href={url} style="color: var(--color-faction-{user.faction || 'unaligned'})"
    class:supporter-unaligned={user?.hasUsernameGlow && !user?.faction}
    class:supporter-machina={user?.hasUsernameGlow && user?.faction === 'machina'}
    class:supporter-enlightened={user?.hasUsernameGlow && user?.faction === 'enlightened'}
    class:supporter-resistance={user?.hasUsernameGlow && user?.faction === 'resistance'} >
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
