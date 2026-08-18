<script>
  import { browser } from '$app/environment'
  import { goto } from '$app/navigation'
  import { resolve } from '$app/paths'
  import { authData, ONBOARDING_DONE_STATES } from '$lib/stores'
  import { pb } from '$lib/pocketbase'
  import { refreshOwnedBadges } from '$lib/badges'
  import { toast } from '@zerodevx/svelte-toast'

  const ONBOARDING_BADGE_ID = 'onl0wktktek3bn8'

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

  // Same faction options as /agent/settings: Enlightened/Resistance always
  // offered, Machina only for supporters (set from the Profile page
  // otherwise) - see saveFaction()/the faction <select> there.
  const supporter = $derived($authData?.baseModel?.supporter)
  // /agent/settings locks Username/Faction editing while verified - the
  // users collection's updateRule enforces this server-side regardless, but
  // check here too so a verified Agent gets the same clear explanation
  // instead of the generic "something went wrong" fallback below.
  const verified = $derived($authData?.baseModel?.verification)

  // $derived (with the form controls freely overriding it via bind:value/
  // onclick), not a one-time $state snapshot - decoupled from $authData
  // .baseModel in the sense that typing here doesn't write back to global
  // auth state until a save actually succeeds (unlike /agent/settings,
  // which saves each field the moment it's toggled), but it still needs to
  // pick up the real saved values once $authData actually resolves on a
  // hard reload, otherwise these render blank/false and saving would
  // silently overwrite real values with them.
  let username = $derived($authData?.baseModel?.username || '')
  // Left blank (not defaulted to Enlightened) when unset, so the dropdown
  // doesn't visually favor one faction before the Agent has actually chosen
  // one - see the disabled placeholder <option> below.
  let faction = $derived($authData?.baseModel?.faction || '')
  let isPublic = $derived(!!$authData?.baseModel?.public)
  let newsletterOptIn = $derived(!!$authData?.baseModel?.newsletterOptIn)

  // 'profile' (this page's form), then 'tour' (a quick feature rundown),
  // then 'done' (the completion page) - all three render on /onboarding
  // itself, no navigation between them.
  let step = $state('profile')

  let submitting = $state(false)
  let formError = $state('')

  // Same wording as saveUsername()'s errorMessages on /agent/settings.
  const USERNAME_ERRORS = {
    validation_not_unique: 'The username is already taken. Please choose a different username.',
    validation_required: 'Username cannot be blank.',
    validation_min_text_constraint: 'The username is too short. It needs to be at least 3 characters long.',
    validation_max_text_constraint: 'The username is too long. It needs to be 15 characters or less.',
    validation_invalid_format: 'The username contains characters that are not allowed. You can only use letters or numbers.'
  }

  // The users collection's updateRule checks @request.body.supporter (and
  // other fields) against the record's own current value, e.g.
  // "@request.body.supporter = false || (@request.body.supporter = true &&
  // supporter = true)" - PocketBase resolves a field missing from the
  // submitted body as empty, not as "unchanged", so a partial payload with
  // only the fields we intend to change fails that comparison and PocketBase
  // 404s the whole request (its standard response for an API-rule mismatch,
  // same as a genuinely missing record). Sending the full current record
  // with just our fields overridden - the same thing /agent/settings does -
  // satisfies the rule.
  //
  // baseModel itself is only mutated from the server's confirmed response,
  // after success: mutating it optimistically before the request resolves
  // (an earlier version of this) meant a rejected save still flipped
  // onboardingState locally, which made alreadyDone true and silently
  // jumped the page to the "completed" view out from under the still-set
  // form error.
  const saveProfile = async () => {
    formError = ''
    submitting = true
    try {
      const updated = await pb.collection('users').update($authData.baseModel.id, {
        ...$authData.baseModel,
        username,
        faction,
        public: isPublic,
        newsletterOptIn
      })
      $authData.baseModel.username = updated.username
      $authData.baseModel.faction = updated.faction
      $authData.baseModel.public = updated.public
      $authData.baseModel.newsletterOptIn = updated.newsletterOptIn
      step = 'tour'
    } catch (err) {
      console.error('Failed to save profile during onboarding:', err)
      const errorCode = err.response?.data?.username?.code
      formError = USERNAME_ERRORS[errorCode] || 'Something went wrong saving your profile. Please try again.'
    } finally {
      submitting = false
    }
  }

  // Reaching the completion step is itself "finishing" onboarding - claimed
  // once, same pattern as the inProgress effect above, so navigating away
  // and back to this step (e.g. via the browser back button) doesn't
  // re-fire the writes below.
  let completedClaimed = $state(false)

  // The Onboarded! badge is flagged unobtainable, so user_badges' createRule
  // special-cases its id and additionally requires @request.auth.onboardingState
  // to already be "completed" - the award can only go through once the
  // server has actually recorded onboarding as done, which is why this
  // waits on setOnboardingState('completed') rather than firing alongside
  // it. Best-effort: a failure here (e.g. the badge was already awarded in
  // an earlier session) shouldn't block the completion screen.
  const awardOnboardedBadge = async () => {
    try {
      await pb.collection('user_badges').create({ user: $authData.baseModel.id, badge: ONBOARDING_BADGE_ID })
      // Without this, ownedBadges (populated at login/mount) stays stale
      // until a full reload, so /agent wouldn't show the new badge right
      // after navigating there from the completion step.
      await refreshOwnedBadges()
    } catch (err) {
      console.error('Failed to award the Onboarded! badge:', err)
    }
  }

  $effect(() => {
    if (step !== 'done' || completedClaimed) return
    completedClaimed = true
    setOnboardingState('completed')
      .then(awardOnboardedBadge)
      .catch((err) => {
        // setOnboardingState's own PATCH failed (the badge award already
        // handles its own errors) - step is already 'done' at this point,
        // so without this the completion screen would keep claiming success
        // even though onboardingState was never actually persisted. Send
        // the Agent back to the tour step so "Finish" can be retried.
        console.error('Failed to mark onboarding as completed:', err)
        toast.push('Something went wrong finishing onboarding. Please try again.', { classes: ['errorToast'] })
        completedClaimed = false
        step = 'tour'
      })
  })

  // Dev-only shortcuts to jump directly to any onboardingState value,
  // bypassing the guided steps above - not meant to ship long-term.
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
    {#if step === 'done'}
      <h1>Onboarding Completed!</h1>
      <p>
        Awesome, {username || 'Agent'} - your profile is now all set up, and you've earned the "Onboarded!"
        badge for your Ingress Plus profile. You can view it on your profile anytime. Feel free to explore
        the site now.
      </p>
      <img class="earned-badge" src="/images/onboarding/ingressplus_onboarded.png" alt="Onboarded! badge" />
      <button type="button" class="cta" disabled={savingState === 'completed'} onclick={() => goto(resolve('/agent'))}>
        {savingState === 'completed' ? 'Finishing…' : 'View Your Profile'}
      </button>
    {:else if alreadyDone}
      <h1>You're all set, {username || 'Agent'}.</h1>
      <p>You've already been through the Onboarding. Head back to the <a href={resolve('/')}>homepage</a> to keep exploring or
        reset the Onboarding below to restart the Onboarding.</p>
      <button type="button" class="cta" disabled={savingState !== null} onclick={resetOnboarding}>
        {savingState === 'notStarted' ? 'Resetting…' : 'Reset Onboarding'}
      </button>
    {:else if step === 'profile'}
      <h1>Welcome to Ingress Plus, Agent.</h1>
      <p>
        This is where we'll walk you through setting up your Agent name, choosing a Faction as well as a few
        other things. Once completed you will be awarded a special "Onboarded!" medal for your Ingress Plus
        profile!
      </p>

      <form class="onboarding-form" onsubmit={(e) => { e.preventDefault(); saveProfile() }}>
        {#if verified}
          <p class="locked-note">
            Your Username and Faction are locked while your account is verified - un-verify from the
            <a href={resolve('/agent/settings')}>Profile Settings</a> page to change them.
          </p>
        {/if}

        <div class="field">
          <label for="onboarding-username">Agent Name</label>
          <input
            id="onboarding-username"
            type="text"
            maxlength="15"
            bind:value={username}
            disabled={verified}
            class:locked={verified}
            style="color: var(--color-faction-{faction || 'unaligned'})"
          />
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
            disabled={verified}
            class:locked={verified}
            style="color: var(--color-faction-{faction || 'unaligned'})"
          >
            <option value="" disabled>Select a Faction</option>
            <option value="enlightened">Enlightened</option>
            <option value="resistance">Resistance</option>
            {#if supporter === true}
              <option value="machina">Machina</option>
            {/if}
          </select>
          <p class="explanation">
            Colors your Agent name and some site theming to match your faction. You can leave this unset
            if you want.
            {#if supporter === true}
              As a Supporter, Machina is available to you too!
            {:else}
              People that support the site via Ko-Fi can also pick Machina from their Profile page after onboarding!
            {/if}
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
            When public, anyone can view your earned badges at ingress.plus/agent/{username || 'YOUR_USERNAME_HERE'}. When
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
            Occasional emails from the Ingress Plus team such as new features and announcements.
            You can change this anytime from your Profile page. Note that you will still recieve emails for important updates.
          </p>
        </div>

        {#if formError}
          <p class="form-error">{formError}</p>
        {/if}

        <button type="submit" class="cta" disabled={submitting}>
          {submitting ? 'Saving…' : 'Continue'}
        </button>
      </form>
    {:else if step === 'tour'}
      <h1>Just a couple more things, {username || 'Agent'}.</h1>
      <p>This is a quick rundown of what you'll find around Ingress Plus:</p>

      <div class="tour">
        <div class="tour-item">
          <h3><img src="/images/medal.svg" alt="" /> Badges</h3>
          <p>
            You can mark off your Badges that you have obtained in Ingress and keep track of which Badges
            you are still missing. We recommend importing your stats from the Scanner to automatically mark off your
            first Badges.
          </p>
        </div>
        <div class="tour-item">
          <h3><img src="/images/mediagress.png" alt="" /> Mediagress</h3>
          <p>
            Mediagress is a public archive of Media items that have been discovered and submitted by other Agents.
            If you have any Media in your inventory that you want to upload, head over to Mediagress and follow the
            instructions to install our IITC plugin. Note that you will need a C.O.R.E. Subscription to upload!
          </p>
        </div>
        <div class="tour-item">
          <h3><img src="/images/event.svg" alt="" /> Events</h3>
          <p>
            Check which Events are currently scheduled, what Badges and/or items they reward and easily add them
            to your personal calendar with a simple click.
          </p>
        </div>
        <div class="tour-item">
          <h3><img src="/images/tools.svg" alt="" /> Tools</h3>
          <p>
            Ingress Plus containes various tools, such as an CMU Calculator that you can use to infer the real price
            of in-game store items or the GDPR Explorer to which you can upload your GDPR Export to analyze it and reveal
            stats that the Scanner doesn't show.
          </p>
        </div>
      </div>

      <button type="button" class="cta" onclick={() => (step = 'done')}>
        Finish
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
  p.locked-note {
    color: #e07b54;
    font-size: 0.9em;
    margin: 0;
  }
  input.locked,
  select.locked {
    cursor: not-allowed;
    opacity: 0.5;
  }
  div.tour {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: stretch;
    gap: 1em;
    width: 100%;
    max-width: 700px;
    margin-top: 0;
  }
  div.tour-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    align-self: stretch;
    height: 100%;
    gap: 0.35em;
    text-align: center;
    padding: 1em;
    margin-top: 0;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
    box-sizing: border-box;
  }
  @media (max-width: 550px) {
    div.tour {
      grid-template-columns: 1fr;
    }
  }
  div.tour-item h3 {
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5em;
    text-shadow: 0 0 10px black;
  }
  div.tour-item h3 img {
    height: 1.5em;
    width: 1.5em;
    border-radius: 6px;
  }
  div.tour-item p {
    margin: 0;
    text-align: center;
    max-width: none;
  }
  img.earned-badge {
    width: 160px;
    height: 160px;
    filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.25));
    animation: badge-fade-spin-in 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  @keyframes badge-fade-spin-in {
    from {
      opacity: 0;
      transform: scale(0.4) rotate(-180deg);
    }
    to {
      opacity: 1;
      transform: scale(1) rotate(0deg);
    }
  }
</style>
