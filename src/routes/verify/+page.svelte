<script>
  import { goto } from '$app/navigation'
  import { resolve } from '$app/paths'
  import { browser } from '$app/environment'
  import { authData } from '$lib/stores'
  import { featureFlags, featureFlagsLoaded } from '$lib/featureFlags'
  import { pb } from '$lib/pocketbase'
  import { toast } from '@zerodevx/svelte-toast'

  const username = $derived($authData?.baseModel?.username || 'NONE')
  const verification = $derived($authData?.baseModel?.verification || 'NONE')
  const userId = $derived($authData?.baseModel?.id || 'NONE')
  const supporter = $derived($authData?.baseModel?.supporter)
  const verified = $derived(!!$authData?.baseModel?.verification)

  // $derived rather than a $state snapshot, for the reason /agent/settings
  // documents: on a hard reload these are read before authData resolves, and a
  // frozen snapshot would later be saved back over the Agent's real values.
  let newUsername = $derived($authData?.baseModel?.username || '')
  let selectedFaction = $derived($authData?.baseModel?.faction || 'unaligned')

  // The name a save came back "already taken" for. It is held separately from
  // the input because that is the only way an Agent whose name is held by
  // someone else can ever be verified - usernames are unique, so their own
  // profile cannot carry it - and because the failed save rolls the profile
  // back underneath the input.
  let claimedUsername = $state('')
  let contested = $state(false)
  let saving = $state(false)

  let tier = $state('advanced')
  let minting = $state(false)
  let issued = $state(null)

  // The tick only counts while it still refers to the name that was refused -
  // editing the field afterwards hides the checkbox and drops the claim.
  const isContested = $derived(contested && claimedUsername !== '' && claimedUsername === newUsername)

  // Basic proves nothing, so it can never take a name off another account.
  const tiers = $derived(isContested ? ['advanced', 'strong'] : ['basic', 'advanced', 'strong'])

  $effect(() => {
    if (browser && $featureFlagsLoaded && !$featureFlags.VERIFICATION_ENABLED) goto(resolve('/'))
  })

  $effect(() => {
    if (isContested && tier === 'basic') tier = 'advanced'
  })

  const saveIdentity = async () => {
    if (verified) {
      toast.push('Un-verify your account first to change your Username or Faction.', { classes: ['errorToast'] })
      return
    }
    const oldUsername = $authData.baseModel.username
    const oldFaction = $authData.baseModel.faction
    if (oldUsername === newUsername && oldFaction === selectedFaction) return

    saving = true
    try {
      $authData.baseModel.username = newUsername
      $authData.baseModel.faction = selectedFaction
      await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
      claimedUsername = ''
      contested = false
      toast.push('Your Username and Faction have been updated!', { classes: ['successToast'] })
    } catch (err) {
      $authData.baseModel.username = oldUsername
      $authData.baseModel.faction = oldFaction
      const errorCode = err.response?.data?.username?.code
      console.error('Save Identity Error:', errorCode, err)

      // Same mapping as /agent/settings - keep the two in step.
      const errorMessages = {
        validation_not_unique: 'That username is already taken by another account.',
        validation_required: 'Username cannot be blank.',
        validation_min_text_constraint: 'The username is too short. It needs to be at least 3 characters long.',
        validation_max_text_constraint: 'The username is too long. It needs to be 15 characters or less.',
        validation_invalid_format: 'The username contains characters that are not allowed. You can only use letters or numbers.'
      }

      claimedUsername = errorCode === 'validation_not_unique' ? newUsername : ''
      toast.push(errorMessages[errorCode] || 'An error has occurred. Please try again later.', { classes: ['errorToast'] })
    } finally {
      saving = false
    }
  }

  const getCode = async () => {
    minting = true
    issued = null
    try {
      issued = await pb.send('/api/verification/mint', {
        method: 'POST',
        body: {
          tier,
          contested: isContested,
          claimedUsername: isContested ? claimedUsername : ''
        }
      })
    } catch (err) {
      console.error('Mint verification error:', err)
      toast.push(err.response?.error || 'Could not get a verification code. Please try again later.', { classes: ['errorToast'] })
    } finally {
      minting = false
    }
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(issued.code)
      toast.push('Code copied.', { classes: ['successToast'] })
    } catch {
      // Clipboard access can be refused outright; the code is on screen anyway.
      toast.push('Could not copy - select the code and copy it manually.', { classes: ['errorToast'] })
    }
  }

  const expiresAt = $derived(issued?.expiresAt ? new Date(issued.expiresAt.replace(' ', 'T')).toLocaleTimeString() : '')
</script>

<svelte:head>
  <title>Ingress Plus &middot; Verification</title>
</svelte:head>

