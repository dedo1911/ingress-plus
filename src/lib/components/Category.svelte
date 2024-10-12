<script>
  import { toast } from '@zerodevx/svelte-toast'
  import { badgeSize } from '$lib/stores'
  import Badge from '$lib/components/Badge.svelte'

  export let category
  export let width

  let badgesPerRow = 1
  let rows = 1
  let hasTiers = false
  let tiers = []

  $: tiers = category.tiers.split(',').filter(t => t)
  $: hasTiers = tiers.length > 0
  $: badgesPerRow = hasTiers
    ? Math.max(
        1,
        Math.min(tiers.length, Math.floor((width - $badgeSize) / $badgeSize)),
      )
    : 6; // Math.max(1, Math.floor((width-$badgeSize)/$badgeSize))
  $: rows = hasTiers
    ? Math.ceil((category.badges.length * tiers.length) / badgesPerRow)
    : Math.ceil(category.badges.length / badgesPerRow);

  const generateId = (str) =>
    str
      .replace(/[^\w\s]+/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();

  const id = generateId(category.title);

  const copyCategoryLink = async (categoryId) => {
    try {
      await navigator.clipboard.writeText(`${window?.location?.origin}${window?.location?.pathname}#${categoryId}`);
      toast.push('Copied to clipboard!', { classes: ['successToast'] });
    } catch (err) {
      console.error(err);
      toast.push('An error has occurred.', { classes: ['errorToast'] });
    }
  }
</script>

<div style="--badge-size: {$badgeSize}px">
  <section>
    <h2 {id}><a href={`#${id}`} on:click={() => copyCategoryLink(id)}>{category.title}</a></h2>
    <div>
      {#each { length: rows } as _, r}
        <div>
          {#each { length: badgesPerRow } as _, c}
            <Badge {category} index={r * badgesPerRow + c} />
          {/each}
        </div>
      {/each}
    </div>
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
  a:hover {
    padding: 0 1.25em;
    background: url(/images/link.svg) no-repeat left center;
    background-size: 1em;
  }
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
