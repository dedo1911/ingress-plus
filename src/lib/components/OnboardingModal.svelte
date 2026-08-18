<script>
  import { goto } from '$app/navigation'
  import { resolve } from '$app/paths'
  import { toast } from '@zerodevx/svelte-toast'
  import { authData } from '$lib/stores'
  import { pb } from '$lib/pocketbase'
  import Modal from '$lib/components/Modal.svelte'

  let { showModal = $bindable() } = $props()

  const isInProgress = $derived($authData?.baseModel?.onboardingState === 'inProgress')

  let saving = $state(false)

  const setOnboardingState = async (value) => {
    saving = true
    const previousState = $authData.baseModel.onboardingState
    try {
      $authData.baseModel.onboardingState = value
      await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
    } catch (err) {
      // The modal is already closed by the time notNow()/never() call this,
      // so revert the optimistic mutation rather than leaving local state
      // claiming a state the server never actually recorded - otherwise a
      // same-session navigation to /onboarding would read the wrong value
      // straight off this same object until the next full reload.
      $authData.baseModel.onboardingState = previousState
      console.error('Failed to update onboarding state:', err)
      toast.push('Something went wrong. Please try again.', { classes: ['errorToast'] })
    } finally {
      saving = false
    }
  }

  // Doesn't write anything itself - /onboarding claims "inProgress" once the
  // Agent actually lands there, so a closed tab or a browser back-button
  // before that point doesn't falsely mark onboarding as started.
  const startOnboarding = () => {
    showModal = false
    goto(resolve('/onboarding'))
  }

  const notNow = async () => {
    showModal = false
    await setOnboardingState('notStarted')
  }

  const never = async () => {
    showModal = false
    await setOnboardingState('skipped')
  }
</script>

<Modal bind:showModal dismissible={false}>
  <div class="onboarding-card">
    {#if isInProgress}
      <h2>Welcome back, Agent!</h2>
      <p>
        You haven't completed the Onboarding yet. If you want to continue and set up your profile,
        just click on "Continue" below. Otherwise, you can click on "Skip Onboarding" to skip the Onboarding.<br>
        <br>
        You can always restart the Onboarding from your Profile if you do change your mind!
      </p>
    {:else}
      <h2>Welcome, Agent!</h2>
      <p>
        Let's get your Ingress Plus profile set up. We'll walk you through a short Onboarding by picking your Agent name, choosing
        a Faction and more, as well a quick rundown of what you can do on this site.<br>
        <br>
        You can skip this Onboarding by clicking on "Skip Onboarding" below. You can always restart the Onboarding from your Profile if you do change your mind!
      </p>
    {/if}
    <div class="actions">
      <button type="button" class="cta" disabled={saving} onclick={startOnboarding}>
        {isInProgress ? 'Continue' : "Let's Go"}
      </button>
      <div class="skip-actions">
        <button type="button" class="skip-link" disabled={saving} onclick={notNow}>Not now</button>
        <button type="button" class="skip-link" disabled={saving} onclick={never}>Skip Onboarding</button>
      </div>
    </div>
  </div>
</Modal>

<style>
  .onboarding-card {
    display: flex;
    flex-direction: column;
    gap: 1em;
    background: rgba(14, 11, 28, 0.9);
    border: 3px double #5e5a75;
    border-radius: 8px;
    padding: 1.5em;
    text-align: center;
  }
  h2 {
    margin: 0;
    text-shadow: 0 0 10px black;
  }
  p {
    margin: 0;
    text-align: center;
  }
  .actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75em;
    margin-top: 0.5em;
  }
  button.cta {
    max-width: none;
    width: 100%;
  }
  .skip-actions {
    display: flex;
    gap: 1.5em;
  }
  button.skip-link {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    text-decoration: underline;
    cursor: pointer;
    font-size: 0.9em;
  }
  button.skip-link:hover {
    color: #fff;
  }
  button.skip-link:disabled,
  button.cta:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
