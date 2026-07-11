<script>
  const { variant = 'warning', children } = $props()
</script>

<div class="callout {variant}">
  {@render children?.()}
</div>

<style>
  div.callout {
    border-radius: 8px;
    border: 3px double;
    padding: 0.75em 1em;
    margin: 1em 0;
    color: rgba(255, 255, 255, 0.85);
  }
  div.callout.warning {
    background: rgba(150, 90, 0, 0.15);
    border-color: #a06b2a;
  }
  div.callout.warning :global(a) {
    color: #ffb84d;
    text-decoration: underline;
    font-weight: bold;
  }
  div.callout.error {
    background: rgba(200, 0, 0, 0.15);
    border-color: #a02020;
  }
  div.callout.error :global(a) {
    color: #ff6b6b;
    text-decoration: underline;
    font-weight: bold;
  }
  div.callout.info {
    background: rgba(89, 86, 154, 0.15);
    border-color: #5e5a75;
  }
  div.callout.info :global(a) {
    color: #b3b0e6;
    text-decoration: underline;
    font-weight: bold;
  }
</style>
