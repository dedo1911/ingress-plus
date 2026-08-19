<script>
  import { serverAddress } from '$lib/pocketbase'

  // expandTiers: when a badge has multiple tiers, show every tier icon (grouped
  // under that badge's own single title) instead of just its highest one. Always
  // on when it's the only linked badge (e.g. Second Sunday's bronze-through-black) -
  // otherwise opt-in per usage, since showing every tier of every badge in a
  // compact list row would be too much clutter.
  const { badges = [], size = '2.5em', showTitles = false, expandTiers = false } = $props()

  const groups = $derived(
    badges.map(badge => {
      const showAllTiers = (badges.length === 1 || expandTiers) && badge.image.length > 1
      const images = showAllTiers
        ? badge.image.map((image, tier) => ({
          key: `${badge.id}-${tier}`,
          image,
          title: `${badge.title} - Tier ${tier + 1}`
        }))
        : [{
            key: badge.id,
            image: badge.image[badge.image.length - 1],
            title: badge.title
          }]
      return { key: badge.id, badge, images }
    })
  )
</script>

{#if groups.length > 0}
  <div class="event-badges">
    {#each groups as group (group.key)}
      <div class="event-badge-group" style="--badge-size: {size}">
        <div class="event-badge-icons">
          {#each group.images as icon (icon.key)}
            <img
              src="{serverAddress}/api/files/{group.badge.collectionId}/{group.badge.id}/{icon.image}?thumb=96x96"
              alt={icon.title}
              title={icon.title}
            />
          {/each}
        </div>
        {#if showTitles}
          <small>{group.badge.title}</small>
        {/if}
      </div>
    {/each}
  </div>
{/if}

<style>
  div.event-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8em;
  }
  div.event-badge-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3em;
  }
  div.event-badge-icons {
    display: flex;
    gap: 0.25em;
  }
  div.event-badge-icons img {
    height: var(--badge-size);
    width: var(--badge-size);
    object-fit: contain;
    border-radius: 0.35em;
    background: rgba(0, 0, 0, 0.35);
    box-shadow: black 0 0 0.2em;
    flex-shrink: 0;
  }
  div.event-badge-group small {
    color: rgba(255, 255, 255, 0.7);
    text-align: center;
    line-height: 1.15em;
  }
</style>
