<script>
    import { goto } from '$app/navigation'
    import { resolve } from '$app/paths'
    import { browser } from '$app/env'
    import { featureFlags, featureFlagsLoaded } from '#lib/featureFlags.js'

    const { children } = $props()

    $effect(() => {
      if (browser && $featureFlagsLoaded && !$featureFlags.BUG_REPORTS_ENABLED) goto(resolve('/'))
    })
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
