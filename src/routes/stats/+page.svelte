<script async>
  import { onMount } from 'svelte'
  import { pb, serverAddress } from '$lib/pocketbase'
  import TimeAgo from 'svelte-timeago/TimeAgo.svelte'

  let statistics, topBadges

  onMount(async () => {
    statistics = (await pb.collection('statistics').getFullList())[0]
    topBadges = (await pb.collection('owned_badges').getList(1, 10, {
      sort: '-count',
      expand: 'badge'
    })).items
  })

  const formatNumber = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
</script>

<svelte:head>
    <title>Ingress Plus &middot; Statistics</title> 
</svelte:head>

<div class="page">
  <h1>Statistics</h1>
  {#if !statistics || !topBadges}
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
    </div>
  {/if}
</div>

<style>
  div.page {
    max-width: 1000px;
    margin: auto;
    padding: 0 1em;
    line-height: 1.2em;
  }
  div.badges {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  div.badge {
    width: 100%;
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    margin-bottom: 1rem;
  }
  div.badge div.icon {
    display: flex;
    flex-basis: 32px;
    justify-content: center;
  }
  div.badge div.title {
    display: flex;
    flex-grow: 1;
    margin-left: 2%;
    line-height: normal;
  }
  div.badge div.count {
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
