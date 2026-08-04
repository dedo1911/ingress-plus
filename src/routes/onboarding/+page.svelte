<script>
  import { browser } from '$app/environment'
  import { goto } from '$app/navigation'
  import { resolve } from '$app/paths'
  import { authData } from '$lib/stores'
  import { pb } from '$lib/pocketbase'

  const ONBOARDING_DONE_STATES = ['completed', 'skipped']

  const alreadyDone = $derived(ONBOARDING_DONE_STATES.includes($authData?.baseModel?.onboardingState))

  $effect(() => {
    if (browser && $authData.isValid === false) goto(resolve('/'))
  })

  // Non-null while a write is in flight, holding the value being written -
  // used both to disable buttons during the request and to label whichever
  // one triggered it.
  let savingState = $state(null)

  const setOnboardingState = async (value) => {
    savingState = value
    try {
      $authData.baseModel.onboardingState = value
      await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
    } finally {
      savingState = null
    }
  }

  // Landing here is itself "starting" onboarding, regardless of how the
  // Agent got here (the modal's Let's Go button, a direct link, or coming
  // back to a session that was already mid-flow) - claim it once so the
  // welcome modal and this page agree on the state afterwards.
  let claimed = $state(false)

  $effect(() => {
    if (!$authData.isValid || claimed || alreadyDone) return
    claimed = true
    if ($authData.baseModel?.onboardingState !== 'inProgress') {
      setOnboardingState('inProgress')
    }
  })

  const resetOnboarding = () => setOnboardingState('notStarted')

  // TODO: placeholder only - replace with the real last step of the guided
  // setup (name/faction/privacy/etc.) once that flow is built.
  const finishPlaceholder = async () => {
    await setOnboardingState('completed')
    goto(resolve('/'))
  }

  // Dev-only shortcuts to jump directly to any state while the real guided
  // steps aren't built yet - not meant to ship long-term.
  const TEST_STATES = [
    { value: '', label: 'Empty' },
    { value: 'notStarted', label: 'Not Started' },
    { value: 'inProgress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'skipped', label: 'Skipped' }
  ]
</script>

<svelte:head>
  <title>Ingress Plus &middot; Get Started</title>
</svelte:head>

<div>
  {#if $authData.isValid}
    {#if alreadyDone}
      <h1>You're all set, Agent.</h1>
      <p>You've already been through onboarding. Head back to the <a href={resolve('/')}>homepage</a> to keep exploring.</p>
      <button type="button" class="cta" disabled={savingState !== null} onclick={resetOnboarding}>
        {savingState === 'notStarted' ? 'Resetting…' : 'Reset Onboarding'}
      </button>
    {:else}
      <h1>Welcome, Agent.</h1>
      <p>
        This is where we'll walk you through setting up your Agent name, choosing a Faction, deciding who can
        see your profile, and a quick rundown of how Ingress Plus works. That guided setup isn't built yet -
        for now this page is just a placeholder.
      </p>
      <button type="button" class="cta" disabled={savingState !== null} onclick={finishPlaceholder}>
        {savingState === 'completed' ? 'Finishing…' : 'Mark Onboarding as Complete (placeholder)'}
      </button>
    {/if}

    <hr />
    <div class="testing-controls">
      <p>
        <strong>Testing controls</strong> - jump directly to any <code>onboardingState</code> value.
        Current value: <code>{$authData.baseModel?.onboardingState || '(empty)'}</code>
      </p>
      <div class="test-buttons">
        {#each TEST_STATES as state (state.value)}
          <button
            type="button"
            class="test-button"
            disabled={savingState !== null}
            onclick={() => setOnboardingState(state.value)}
          >
            {savingState === state.value ? 'Setting…' : state.label}
          </button>
        {/each}
      </div>
    </div>
  {:else}
    <p>You are currently not logged in. Please log in first.</p>
  {/if}
</div>

<style>
  div {
    max-width: 800px;
    margin: auto;
    padding: 0 1em;
    line-height: 1.2em;
    margin-top: 2em;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1em;
    text-align: center;
  }
  p {
    text-align: center;
    max-width: 700px;
  }
  hr {
    width: 100%;
  }
  div.testing-controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75em;
    padding: 1em;
    border: 2px dashed rgba(255, 255, 255, 0.2);
    border-radius: 8px;
  }
  div.test-buttons {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5em;
  }
  button.test-button {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.85);
    cursor: pointer;
    padding: 0.4em 0.8em;
    font-size: 0.85em;
  }
  button.test-button:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
  }
  button.test-button:disabled,
  button.cta:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
