<script>
  import sortBy from 'lodash.sortby'
  import { goto } from '$app/navigation'
  import { browser } from '$app/environment'
  import { resolve } from '$app/paths'
  import { badgeSize, authData, ownedBadges } from '$lib/stores'
  import { featureFlags } from '$lib/featureFlags'
  import AgentName from '$lib/components/AgentName.svelte'
  import ProfileBadge from '$lib/components/ProfileBadge.svelte'
  import ProfileGroups from '$lib/components/ProfileGroups.svelte'

  let width = $state(1)

  const badgesPerRow = 6
  const sortedBadges = $derived(sortBy($ownedBadges.filter(b => b.expand?.badge?.expand?.category?.profile_visible || false), [
    'expand.badge.expand.category.sorting',
    'expand.badge.sorting'
  ]).reverse())
  const rows = $derived(Math.ceil(sortedBadges.length / badgesPerRow))

  let groupByCategory = $state(false)

  $effect(() => {
    if (browser && $authData.isValid === false) goto(resolve('/'))
  })

  $effect(() => {
    badgeSize.set(Math.min(128, width / 7))
  })

  const username = $derived($authData?.baseModel?.username || '')
  const verification = $derived($authData?.baseModel?.verification || '')
</script>

<svelte:head>
    <title>Ingress Plus &middot; {username || 'Agent Profile'}</title>
</svelte:head>

<section bind:clientWidth={width} style="--badge-size: {$badgeSize}px">
    <h2>
      <AgentName user={{ username }} linkable={false} factionLogo={true} />
    </h2>
  {#if $featureFlags.VERIFICATION_ENABLED}
    {#if $authData?.baseModel?.verification !== ''}
      <p>Your Verification level is <a href={resolve('/verify')}><code>{verification.toUpperCase()}</code></a></p>
    {:else}
      <p>You are currently not <a href={resolve('/verify')}>verified</a>.</p>
    {/if}
  {/if}
  <p><a href={resolve('/agent/settings')}>Open Profile Settings</a></p>

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
