<script>
  import { slide } from 'svelte/transition'
  import sortBy from 'lodash.sortby'
  import { badgeSize } from '$lib/stores'
  import AgentName from '$lib/components/AgentName.svelte'
  import ProfileBadge from '$lib/components/ProfileBadge.svelte'
  import ProfileGroups from '$lib/components/ProfileGroups.svelte'

  const { data } = $props()
  const publicUser = $derived(data.publicUser)
  const sortedBadges = $derived(sortBy((data?.ownedBadges || []).filter(b => b.expand?.badge?.expand?.category?.profile_visible || false), [
    'expand.badge.expand.category.sorting',
    'expand.badge.sorting'
  ]).reverse())

  let groupByCategory = $state(false)
  let width = $state(1)
  const badgesPerRow = 6
  const rows = $derived(Math.ceil(sortedBadges.length / badgesPerRow))

  $effect(() => {
    badgeSize.set(Math.min(128, width / 7))
  })

  const ScannerLink = $derived(`https://link.ingress.com/agent/${encodeURIComponent(publicUser?.username)}`)

  // Hide link to scanner profile if user has default username
  const hideLink = $derived(/^(users\d{5}|Agent_\d{6})$/.test(publicUser?.username))
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
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
        <a target="_blank" rel="noopener noreferrer" href={ScannerLink}>
          <img src="../images/user.svg" alt="User icon" style="height: 1em; vertical-align: middle;">
            Open Profile in Ingress
        </a>
      </p>
    {/if}

  <div class="controls">
    <button onclick={() => (groupByCategory = !groupByCategory)}>
      <img src="/images/shuffle.svg" height="24" alt="Toggle view" />
      {groupByCategory ? 'Default order' : 'Group by category'}
    </button>
  </div>

  {#if !groupByCategory}
    <div class="badges">
      {#each { length: rows } as _, r (r)}
        <div>
        {#each { length: badgesPerRow } as _, c (c)}
          {@const badge = sortedBadges[r * badgesPerRow + c]}
          {#if badge}
            <ProfileBadge owned={badge} />
          {/if}
        {/each}
        </div>
      {/each}
    </div>
  {:else}
    <ProfileGroups badges={sortedBadges} />
  {/if}
</section>

<style>
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
  div.controls {
    display: flex;
    margin: 1em;
    justify-content: flex-end;
  }
  div.controls button {
    background: none;
    border: none;
    cursor: pointer;
    color: #FFF;
    margin: 1em 0 1em 1em;
    padding-bottom: 0.5em;
    display: flex;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0);
    transition: border 0.3s ease-in-out;
  }
  div.controls button img {
    margin-right: 0.5em;
  }
  div.controls button:hover {
    border-bottom: 1px solid rgba(255, 255, 255, 1);
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
