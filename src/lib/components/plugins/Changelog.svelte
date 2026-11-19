<script>
  import { CartaViewer } from 'carta-md'
  import { changelogCarta } from '#lib/plugins.js'

  // A version's changelog, rendered as markdown.
  let { value } = $props()

  const carta = changelogCarta()
</script>

<div class="changelog">
  <CartaViewer {carta} {value} theme="ingressplus" />
</div>

<style>
  div.changelog {
    font-size: 0.9em;
  }
  div.changelog :global(.carta-viewer > :first-child) {
    margin-top: 0;
  }
  div.changelog :global(.carta-viewer > :last-child) {
    margin-bottom: 0;
  }
</style>
