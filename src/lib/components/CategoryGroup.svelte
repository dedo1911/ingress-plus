<script>
  import { toast } from '@zerodevx/svelte-toast'
  import { badgeSize } from '$lib/stores'
  import { generateId } from '$lib/utils'

  // level 2 is a top-level category, 3 a subcategory. `anchor` turns the title
  // into a copyable #link (badges page only - profiles have no anchors).
  const { title, level = 2, open, ontoggle, anchor = false, children } = $props()

  const id = $derived(generateId(title))

  const copyCategoryLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window?.location?.origin}${window?.location?.pathname}#${id}`)
      toast.push('Copied to clipboard!', { classes: ['successToast'] })
    } catch (err) {
      console.error(err)
      toast.push('An error has occurred.', { classes: ['errorToast'] })
    }
  }
</script>

<div style="--badge-size: {$badgeSize}px">
  <svelte:element this={`h${level}`} id={anchor ? id : undefined} class:closed={!open}>
    <!-- The arrow hangs off the title's left edge (absolute) so it doesn't push the centred title right. -->
    <span>
      <button type="button" class:closed={!open} aria-expanded={open}
        aria-label="{open ? 'Collapse' : 'Expand'} {title}" onclick={ontoggle}>▾</button>
      {#if anchor}
        <a href={`#${id}`} onclick={copyCategoryLink}>{title}</a>
      {:else}
        {title}
      {/if}
    </span>
  </svelte:element>
  {#if open}
    {@render children()}
  {/if}
</div>

<style>
  h2, h3 {
    text-align: center;
    margin: calc(var(--badge-size) / 3) 0 calc(var(--badge-size) / 2) 0;
    font-size: 2em;
    text-shadow: 0 0 10px black;
  }
  h3 {
    font-size: 1.5em;
  }
  /* A collapsed heading sits between two dividers, so both of its margins
     go and the dividers' own margins give equal space above and below. */
  h2.closed, h3.closed {
    margin-top: 0;
    margin-bottom: 0;
  }
  span {
    position: relative;
  }
  button {
    position: absolute;
    right: 100%;
    top: 50%;
    margin-top: -0.6em;
    line-height: 1.2em;
    background: none;
    border: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
    padding: 0 0.25em;
    transition: transform 0.2s ease-in-out;
  }
  button.closed {
    transform: rotate(-90deg);
  }
  a:hover {
    padding: 0 1.25em;
    background: url(/images/link.svg) no-repeat left center;
    background-size: 1em;
  }
</style>
