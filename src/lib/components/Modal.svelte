<script>
  // dismissible controls whether the backdrop click and Escape/cancel both
  // close the dialog - off for flows that must be dismissed through their
  // own explicit buttons only (e.g. the onboarding modal).
  let { showModal = $bindable(), dismissible = true, children } = $props()

  let dialog = $state()

  $effect(() => {
    if (!dialog) return
    if (showModal) dialog.showModal()
    else dialog.close()
  })

  const handleBackdropClick = (event) => {
    if (!dismissible) return
    if (event.target === dialog) {
      dialog.close()
      showModal = false
    }
  }

  // <dialog> fires "cancel" (then "close") on Escape by default - block it
  // the same way the backdrop click is blocked when not dismissible.
  const handleCancel = (event) => {
    if (!dismissible) event.preventDefault()
  }

  // "close" fires for every way the dialog actually closes (Escape when
  // dismissible, backdrop click, or our own dialog.close() calls above) -
  // syncing showModal here (rather than only inside handleBackdropClick)
  // means Escape doesn't leave showModal stuck true with the dialog already
  // gone, which previously made showModal = true a no-op until something
  // else flipped it false first.
  const handleClose = () => { showModal = false }
</script>

{#if showModal}
  <dialog bind:this={dialog} onclick={handleBackdropClick} oncancel={handleCancel} onclose={handleClose}>
    <div role="button" tabindex="0">
      {@render children?.()}
    </div>
  </dialog>
{/if}

<style>
  dialog {
    /* Browsers apply a UA stylesheet default of color: CanvasText directly
       on <dialog> (usually black), which breaks inheriting the page's text
       color for any content that doesn't set its own - inherit it back. */
    color: inherit;
    background: none;
    border: none;
    padding: 0;
    min-width: min(32em, 100vw);
    max-width: 1000px;
    overflow: visible;
    animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  dialog::backdrop {
    background: rgba(0, 0, 0, 0.5);
  }
  @keyframes zoom {
    from {
      transform: scale(0.95);
    }
    to {
      transform: scale(1);
    }
  }
  dialog::backdrop {
    animation: fade 0.2s ease-out;
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
