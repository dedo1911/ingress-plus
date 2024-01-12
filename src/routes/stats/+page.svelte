<script async>
  import { onMount } from 'svelte'
  import { pb, serverAddress } from '$lib/pocketbase'
  import TimeAgo from 'svelte-timeago/TimeAgo.svelte'
  import zalgo from '$lib/zalgo'

  let statistics, topBadges, topUsers, topMediaUsers

  onMount(async () => {
    const s = await Promise.all([
      pb.collection('statistics').getFullList(), // statistics
      pb.collection('owned_badges').getList(1, 10, {
        expand: 'badge'
      }), // topBadges
      pb.collection('public_users_owned_badges').getList(1, 10), // topUsers
      pb.collection('media_users').getList(1, 10), // topMediaUsers
    ])
    statistics = s[0][0]
    topBadges = s[1].items
    topUsers = s[2].items
    topMediaUsers = s[3].items
  })

  const formatNumber = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
</script>

<svelte:head>
    <title>Ingress Plus &middot; Statistics</title> 
</svelte:head>

<div class="page">
  <h1>Statistics</h1>
  {#if !statistics || !topBadges || !topUsers || !topMediaUsers}
    <p>Loading...</p>
  {:else}
  <div class="stats">
    <div class="stat">
      <span>Total badges:</span>
      <strong>{formatNumber(statistics.total_badges)}</strong>
    </div>
    <div class="stat">
      <span>Total users:</span>
      <strong>{formatNumber(statistics.total_users)}</strong>
    </div>
    <div class="stat">
      <span>Last user signup:</span>
      <strong><TimeAgo date={statistics.user_last_created} live /></strong>
    </div>
    <div class="stat">
      <span>Total owned badges:</span>
      <strong>{formatNumber(statistics.total_owned_badges)}</strong>
    </div>
    <div class="stat">
      <span>Total media:</span>
      <strong>{formatNumber(statistics.total_media)}</strong>
    </div>
  </div>
  <hr />
  <h2>Agents with the most badges<br /><small>(public profiles only)</small></h2>
  <div class="users">
  {#each topUsers as topUser}
    {@const factionLogo = topUser.faction === 'machina'
      ? 'machina.png'
      : `${topUser.faction || 'unaligned'}.svg`}
    <div class="user">
      <div class="icon">
        <a href="/agent/{topUser.username}">
          <img src={`/images/${factionLogo}`} height="32" alt={topUser.faction} />
        </a>
      </div>
      <div class="title" style="color: var(--color-faction-{topUser.faction || 'unaligned'})">
        <a href="/agent/{topUser.username}">
          {#if topUser.faction === 'machina'}
            {zalgo(topUser.username)}
          {:else}
            {topUser.username}
          {/if}
        </a>
      </div>
      <div class="count">
        <a href="/agent/{topUser.username}">
          {topUser.count}
        </a>
      </div>
    </div>
  {/each}
  </div>
  <hr />
  <h2>Most Owned Badges</h2>
    <div class="badges">
      {#each topBadges as badge}
        <div class="badge">
          <div class="icon">
            <img height="32" width="32" alt="{badge.expand.badge.title}"
            src="{serverAddress}/api/files/{badge.expand.badge.collectionId}/{badge.expand.badge.id}/{badge.expand.badge.image[badge.tier]}?thumb=96x96" />
          </div>
          <div class="title">
            <span>{badge.expand.badge.title}</span>
          </div>
          <div class="count">
            <strong>{formatNumber(badge.count)}</strong>
          </div>
        </div>
      {/each}
    </div><hr />
    <h2>Agents that have uploaded the most media<br /><small>(public profiles only)</small></h2>
    <div class="users">
      {#each topMediaUsers as topUser}
        {@const factionLogo = topUser.faction === 'machina'
                ? 'machina.png'
                : `${topUser.faction || 'unaligned'}.svg`}
        <div class="user">
          <div class="icon">
            <a href="/agent/{topUser.username}">
              <img src={`/images/${factionLogo}`} height="32" alt={topUser.faction} />
            </a>
          </div>
          <div class="title" style="color: var(--color-faction-{topUser.faction || 'unaligned'})">
            <a href="/agent/{topUser.username}">
              {#if topUser.faction === 'machina'}
                {zalgo(topUser.username)}
              {:else}
                {topUser.username}
              {/if}
            </a>
          </div>
          <div class="count">
            <a href="/agent/{topUser.username}">
              {topUser.count}
            </a>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  small {
    display: inline-block;
    margin-top: 0.5rem;
  }
  div.page {
    max-width: 1000px;
    margin: auto;
    padding: 0 1em;
    line-height: 1.2em;
  }
  div.badges, div.users {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  div.badge, div.user {
    width: 100%;
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    margin-bottom: 1rem;
  }
  div.icon {
    display: flex;
    flex-basis: 32px;
    justify-content: center;
  }
  div.title {
    display: flex;
    flex-grow: 1;
    margin-left: 2%;
    line-height: normal;
  }
  a {
    color: unset;
  }
  a:hover {
    font-weight: normal;
  }
  div.count {
    display: flex;
  }
  div.stats {
    display: flex;
    flex-direction: column;
  }
  div.stats div.stat {
    display: flex;
    flex-wrap: nowrap;
    margin-bottom: 0.5rem;
  }
  div.stats div.stat span {
    flex-grow: 1;
  }
  p {
    text-align: justify;
  }
  h1,
  h2,
  h3 {
    text-align: center;
  }
</style>
