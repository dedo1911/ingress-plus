<script>
  export let showModal

  let dialog

  $: if (dialog) {
    if (showModal) dialog.showModal()
    else dialog.close()
  }

	const preventDefault = (event) => {
    event.preventDefault()
    event.stopImmediatePropagation()
  }
</script>

{#if showModal}
  <dialog
    bind:this={dialog}
    onclose={() => (showModal = false)}
    onclick={() => dialog.close()}>
    <div onclick={preventDefault} onkeydown={preventDefault}>
      <slot />
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
