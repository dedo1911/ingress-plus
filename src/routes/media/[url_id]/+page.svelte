<script>
  import zalgo from '$lib/zalgo'
  import Time from "svelte-time";

  export let data;
  $: media = data.media

  $: factionLogo = media.uploader_faction.toLowerCase() === 'machina'
          ? 'machina.png'
          : `${media.uploader_faction.toLowerCase() || 'unaligned'}.svg`
</script>

<svelte:head>
  <title>Ingress Plus &middot; {media?.short_description || 'Media'}</title>

  <meta property="og:site_name" content="Ingress Plus">
  <meta property="og:type" content="website">
  <meta property="og:title" content={`Mediagress: ${media?.short_description || 'Media'}`}>
  <meta property="og:url" content={media ? `https://ingress.plus/media/${media.url_id}` : ''}>
  <meta property="og:description" content={(media?.description || '').replace(/(<([^>]+)>)/gi, '')}>
  <meta property="og:image" content={media?.image_url?.replace('http://', 'https://') || ''}>

  <meta name="twitter:card" content="summary_large_image">
  <meta property="twitter:domain" content="ingress.plus">
  <meta property="twitter:url" content={media ? `https://ingress.plus/media/${media.url_id}` : ''}>
  <meta name="twitter:title" content={`Mediagress: ${media?.short_description || 'Media'}`}>
  <meta name="twitter:description" content={(media?.description || '').replace(/(<([^>]+)>)/gi, '')}>
  <meta name="twitter:image" content={media?.image_url?.replace('http://', 'https://') || ''}>
</svelte:head>

<div class="media-data">
  <div class="image">
    <img src={media.image_url.replace('http://', 'https://')} alt={media.short_description} />
  </div>
  <div style="max-width: 512px">
    <h2>{media.short_description}</h2>
    <div class="user">
      <div>
        Discovered by:
      </div>
      <div class="icon">
        <a href="/agent/{media.uploader_ign}">
          <img src={`/images/${factionLogo}`} height="32" alt={media.uploader_faction} />
        </a>
      </div>
      <div class="title" style="color: var(--color-faction-{media.uploader_faction.toLowerCase() || 'unaligned'})">
      {#if media.uploader_faction.toLowerCase() === 'machina'}
          {zalgo(media.uploader_ign)}
      {:else}
          <a href="/agent/{media.uploader_ign}">{media.uploader_ign}</a>
      {/if}
      </div>
    </div>
    <hr />
    <p class="level">Level <span class={`level level-${media.level}`}>L<span>{media.level}</span></span></p>
    <p class="released">Released <Time timestamp={media.released_at} relative live /> on <Time timestamp={media.released_at} format="MMMM D, YYYY [at] h:mm A" /></p>
    <p class="link">
      <a href={media.content_url} target="_blank">
        {media.expand.destination.name}
      </a>
    </p>
    <p class="description">
      {@html media.description}
    </p>
    <hr />
    <p class="topic">
      {#each media.expand.topic as topic}
        <a href={`/media?t=${topic.id}`}>
          {topic.name}
        </a>
      {/each}
    </p>
  </div>
</div>

<style>
  h2 {
    text-align: center;
    margin: calc(var(--badge-size) / 2) 0;
    font-size: 2em;
    text-shadow: 0 0 10px black;
    display: flex;
    align-content: center;
    justify-content: center;
    cursor: pointer;
  }
  div.media-data {
    display: flex;
    margin: 1em;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
  }
  div.image img {
    min-width: 64px;
    min-height: 64px;
    max-height: 256px;
    max-width: 256px;
    margin: 1em;
    border-radius: 12px;
  }
  a {
    color: unset;
  }
  div.user {
    width: 100%;
    display: flex;
    flex-wrap: nowrap;
    margin: 1rem 0;
    align-items: center;
    justify-content: center;
  }
  div.icon {
    display: flex;
    flex-basis: 32px;
    justify-content: center;
  }
  div.title {
    display: flex;
    margin-left: 2%;
    line-height: normal;
  }
  p {
    text-align: center;
  }
  p.description {
    font-size: 1.25rem;
    align-items: center;
    justify-content: center;
  }
  p.topic a, p.link a {
    background: rgba(94, 90, 117, 0.25) url("/images/external.svg") no-repeat 0.5em center;
    background-size: 16px;
    padding: .5em 1em .5em 2em;
    margin: .25em;
    border-radius: 4px;
    transition: all 250ms ease-in-out;
    display: inline-block;
  }
  p.topic a {
    background: rgba(94, 90, 117, 0.25);
    padding: .5em 1em;
  }
  p.link a:hover, p.topic a:hover {
    background-color: rgba(94, 90, 117, 0.75);
    color: #ffffff;
  }
</style>
