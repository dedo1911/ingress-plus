<script>
  import { badgeSize } from '$lib/stores'
  import Badge from '$lib/components/Badge.svelte'

  const { category, width } = $props()

  const tiers = $derived(category.tiers.split(',').filter(t => t))
  const hasTiers = $derived(tiers.length > 0)
  const badgesPerRow = $derived(hasTiers
    ? Math.max(
      1,
      Math.min(tiers.length, Math.floor((width - $badgeSize) / $badgeSize))
    )
    : 6)
    // Math.max(1, Math.floor((width-$badgeSize)/$badgeSize))
  const rows = $derived(hasTiers
    ? Math.ceil((category.badges.length * tiers.length) / badgesPerRow)
    : Math.ceil(category.badges.length / badgesPerRow))
</script>

<div style="--badge-size: {$badgeSize}px">
  <section>
    <div>
      {#each { length: rows } as _, r (r)}
        <div>
          {#each { length: badgesPerRow } as _, c (c)}
            <Badge {category} index={r * badgesPerRow + c} />
          {/each}
        </div>
      {/each}
    </div>
  </section>
</div>

<style>
  section {
    padding-bottom: calc(var(--badge-size) / 4);
  }
  section > div {
    width: fit-content;
    margin: auto;
  }
  section div {
    white-space: nowrap;
    margin-top: calc(var(--badge-size) / -5);
  }
  section div:first-child {
    margin-top: 0;
  }
  section div:nth-child(even of div) {
    margin-left: calc(var(--badge-size) / 2);
  }
</style>
