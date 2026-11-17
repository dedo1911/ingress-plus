<script>
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { completeRedirectLogin } from '$lib/auth'
  import Callout from '$lib/components/Callout.svelte'

  // Google sends the agent back here after the redirect login (see
  // loginWithRedirect in $lib/auth).
  let error = $state('')
  let returnTo = $state('/')

  onMount(async () => {
    try {
      const target = await completeRedirectLogin(page.url.searchParams)
      // replaceState: the callback URL holds a used, single-use code, so it
      // shouldn't stay in history for the back button.
      // eslint-disable-next-line svelte/no-navigation-without-resolve -- same-origin path saved before the redirect
      await goto(target, { replaceState: true })
    } catch (err) {
      console.error('Login failed:', err)
      returnTo = err?.returnTo || '/'
      error = err?.response?.message || err?.message || 'Login failed. Please try again.'
    }
  })
</script>

<svelte:head>
  <title>Ingress Plus &middot; Signing in</title>
</svelte:head>

<div class="page">
  {#if error}
    <Callout variant="error">{error}</Callout>
    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- same-origin path saved before the redirect -->
    <a href={returnTo}>Go back</a>
  {:else}
    <p>Signing you in…</p>
  {/if}
</div>

<style>
  div.page {
    max-width: 600px;
    margin: 2em auto;
    padding: 0 1em;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1em;
    text-align: center;
  }
</style>
