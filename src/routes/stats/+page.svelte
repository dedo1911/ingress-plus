<script>
  import Time from 'svelte-time'
  import { serverAddress } from '$lib/pocketbase'
  import AgentName from '$lib/components/AgentName.svelte'
  import { formatNumber } from '$lib/utils.js'

  export let data
  $: s = data.statistics
  $: statistics = s[0][0]
  $: topBadges = s[1].items
  $: topUsers = s[2]
  $: topMediaUsers = s[3]
  $: topMediaUploads = s[4]
</script>

<svelte:head>
    <title>Ingress Plus &middot; Statistics</title>
</svelte:head>

<div class="page">
  <h1>Statistics</h1>
  <div class="stats">
    <div class="stat">
      <span>Total badges:</span>
      <strong>{formatNumber(statistics.total_badges)}</strong>
    </div>
    <div class="stat">
      <span>Total agents:</span>
      <strong>{formatNumber(statistics.total_users)}</strong>
    </div>
    <div class="stat">
      <span>Last agent signup:</span>
      <strong><Time relative live timestamp={statistics.user_last_created} /></strong>
    </div>
    <div class="stat">
      <span>Total owned badges:</span>
      <strong>{formatNumber(statistics.total_owned_badges)}</strong>
    </div>
    <div class="stat">
      <span>Estimated total media:</span>
      <strong>{formatNumber(statistics.estimate_total_media)}</strong>
    </div>
    <div class="stat">
      <span>Collected media:</span>
      <strong>{formatNumber(statistics.total_media)} <small>(≈ {parseInt(statistics.total_media / statistics.estimate_total_media * 1000) / 10} %)</small></strong>
    </div>
    <div class="stat">
      <span>Unique agents contributing to media uploads:</span>
      <strong>{formatNumber(statistics.unique_media_contributors)}</strong>
    </div>
    <div class="stat">
      <span>Unique agents contributing new media that was new to the site:</span>
      <strong>{formatNumber(statistics.unique_new_media_contributors)}</strong>
    </div>
    <div class="stat">
      <span>Total media uploaded <small>(Counting all unique media per agent)</small></span>
      <strong>{formatNumber(statistics.total_media_uploads)}</strong>
    </div>
  </div>
  <hr />
  <h2>Agents with the most badges<br /><small>(public profiles only)</small></h2>
  <div class="users">
      {#each topUsers as topUser}
        <div class="user">
          <AgentName user={{ username: topUser.username, faction: topUser.faction, public: true }} />
          {formatNumber(topUser.count)}
        </div>
      {/each}
    </div>
  <hr />
  <h2>Most Owned Badges</h2>
  <div class="badges">
    {#each topBadges as badge}
      <div class="badge">
        <span>
          <img height="32" width="32" alt="{badge.expand.badge.title}"
          src="{serverAddress}/api/files/{badge.expand.badge.collectionId}/{badge.expand.badge.id}/{badge.expand.badge.image[badge.tier]}?thumb=96x96" />
          {badge.expand.badge.title}
        </span>
        {formatNumber(badge.count)}
      </div>
    {/each}
  </div>
  <hr />
  <h2>Agents that have discovered the most media<br /><small>(public profiles only)</small></h2>
  <div class="users">
    {#each topMediaUsers as topUser}
      <div class="user">
        <AgentName user={{ username: topUser.username, faction: topUser.faction, public: true }} />
        {formatNumber(topUser.count)}
      </div>
    {/each}
  </div>
  <hr />
  <h2>Most uploaded media</h2>
  <div class="medias">
    {#each topMediaUploads as topMedia}
      <div class="media">
        <a href="/media/{topMedia.media_url_id}">
          <img src={topMedia.image_url.replace('http://', 'https://')} height="32" alt={topMedia.short_description} />
          {topMedia.short_description}
        </a>
        {formatNumber(topMedia.count)}
      </div>
    {/each}
  </div>
</div>

<style>
  div.page {
    max-width: 1000px;
    margin: auto;
    padding: 0 1em;
    line-height: 1.2em;
  }
  div.badges, div.users, div.medias {
    display: flex;
    flex-direction: column;
  }
  div.badge, div.user, div.media {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    margin-bottom: 1em;
    justify-content: space-between;
  }
  div.media img, div.badge img {
    border-radius: 16px;
    vertical-align: middle;
    margin: 0 0.25em;
  }
  div.stats {
    display: flex;
    flex-direction: column;
  }
  div.stats div.stat {
    display: flex;
    flex-wrap: nowrap;
    margin-bottom: 0.5rem;
    justify-content: space-between;
  }
</style>
