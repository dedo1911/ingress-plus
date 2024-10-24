<script>
  import { slide } from 'svelte/transition'
  import { Carta, CartaViewer } from 'carta-md'
  import Time from 'svelte-time'

  import AgentName from '$lib/components/AgentName.svelte'

  let { comment } = $props()
  const carta = new Carta({})
</script>

<div transition:slide class="comment">
  <div class="info">
    <AgentName id={comment.user} />
    <Time timestamp={comment.created} relative live />
  </div>
  <div class="content">
    <CartaViewer {carta} value={comment.comment} theme="ingressplus" />
  </div>
</div>

<style>
  .comment {
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
    background: #131627;
    margin: auto auto 1em;
    max-width: calc(750px);
    border: 1px solid #2b3138;
    border-radius: 0.5em;
  }
  .info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5em 1em 0.5em 0.5em;
    border-bottom: 1px solid #2b3138;
    background: rgba(0, 0, 0, 0.25);
  }
  .content {
    padding: 0.25em 1em;
  }
</style>
