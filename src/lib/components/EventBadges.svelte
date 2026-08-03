<script>
  import { serverAddress } from '$lib/pocketbase'

  const { badges = [], size = '2.5em', showTitles = false } = $props()
</script>

{#if badges.length > 0}
  <div class="event-badges" style="--badge-size: {size}">
    {#each badges as badge (badge.id)}
      <span class="event-badge">
        <img
          src="{serverAddress}/api/files/{badge.collectionId}/{badge.id}/{badge.image[0]}?thumb=96x96"
          alt={badge.title}
          title={badge.title}
        />
        {#if showTitles}
          <small>{badge.title}</small>
        {/if}
      </span>
    {/each}
  </div>
{/if}

<style>
  div.event-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6em;
  }
  span.event-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25em;
    max-width: 5em;
  }
  span.event-badge img {
    height: var(--badge-size);
    width: var(--badge-size);
    object-fit: contain;
    border-radius: 0.35em;
    background: rgba(0, 0, 0, 0.35);
    box-shadow: black 0 0 0.2em;
    flex-shrink: 0;
  }
  span.event-badge small {
    color: rgba(255, 255, 255, 0.7);
    text-align: center;
    line-height: 1.15em;
  }
</style>
