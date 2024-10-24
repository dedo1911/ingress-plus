<script>
  import { serverAddress } from "$lib/pocketbase"
  import Modal from "./Modal.svelte"

  let { attachment, report } = $props()
  let showModal = $state(false)
  const show = () => showModal = true
  const hide = () => showModal = false
</script>

<button onclick={show}>
  <img
    class="thumbnail"
    src="{serverAddress}/api/files/{report.collectionId}/{report.id}/{attachment}?thumb=150x0"
    alt={attachment}
  />
</button>

<Modal bind:showModal>
  <div>
    <img class="attachment" src="{serverAddress}/api/files/{report.collectionId}/{report.id}/{attachment}" alt="{attachment.name}" />
    <button class="close" onclick={hide}>
      <img src="/images/close.png" alt="Close" />
    </button>
  </div>
</Modal>

<style>
  div {
    display: flex;
    flex-direction: column;
    align-items: center;
    row-gap: 1em;
  }
  .thumbnail {
    cursor: pointer;
  }
  .attachment {
    max-height: calc(100vh - 6em - 48px);
    max-width: 90vw;
    box-shadow: #9593c3 0px 0px 5px 1px;
    margin: 1em;
  }
  button.close img {
    height: 48px;
    width: 48px;
  }
</style>