<section>
  {#if $authData.isValid}
    <h2>Agent Verification</h2>
    <p class="subtitle">Prove that this account is your Ingress Agent, so we can attribute what you contribute.</p>

    <div class="card">
      <h3>Your Agent details</h3>
      <img class="profilePicture" src={$authData?.baseModel?.avatar.slice(0, -6)} alt={username} />

      {#if verified}
        <p class="locked-note">
          You are verified at the <code>{verification.toUpperCase()}</code> level. Your Username and
          Faction are locked - <a href={resolve('/agent/settings')}>un-verify on your settings page</a>
          to change them, or to verify again at a different level.
        </p>
      {:else}
        <p class="explanation">
          These have to match your Ingress Agent exactly before any level can be granted. We never
          change them for you.
        </p>
      {/if}

      <div class="field">
        <label for="verify-username">Username</label>
        <input
          id="verify-username"
          type="text"
          maxlength="15"
          bind:value={newUsername}
          disabled={verified}
          class:locked={verified}
          style="color: var(--color-faction-{selectedFaction || 'unaligned'})"
        />
      </div>

      <div class="field">
        <label for="verify-faction">Faction</label>
        <select
          id="verify-faction"
          bind:value={selectedFaction}
          disabled={verified}
          class:locked={verified}
          style="color: var(--color-faction-{selectedFaction || 'unaligned'})"
        >
          <option value="enlightened">Enlightened</option>
          <option value="resistance">Resistance</option>
          {#if supporter === true}
            <option value="machina">MACHINA</option>
          {/if}
        </select>
        {#if selectedFaction === 'machina'}
          <p class="locked-note">
            A Machina Agent can never match a COMM message, so Machina accounts stay manual admin
            grants. Ask in the Telegram group.
          </p>
        {/if}
      </div>

      <button type="button" class="cta" disabled={verified || saving} class:locked={verified} onclick={saveIdentity}>
        Save Username &amp; Faction
      </button>

      {#if claimedUsername && claimedUsername === newUsername}
        <div class="field contested">
          <label class="checkbox-label">
            <input type="checkbox" bind:checked={contested} />
            <b>That is my Agent name and another account is using it.</b>
          </label>
          <p class="explanation">
            Tick this only if <code>{claimedUsername}</code> really is your in-game name. You will have to
            prove it at the Advanced or Strong level - Basic is not enough. If you do, the name is
            moved to this account and the other account is renamed and un-verified.
          </p>
        </div>
      {/if}

      <p class="explanation">Your User ID is <code>ING+{userId}</code></p>
    </div>

    <div class="card">
      <h3>Get a verification code</h3>

      <div class="field">
        <label for="verify-tier">Verification level</label>
        <select id="verify-tier" bind:value={tier}>
          {#each tiers as option (option)}
            <option value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</option>
          {/each}
        </select>
      </div>

      {#if tier === 'basic'}
        <p class="explanation">
          The plugin reports the name and faction your own browser is showing, and we check they match
          the ones above. That is all - <b>it proves nothing</b>, and it does not attribute any Media
          you have uploaded. It still locks your Username and Faction.
        </p>
      {:else if tier === 'advanced'}
        <p class="explanation">
          The plugin posts a one-time code to COMM for you, at a spot in the middle of the Pacific
          where nobody will see it. An admin reads it back: the message carries your Agent name
          <i>and</i> your faction, straight from Niantic. Media you have uploaded under this name is
          attributed to you. No C.O.R.E. subscription needed.
        </p>
      {:else}
        <p class="explanation">
          Everything Advanced does, plus your Ingress player ID read from your own C.O.R.E. inventory,
          which ties your uploads to you exactly rather than by name. Requires a C.O.R.E.
          subscription.
        </p>
      {/if}

      <button type="button" class="cta" disabled={minting || (verified && verification === 'strong')} onclick={getCode}>
        {minting ? 'Working...' : 'Get a verification code'}
      </button>

      {#if issued}
        <div class="issued">
          <p class="code"><code>{issued.code}</code></p>
          <button type="button" class="secondary-button" onclick={copyCode}>Copy</button>
          <p class="explanation">
            Paste it into the Ingress Plus plugin on the Intel map. It is valid until {expiresAt} and
            can only be used once - asking again before then gives you the same code back.
            {#if tier !== 'basic'}
              The plugin posts to COMM for you; an admin then confirms it, which can take a while.
            {/if}
          </p>
        </div>
      {/if}
    </div>
  {:else}
    <p style="margin-top:2em;">
      You are currently not logged in. Please log in first.
    </p>
  {/if}
</section>

<style>
  section {
    max-width: 1000px;
    margin: 2em auto;
    padding: 0 1em;
    line-height: 1.2em;
  }
  h2 {
    text-align: center;
    text-shadow: 0 0 10px black;
    margin-bottom: 0.25em;
  }
  p.subtitle {
    text-align: center;
    margin: 0 auto;
    color: rgba(255, 255, 255, 0.6);
  }

  div.card {
    display: flex;
    flex-direction: column;
    gap: 1em;
    text-align: left;
    padding: 1em;
    margin-top: 1.5em;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
    box-sizing: border-box;
  }
  div.card h3 {
    margin: 0;
    text-align: center;
    text-shadow: 0 0 10px black;
  }
  div.card p {
    text-align: left;
    margin: 0;
    max-width: none;
  }

  img.profilePicture {
    display: block;
    margin: 0 auto;
    max-width: 160px;
    box-shadow: #9593c3 0px 0px 5px 1px;
    border-radius: 6px;
  }

  div.field {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.35em;
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
  div.field.contested {
    padding: 0.75em;
    border-left: 4px solid #e07b54;
    background: rgba(224, 123, 84, 0.08);
  }

  p.explanation {
    margin: 0;
    font-size: 0.85em;
    color: rgba(255, 255, 255, 0.6);
  }
  p.locked-note {
    margin: 0;
    font-size: 0.9em;
    color: #e07b54;
  }
  input.locked,
  select.locked,
  button.locked {
    cursor: not-allowed;
    opacity: 0.5;
  }

  div.issued {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75em;
    padding: 1em;
    border: 1px dashed rgba(255, 255, 255, 0.25);
    border-radius: 8px;
  }
  p.code {
    font-size: 1.6em;
    letter-spacing: 0.1em;
    text-align: center !important;
  }

  .secondary-button {
    padding: 0.5em 1em;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.85);
    cursor: pointer;
  }
  .secondary-button:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
  }
  button.cta:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
