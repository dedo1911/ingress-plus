<script>
  import Time, { dayjs } from 'svelte-time'
  import AgentName from '$lib/components/AgentName.svelte'

  let { data } = $props()
  let media = $derived(data.media)
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
      Discovered by:
      <AgentName user={{ faction: media.uploader_faction.toLowerCase(), username: media.uploader_ign }} />
    </div>
    <hr />
    <p class="level">Level <span class={`level level-${media.level}`}>L<span>{media.level}</span></span></p>
    <p class="released">
      { dayjs().isBefore(dayjs(media.released_at)) ? 'Releases' : 'Released' }
      <Time timestamp={media.released_at} relative live />
      on
      <Time timestamp={media.released_at} format="MMMM D, YYYY [at] h:mm A" />
    </p>
    <p class="link">
      <a href={media.content_url} target="_blank">
        {media.expand?.destination?.name || 'Open Media'}
      </a>
    </p>
    <p class="description">
      {@html media.description}
    </p>
    <hr />
    <p class="topic">
      {#each media.expand?.topic || [] as topic}
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
