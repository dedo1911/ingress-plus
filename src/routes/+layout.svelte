<script>
  import { onMount } from 'svelte'
  import { SvelteToast } from '@zerodevx/svelte-toast'
  import { siteSettings } from '$lib/stores'
  import { pb } from '$lib/pocketbase'
  import { featureFlags } from '$lib/featureFlags'
  import Header from '$lib/components/Header.svelte'
  import Footer from '$lib/components/Footer.svelte'

  import '../style.css'
  import '$lib/styles/editor.scss'

  const { children } = $props()

  const options = {
    duration: 3000,
    reversed: true
  }

  onMount(async () => {
    try {
      const records = await pb.collection('feature_flags').getFullList()
      featureFlags.set(Object.fromEntries(records.map(r => [r.name, r.enabled])))
    } catch (err) {
      console.error('Failed to load feature flags:', err)
    }

    for (const key of Object.keys(window.localStorage)) {
      if (!key.startsWith('siteSettings:')) continue
      const name = key.split('siteSettings:')[1]
      siteSettings.set({
        ...$siteSettings,
        [name]: JSON.parse(window.localStorage[key])
      })
    }
  })
</script>

<SvelteToast {options} />

<main>
<Header />
  <div>
    {@render children?.()}
  </div>
<Footer />
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 100vh;
  }
  div {
    display: block;
  }
</style>
