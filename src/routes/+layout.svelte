<script>
  import { onMount } from 'svelte'
  import { SvelteToast } from '@zerodevx/svelte-toast'
  import { siteSettings } from '$lib/stores'
  import Header from '$lib/components/Header.svelte'
  import Footer from '$lib/components/Footer.svelte'

  import '../style.css'
  import '$lib/styles/editor.scss'

  const options = {
    duration: 2000,
    reversed: true
  }

  onMount(() => {
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
    <slot />
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
