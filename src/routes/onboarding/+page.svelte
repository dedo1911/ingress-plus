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

  // Machina is supporter-only and set from the Profile page, not offered
  // here - a fresh account can't already be Machina, but if one somehow is
  // (e.g. restarting onboarding after becoming a supporter), keep it
  // selectable so submitting this form can't silently wipe it back to blank.
  const FACTION_OPTIONS = [
    { value: '', label: 'Not set yet' },
    { value: 'enlightened', label: 'Enlightened' },
    { value: 'resistance', label: 'Resistance' }
  ]
  const initialFaction = $authData?.baseModel?.faction || ''
  const factionOptions = initialFaction === 'machina'
    ? [...FACTION_OPTIONS, { value: 'machina', label: 'Machina (already set)' }]
    : FACTION_OPTIONS

  // Local, decoupled from $authData.baseModel until submit - unlike the
  // Profile settings page (which saves each field the moment it's toggled),
  // a half-filled onboarding form shouldn't leak partial edits into global
  // auth state before the Agent actually finishes it.
  let username = $state($authData?.baseModel?.username || '')
  let faction = $state(initialFaction)
  let isPublic = $state(!!$authData?.baseModel?.public)
  let newsletterOptIn = $state(!!$authData?.baseModel?.newsletterOptIn)

  let submitting = $state(false)
  let formError = $state('')

  const USERNAME_ERRORS = {
    validation_not_unique: 'This username is already taken.',
    validation_required: 'Username cannot be blank.',
    validation_min_text_constraint: 'Username needs to be at least 3 characters.',
    validation_max_text_constraint: 'Username needs to be 15 characters or less.',
    validation_invalid_format: 'Username can only contain letters and numbers.'
  }

  const completeOnboarding = async () => {
    formError = ''
    submitting = true
    try {
      $authData.baseModel.username = username
      $authData.baseModel.faction = faction
      $authData.baseModel.public = isPublic
      $authData.baseModel.newsletterOptIn = newsletterOptIn
      $authData.baseModel.onboardingState = 'completed'
      await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
      goto(resolve('/'))
    } catch (err) {
      console.error('Failed to complete onboarding:', err)
      const errorCode = err.response?.data?.username?.code
      formError = USERNAME_ERRORS[errorCode] || 'Something went wrong saving your profile. Please try again.'
    } finally {
      submitting = false
    }
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
  <title>Ingress Plus &middot; Onboarding</title>
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
      <h1>Welcome to Ingress Plus, Agent..</h1>
      <p>
        This is where we'll walk you through setting up your Agent name, choosing a Faction as well as a few
        other things. Once completed you will be awarded a special "Onboarded!" medal for your Ingress Plus
        profile!
      </p>

      <form class="onboarding-form" onsubmit={(e) => { e.preventDefault(); completeOnboarding() }}>
        <div class="field">
          <label for="onboarding-username">Agent Name</label>
          <input id="onboarding-username" type="text" maxlength="15" bind:value={username} />
          <p class="explanation">
            Your public Agent name, shown across Ingress Plus. We suggest matching your in-game Agent name
            so other Agents recognize you. 3-15 characters, letters and numbers only.
          </p>
        </div>

        <div class="field">
          <label for="onboarding-faction">Faction</label>
          <select
            id="onboarding-faction"
            bind:value={faction}
            style="color: var(--color-faction-{faction || 'unaligned'})"
          >
            {#each factionOptions as opt (opt.value)}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
          <p class="explanation">
            Colors your Agent name and some site theming to match your side. Only Enlightened and Resistance
            are offered here - Supporters can switch to Machina later from their Profile page.
          </p>
        </div>

        <div class="field">
          <label class="checkbox-label">
            <button type="button" class="checkbox-toggle" onclick={() => (isPublic = !isPublic)}>
              <img class="checkbox" src="/images/{isPublic ? 'checkbox_on' : 'checkbox_off'}.png" alt="Checkbox" />
            </button>
            Make my profile public
          </label>
          <p class="explanation">
            When public, anyone can view your earned badges at ingress.plus/agent/{username || '...'}. When
            private, only you can see it. You can change this anytime from your Profile page.
          </p>
        </div>

        <div class="field">
          <label class="checkbox-label">
            <button type="button" class="checkbox-toggle" onclick={() => (newsletterOptIn = !newsletterOptIn)}>
              <img class="checkbox" src="/images/{newsletterOptIn ? 'checkbox_on' : 'checkbox_off'}.png" alt="Checkbox" />
            </button>
            Send me newsletters and update emails
          </label>
          <p class="explanation">
            Occasional emails from the Ingress Plus team - new features, event announcements, and important
            updates. You can change this anytime from your Profile page.
          </p>
        </div>

        {#if formError}
          <p class="form-error">{formError}</p>
        {/if}

        <button type="submit" class="cta" disabled={submitting}>
          {submitting ? 'Saving…' : 'Complete Onboarding'}
        </button>
      </form>
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
  form.onboarding-form {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 1.25em;
    width: 100%;
    max-width: 480px;
    text-align: left;
  }
  div.field {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.35em;
    text-align: left;
    max-width: none;
    padding: 0;
    margin: 0;
    line-height: 1.2em;
  }
  div.field label {
    font-weight: bold;
  }
  div.field label.checkbox-label {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.5em;
    cursor: pointer;
  }
  div.field input[type=text],
  div.field select {
    width: 100%;
    box-sizing: border-box;
  }
  button.checkbox-toggle {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    line-height: 0;
  }
  img.checkbox {
    height: 1.25em;
  }
  p.explanation {
    margin: 0;
    font-size: 0.85em;
    color: rgba(255, 255, 255, 0.6);
    text-align: left;
    max-width: none;
  }
  p.form-error {
    color: #e07b54;
    text-align: center;
    margin: 0;
  }
</style>
