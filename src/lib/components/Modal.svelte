<script>
  let { showModal = $bindable(), children } = $props()

  let dialog = $state()

  $effect(() => {
    if (!dialog) return
    if (showModal) dialog.showModal()
    else dialog.close()
  })

  const handleBackdropClick = (event) => {
    if (event.target === dialog) {
      dialog.close()
      showModal = false
    }
  }
</script>

{#if showModal}
  <dialog bind:this={dialog} onclick={handleBackdropClick}>
    <div role="button" tabindex="0">
      {@render children?.()}
    </div>
  </dialog>
{/if}

<style>
  dialog {
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
