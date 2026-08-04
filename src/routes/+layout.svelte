<script>
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { SvelteToast } from '@zerodevx/svelte-toast'
  import { authData, siteSettings } from '$lib/stores'
  import Header from '$lib/components/Header.svelte'
  import Footer from '$lib/components/Footer.svelte'
  import LoadingBar from '$lib/components/LoadingBar.svelte'
  import OnboardingModal from '$lib/components/OnboardingModal.svelte'

  import '../style.css'
  import '$lib/styles/editor.scss'

  const { children } = $props()

  const options = {
    duration: 3000,
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

  // Checked once per real login/page load (not on every client-side route
  // change, since $authData only emits a fresh value from Header's login()/
  // onMount() calls) - "Not now" leaves the state as-is so it comes back
  // next time this fires, per the onboarding spec.
  const ONBOARDING_DONE_STATES = ['completed', 'skipped']
  let onboardingChecked = $state(false)
  let showOnboardingModal = $state(false)

  $effect(() => {
    if (!$authData.isValid || onboardingChecked) return
    onboardingChecked = true
    if ($page.url.pathname === '/onboarding') return
    if (!ONBOARDING_DONE_STATES.includes($authData.baseModel?.onboardingState)) {
      showOnboardingModal = true
    }
  })
</script>

<SvelteToast {options} />
<LoadingBar />
<OnboardingModal bind:showModal={showOnboardingModal} />

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
