<script>
  import { slide } from 'svelte/transition'
  import sortBy from 'lodash.sortby'
  import { badgeSize } from '$lib/stores'
  import { serverAddress } from '$lib/pocketbase'
  import AgentName from '$lib/components/AgentName.svelte'

  const thumbSize = (badgeSize) => {
    if (badgeSize <= 64) return '96x96'
    if (badgeSize <= 128) return '128x128'
    return '256x256'
  }

  let { data } = $props()
  const publicUser = $derived(data.publicUser)
  const sortedBadges = $derived(sortBy((data?.ownedBadges || []).filter(b => b.expand?.badge?.expand?.category?.profile_visible || false), [
    'expand.badge.expand.category.sorting',
    'expand.badge.sorting'
  ]).reverse())

  let width = $state(1)
  const badgesPerRow = 6
  const rows = $derived(Math.ceil(sortedBadges.length / badgesPerRow))

  $effect(() => {
    badgeSize.set(Math.min(128, width / 7))
  })

  const ScannerLink = `https://link.ingress.com/?link=https%3A%2F%2Fintel.ingress.com%2Fagent%2F${encodeURIComponent(publicUser?.username)}&apn=com.nianticproject.ingress&isi=576505181&ibi=com.google.ingress&ifl=https%3A%2F%2Fapps.apple.com%2Fapp%2Fingress%2Fid576505181&ofl=https%3A%2F%2Fingress.com%2F`;

  // Hide link to scanner profile if user has default username
  const hideLink = /^(users\d{5}|Agent_\d{6})$/.test(publicUser?.username);
</script>

<svelte:head>
    <title>Ingress Plus &middot; {publicUser?.username || 'Agent Profile'}</title>
</svelte:head>

<section bind:clientWidth={width} style="--badge-size: {$badgeSize}px">
  <h2 transition:slide style="color: var(--color-faction-{publicUser?.faction || 'unaligned'})">
    <AgentName id={publicUser.id} linkable={false} factionLogo={true} />
  </h2>
    {#if !hideLink}
      <p style="text-align: center;">
        <a target="_blank" rel="noopener noreferrer" href={ScannerLink}>
          <img src="../images/user.svg" alt="User icon" style="height: 1em; vertical-align: middle;">
            Open Profile in Ingress
        </a>
      </p>
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
    width: fit-content;
    margin: 3em auto auto;
  }
  div.badges div {
    white-space: nowrap;
    margin-top: calc(var(--badge-size) / -5);
  }
  div.badges div:nth-child(even of div) {
    margin-left: calc(var(--badge-size) / 2);
  }
</style>
