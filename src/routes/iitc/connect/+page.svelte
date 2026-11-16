<script>
  import { onMount } from 'svelte'
  import { page } from '$app/state'
  import { pb } from '$lib/pocketbase'
  import { authData } from '$lib/stores'
  import { featureFlags, featureFlagsLoaded } from '$lib/featureFlags'
  import Callout from '$lib/components/Callout.svelte'

  // Opened as a popup by the sideloader on intel.ingress.com. The token goes
  // back to that window only: postMessage with an explicit target origin
  // never delivers it anywhere else, even if the opener navigated away.
  const INTEL_ORIGIN = 'https://intel.ingress.com'

  const label = $derived((page.url.searchParams.get('label') || 'IITC').slice(0, 60))

  let hasOpener = $state(true)
  let connecting = $state(false)
  let error = $state('')
  let done = $state(false)
  // Without an opener (IITC Mobile, a blocked popup, a bookmarked link) the
  // token is shown once for the agent to paste into the sideloader instead.
  let code = $state('')

  onMount(() => { hasOpener = !!window.opener })

  const connect = async () => {
    error = ''
    connecting = true
    try {
      const result = await pb.send('/api/iitc/tokens', { method: 'POST', body: { label } })
      if (!hasOpener) {
        code = result.token
        return
      }
      window.opener.postMessage({
        type: 'ingress-plus:token',
        token: result.token,
        username: $authData.baseModel.username
      }, INTEL_ORIGIN)
      done = true
      setTimeout(() => window.close(), 1500)
    } catch (err) {
      console.error(err)
      error = err?.response?.error || 'Could not connect IITC. Please try again.'
    } finally {
      connecting = false
    }
  }
</script>

<svelte:head>
  <title>Ingress Plus &middot; Connect IITC</title>
</svelte:head>

<div class="page">
  <h1>Connect IITC</h1>

  <div class="card">
    {#if $featureFlagsLoaded && !$featureFlags.PLUGIN_STORE_ENABLED}
      <p>The plugin store isn't open yet.</p>
    {:else if code}
      <p>Paste this code into <em>Ingress Plus → Paste a connection code</em> in IITC. It is shown only once.</p>
      <code class="token">{code}</code>
      <button type="button" class="cta" onclick={() => navigator.clipboard?.writeText(code)}>Copy</button>
    {:else if done}
      <p>Connected. You can close this window and go back to IITC.</p>
    {:else if $authData.isValid === false}
      <p>Sign in with the <strong>Login</strong> button at the top of this page, then come back to this window.</p>
    {:else if $authData.isValid}
      <p>
        Allow IITC on <strong>{label}</strong> to load the Ingress Plus plugins
        available to <strong>{$authData.baseModel.username}</strong>?
      </p>
      {#if !hasOpener}
        <Callout>
          This page wasn't opened from IITC, so you'll get a code to paste into the
          sideloader (<em>Toolbox → Ingress Plus → Paste a connection code</em>).
          Treat it like a password.
        </Callout>
      {/if}
      <p class="hint">You can disconnect this device at any time from Agent Settings.</p>
      {#if error}<Callout variant="error">{error}</Callout>{/if}
      <button type="button" class="cta" disabled={connecting} onclick={connect}>
        {connecting ? 'Connecting…' : hasOpener ? 'Connect' : 'Create a connection code'}
      </button>
    {/if}
  </div>
</div>

<style>
  div.page {
    max-width: 600px;
    margin: auto;
    padding: 0 1em;
  }
  h1 {
    text-align: center;
    text-shadow: 0 0 10px black;
  }
  div.card {
    display: flex;
    flex-direction: column;
    gap: 1em;
    text-align: center;
    background: rgba(14, 11, 28, 0.9);
    border: 3px double #5e5a75;
    border-radius: 8px;
    padding: 1.5em;
  }
  div.card p {
    margin: 0;
  }
  p.hint {
    font-size: 0.85em;
    color: rgba(255, 255, 255, 0.6);
  }
  button.cta {
    align-self: center;
  }
  code.token {
    word-break: break-all;
    user-select: all;
    padding: 0.75em;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.3);
  }
  button.cta:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
