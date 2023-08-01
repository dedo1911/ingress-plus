<script>
  import { badgeSize } from '$lib/stores'
  import Badge from './Badge.svelte'

  export let category
  export let index
  export let width

  let badgesPerRow = 1
  let rows = 1
  let hasTiers = false
  let tiers = []

  $: width
  $: index
  $: tiers = category.tiers.split(',').filter(t => t)
  $: hasTiers = tiers.length > 0
  $: badgesPerRow = hasTiers
    ? Math.max(1, Math.min(tiers.length, Math.floor((width-$badgeSize)/$badgeSize)))
    : Math.max(1, Math.floor((width-$badgeSize)/$badgeSize))
  $: rows = hasTiers
    ? Math.ceil(category.badges.length * tiers.length / badgesPerRow)
    : Math.ceil(category.badges.length / badgesPerRow)
</script>

<section style="--badge-size: {$badgeSize}px">
  <h2>{category.title}</h2>
  {#each {length: rows} as _, r}
    <div>
    {#each {length: badgesPerRow} as _, c}
      <Badge categoryIndex={index} index={r * badgesPerRow + c} />
    {/each}
    </div>
  {/each}
</section>
<hr />

<style>
  h2 {
    text-align: center;
    margin: calc(var(--badge-size) / 3) 0 calc(var(--badge-size) / 2) 0;
    font-size: 2em;
    text-shadow: 0 0 10px black;
  }
	section {
    max-width: 1200px;
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
