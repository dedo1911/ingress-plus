<script>
  import { badgeSize } from '$lib/stores'
  import Badge from '$lib/components/Badge.svelte'

  export let category
  export let width

  let badgesPerRow = 1
  let rows = 1
  let hasTiers = false
  let tiers = []

  $: width
  $: tiers = category.tiers.split(',').filter(t => t)
  $: hasTiers = tiers.length > 0
  $: badgesPerRow = hasTiers
    ? Math.max(1, Math.min(tiers.length, Math.floor((width-$badgeSize)/$badgeSize)))
    : 6 // Math.max(1, Math.floor((width-$badgeSize)/$badgeSize))
  $: rows = hasTiers
    ? Math.ceil(category.badges.length * tiers.length / badgesPerRow)
    : Math.ceil(category.badges.length / badgesPerRow)
</script>

<div style="--badge-size: {$badgeSize}px">
  <h2>{category.title}</h2>
  <section>
    {#each {length: rows} as _, r}
      <div>
      {#each {length: badgesPerRow} as _, c}
        <Badge category={category} index={r * badgesPerRow + c} />
      {/each}
      </div>
    {/each}
  </section>
</div>
<hr />

<style>
  h2 {
    text-align: center;
    margin: calc(var(--badge-size) / 3) 0 calc(var(--badge-size) / 2) 0;
    font-size: 2em;
    text-shadow: 0 0 10px black;
  }
	section {
    width: fit-content;
    margin: auto;
    padding-bottom: calc(var(--badge-size) / 4);
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
