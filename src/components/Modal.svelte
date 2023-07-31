<script>
  import { badgeSize } from '$lib/stores'
	export let showModal

	let dialog

	$: if (dialog && showModal) dialog.showModal()
</script>

{#if showModal}
  <dialog
    bind:this={dialog}  
    on:close={() => (showModal = false)}
    on:click|self={() => dialog.close()}
  >
    <div on:click|stopPropagation on:keydown|stopPropagation>
      <figure>
        <slot name="image" />
      </figure>
      <section style="--badge-size: {$badgeSize}px">
        <slot name="title" />
        <hr />
        <slot />
        <button autofocus on:click={() => dialog.close()}>Done</button>
      </section>
    </div>
  </dialog>
{/if}

<style>
	dialog {
    background: none;
		border-radius: 0.2em;
		border: none;
		padding: 0;
		width: 32em;
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
  figure {
    display: flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0px 5px 10px rgba(0,0,0,0.75));
  }
  figure :global(img) {
    cursor: default;
  }
  section :global(> :first-child) {
    margin: 0.1em 0;
  }
  section {
    background: rgba(14, 11, 28, 0.9);
    margin-top: calc(var(--badge-size) * -1);
    padding: var(--badge-size) 2em 2em 2em;
    color: #9593c3;
    border: 3px double #5e5a75;
    border-radius: 8px;
    text-align: center;
    font-size: larger;
    white-space: pre-wrap;
  }
  button {
    cursor: pointer;
    width: 100%;
    max-width: 8em;
    padding: 0.25em 0;
    font-size: larger;
    color: #FFF;
    background: rgb(50,60,110);
    background: linear-gradient(90deg, rgba(50,60,110,1) 0%, rgba(52,39,83,1) 50%, rgba(83,52,118,1) 100%);
    border-color: #9593c3;
    border-radius: 6px;
  }
</style>
