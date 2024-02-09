<script>
  import { SvelteToast } from '@zerodevx/svelte-toast'
  import {siteSettings} from '$lib/stores'
  import Header from '../components/Header.svelte'
  import Footer from '../components/Footer.svelte'

  import '../style.css'
  import {onMount} from "svelte";

  const options = {
    duration: 2000,
    reversed: true
  }

  onMount(() => {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith('siteSettings:')) continue
      const name = key.split('siteSettings:')[1]
      siteSettings.set({
        ...$siteSettings,
        [name]: JSON.parse(localStorage[key])
      })
    }
  })
</script>

<SvelteToast {options} />

<div class="background" />

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
