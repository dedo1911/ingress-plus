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
    <!-- The arrow and the link button hang off the title's edges (absolute) so
         they don't push the centred title sideways. -->
    <span>
      <button type="button" class="title" aria-expanded={open} onclick={ontoggle}>
        <span class="arrow" class:closed={!open}>▾</span>{title}
      </button>
      {#if anchor}
        <button type="button" class="link" aria-label="Copy link to {title}" title="Copy link" onclick={copyCategoryLink}>
          <img src="/images/link.svg" alt="" />
        </button>
      {/if}
    </span>
  </svelte:element>
  {#if open}
    {@render children()}
  {/if}
</div>

<style>
  /* No vertical margins: the dividers around a category space its title, and
     the same gap open or collapsed keeps the title from jumping when toggled. */
  h2, h3 {
    text-align: center;
    margin: 0;
    font-size: 2em;
    text-shadow: 0 0 10px black;
  }
  h3 {
    font-size: 1.5em;
  }
  span {
    position: relative;
  }
  button {
    background: none;
    border: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
    padding: 0;
  }
  button.title {
    text-shadow: inherit;
  }
  .arrow {
    position: absolute;
    right: 100%;
    padding-right: 0.25em;
    transition: transform 0.2s ease-in-out;
  }
  .arrow.closed {
    transform: rotate(-90deg);
  }
  button.link {
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    padding-left: 0.5em;
    opacity: 0.4;
    transition: opacity 0.2s ease-in-out;
  }
  button.link:hover,
  button.link:focus-visible {
    opacity: 1;
  }
  button.link img {
    height: 0.6em;
    display: block;
  }
</style>
