<script>
  import { SvelteToast } from '@zerodevx/svelte-toast'
  import Header from '../components/Header.svelte'
  import Footer from '../components/Footer.svelte'
  
  import '../style.css'

  const options = {
    duration: 2000,
    reversed: true
  }
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