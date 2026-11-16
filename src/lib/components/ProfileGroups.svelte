<script>
  import { SvelteSet } from 'svelte/reactivity'
  import { badgeSize } from '$lib/stores'
  import { nestCategories } from '$lib/categories'
  import CategoryGroup from '$lib/components/CategoryGroup.svelte'
  import ProfileBadge from '$lib/components/ProfileBadge.svelte'

  // `badges` is a list of user_badges records, already sorted by category and
  // badge, expanded with badge,badge.category,badge.category.parent.
  const { badges } = $props()

  const badgesPerRow = 6

  const groups = $derived(
    badges.reduce((acc, owned) => {
      const cat = owned.expand?.badge?.expand?.category
      if (!cat) return acc
      const existing = acc.find(g => g.id === cat.id)
      if (existing) existing.badges.push(owned)
      else acc.push({ ...cat, badges: [owned] })
      return acc
    }, [])
  )
  const tree = $derived(nestCategories(groups, g => g.expand?.parent))

  const collapsed = new SvelteSet()
  const toggle = (key) => () => (collapsed.has(key) ? collapsed.delete(key) : collapsed.add(key))
  const allCollapsed = $derived(tree.length > 0 && tree.every(n => collapsed.has(n.key)))
  const toggleAll = () => {
    if (allCollapsed) collapsed.clear()
    else tree.forEach(n => collapsed.add(n.key))
  }
</script>

{#snippet grid(items)}
  <div class="badges">
    {#each { length: Math.ceil(items.length / badgesPerRow) } as _, r (r)}
      <div>
      {#each { length: badgesPerRow } as _, c (c)}
        {@const owned = items[r * badgesPerRow + c]}
        {#if owned}
          <ProfileBadge {owned} />
        {/if}
      {/each}
      </div>
    {/each}
  </div>
{/snippet}

<div class="controls">
  <button onclick={toggleAll}>
    {allCollapsed ? '▸ Expand all' : '▾ Collapse all'}
  </button>
</div>

<div class="categories" style="--badge-size: {$badgeSize}px">
  {#each tree as node (node.key)}
    <CategoryGroup title={node.title} open={!collapsed.has(node.key)} ontoggle={toggle(node.key)}>
      {#if node.own}
        {@render grid(node.own.badges)}
      {/if}
      {#each node.children as child (child.id)}
        <CategoryGroup level={3} title={child.title} open={!collapsed.has(child.id)} ontoggle={toggle(child.id)}>
          {@render grid(child.badges)}
        </CategoryGroup>
      {/each}
    </CategoryGroup>
    <hr />
  {/each}
</div>

<style>
  div.controls {
    display: flex;
    justify-content: flex-end;
  }
  div.controls button {
    background: none;
    border: none;
    cursor: pointer;
    color: #FFF;
    font-size: 1em;
    margin: 0 1em;
    padding-bottom: 0.5em;
    border-bottom: 1px solid rgba(255, 255, 255, 0);
    transition: border 0.3s ease-in-out;
  }
  div.controls button:hover {
    border-bottom: 1px solid rgba(255, 255, 255, 1);
  }
  div.categories {
    margin-top: 1em;
  }
  div.badges {
    width: fit-content;
    margin: 0 auto;
    padding-bottom: calc(var(--badge-size) / 4);
  }
  div.badges div {
    white-space: nowrap;
    margin-top: calc(var(--badge-size) / -5);
  }
  div.badges div:first-child {
    margin-top: 0;
  }
  div.badges div:nth-child(even of div) {
    margin-left: calc(var(--badge-size) / 2);
  }
  hr {
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin: 1em auto;
  }
</style>
