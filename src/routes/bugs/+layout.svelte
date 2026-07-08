<script>
    import { goto } from '$app/navigation'
    import { resolve } from '$lib/utils'
    import { browser } from '$app/environment'
    import { featureFlags, featureFlagsLoaded } from '$lib/featureFlags'

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
