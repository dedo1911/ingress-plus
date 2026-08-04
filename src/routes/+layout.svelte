<script>
  import { onMount } from 'svelte'
  import { get } from 'svelte/store'
  import { page } from '$app/stores'
  import { SvelteToast } from '@zerodevx/svelte-toast'
  import { authData, freshLogin, siteSettings } from '$lib/stores'
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

  // Runs once each time $authData actually transitions to valid (a real
  // login, or a page load that restores an existing session) rather than
  // once per component lifetime, so logging out and back in within the
  // same tab is still checked - tracked via previousAuthValid rather than
  // a one-shot flag.
  //
  // An empty onboardingState (never even seen the prompt) keeps the
  // original behavior of reappearing on every page load. Once it's been
  // set to something else non-terminal (currently just "notStarted" -
  // dismissed via "Not now"), that would get naggy if repeated on every
  // reload of an already-open session, so from then on it's only shown
  // again on an actual fresh login (freshLogin, set by Header's login()).
  const ONBOARDING_DONE_STATES = ['completed', 'skipped']
  let previousAuthValid = $state(false)
  let showOnboardingModal = $state(false)

  $effect(() => {
    const isValid = $authData.isValid
    const wasValid = previousAuthValid
    previousAuthValid = !!isValid
    if (!isValid || wasValid) return

    const wasFreshLogin = get(freshLogin)
    freshLogin.set(false)

    if ($page.url.pathname === '/onboarding') return

    const state = $authData.baseModel?.onboardingState
    if (ONBOARDING_DONE_STATES.includes(state)) return
    if (state && !wasFreshLogin) return

    showOnboardingModal = true
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
