<script>
    let { children } = $props()
</script>

<section>
    {@render children?.()}
</section>

<style>
    section {
        max-width: 1200px;
        margin: auto;
        min-height: calc(100vh - 450px);
        padding: 0 1em;
    }
</style>
