<script>
  import { serverAddress } from "$lib/pocketbase"
  import Modal from "./Modal.svelte"

  let { attachment, report } = $props()
  let showModal = $state(false)
</script>

<img
  class="thumbnail"
  src="{serverAddress}/api/files/{report.collectionId}/{report.id}/{attachment}?thumb=150x0"
  alt={attachment}
  onclick={() => (showModal = true)}
/>

<Modal bind:showModal>
  <div>
    <img class="attachment" src="{serverAddress}/api/files/{report.collectionId}/{report.id}/{attachment}" alt="{attachment.name}" />
    <button class="close" onclick={() => (showModal = false)} alt="Close">
      <img src="/images/close.png" />
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
  button {
    margin: 0;
    padding: 0;
    background: none;
    border: none;
  }
  .close img {
    height: 48px;
    width: 48px;
  }
</style>