<script>
  import { authData } from '$lib/stores'
  import { featureFlags } from '$lib/featureFlags'
  import { pb } from '$lib/pocketbase'
  import { toast } from '@zerodevx/svelte-toast'
  import AgentName from '$lib/components/AgentName.svelte'
  import { browser } from '$app/environment'
  import { goto } from '$app/navigation'
  import { resolve } from '$app/paths'

  const username = $derived($authData?.baseModel?.username || 'NONE')
  const userId = $derived($authData?.baseModel?.id || 'NONE')
  const email = $derived($authData?.baseModel?.email || 'UNKNOWN')
  const supporter = $derived($authData?.baseModel?.supporter)
  const verified = $derived($authData?.baseModel?.verification)

  let reloadKey = $state(0)

  const handleToggleUsernameGlow = async () => {
    await toggleUsernameGlow()
    reloadKey += 1 // Force AgentName to reload
  }

  const togglePublic = async () => {
    $authData.baseModel.public = !$authData.baseModel.public
    await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
    if ($authData.baseModel.public) {
      toast.push('Profile has been set to public!', { classes: ['successToast'] })
    } else {
      toast.push('Profile has been set to private!', { classes: ['successToast'] })
    }
  }

  const toggleNewsletter = async () => {
    $authData.baseModel.newsletterOptIn = !$authData.baseModel.newsletterOptIn
    await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
    if ($authData.baseModel.newsletterOptIn) {
      toast.push('You have been subscribed to newsletters and update emails!', { classes: ['successToast'] })
    } else {
      toast.push('You have been unsubscribed from newsletters and update emails.', { classes: ['successToast'] })
    }
  }

  const copyProfileLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://ingress.plus/agent/${newUsername}`)
      toast.push('Copied to clipboard!', { classes: ['successToast'] })
    } catch (err) {
      console.error(err)
      toast.push('An error has occurred.', { classes: ['errorToast'] })
    }
  }

  $effect(() => {
    if (browser && $authData.isValid === false) goto(resolve('/'))
  })

  const toggleUsernameGlow = async () => {
    $authData.baseModel.hasUsernameGlow = !$authData.baseModel.hasUsernameGlow
    await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
    if ($authData.baseModel.hasUsernameGlow) {
      toast.push('Glowing Username has been enabled!', { classes: ['successToast'] })
    } else {
      toast.push('Glowing Username has been disabled!', { classes: ['successToast'] })
    }
  }

  let selectedFaction = $state($authData?.baseModel?.faction || 'unaligned')
  let newUsername = $derived(username)

  const saveIdentity = async () => {
    if (verified) {
      toast.push('You must un-verify your account to change your Username or Faction.', { classes: ['errorToast'] })
      return
    }
    const oldUsername = $authData.baseModel.username
    const oldFaction = $authData.baseModel.faction
    if (oldUsername === newUsername && oldFaction === selectedFaction) {
      console.log('Username and Faction unchanged, skipping')
      return
    }
    try {
      $authData.baseModel.username = newUsername
      $authData.baseModel.faction = selectedFaction
      await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
      toast.push('Your Username and Faction have been updated!', { classes: ['successToast'] })
      reloadKey += 1 // Force AgentName to reload
    } catch (err) {
      $authData.baseModel.username = oldUsername
      $authData.baseModel.faction = oldFaction
      const errorCode = err.response?.data?.username?.code
      console.error('Save Identity Error:', errorCode, err)

      const errorMessages = {
        validation_not_unique: 'The username is already taken. Please choose a different username.',
        validation_required: 'Username cannot be blank.',
        validation_min_text_constraint: 'The username is too short. It needs to be at least 3 characters long.',
        validation_max_text_constraint: 'The username is too long. It needs to be 15 characters or less.',
        validation_invalid_format: 'The username contains characters that are not allowed. You can only use letters or numbers.',
      }

      const message = errorMessages[errorCode] || 'An error has occurred. Please try again later.'
      toast.push(message, { classes: ['errorToast'] })
    }
  }

  let showUnverifyConfirm = $state(false)

  const handleUnverify = async () => {
    try {
      $authData.baseModel.verification = ''
      await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
      toast.push('You have been un-verified. You may now edit your Username or Faction.', { classes: ['successToast'] })
      showUnverifyConfirm = false
    } catch (err) {
      console.error('Unverify error:', err)
      toast.push('An error occurred while un-verifying. Please try again later.', { classes: ['errorToast'] })
    }
  }

  let disableConfirmButton = $state(false)

  function showConfirmationPrompt () {
    showUnverifyConfirm = true
    disableConfirmButton = true

    setTimeout(() => {
      disableConfirmButton = false
    }, 1000) // Delay to avoid misclick
  }
</script>

<svelte:head>
  <title>Ingress Plus &middot; Settings</title>
</svelte:head>

{#snippet toggleRow({ checked, onToggle, label, explanation, onTitle, offTitle, onStatus, offStatus })}
  <div class="field">
    <label class="checkbox-label">
      <button type="button" class="checkbox-toggle" onclick={onToggle} title={checked ? onTitle : offTitle}>
        <img class="checkbox" src="/images/{checked ? 'checkbox_on' : 'checkbox_off'}.png" alt="Checkbox" />
      </button>
      <b>{label}</b> - {checked ? onStatus : offStatus}
    </label>
    <p class="explanation">{explanation}</p>
  </div>
{/snippet}

<section>
  {#if $authData.isValid}
    <h2>
      {#key reloadKey}
        <AgentName user={{ username }} linkable={false} factionLogo={true} />
      {/key}
    </h2>
    <p class="subtitle">Manage your Agent identity, privacy, and account.</p>
    <p class="back-link"><a href={resolve('/agent')}>&larr; Back to Profile</a></p>

    <div class="settings-grid">
      <div class="card identity">
        <h3>Identity</h3>
        <img class="profilePicture" src={$authData?.baseModel?.avatar.slice(0, -6)} alt={username} />

        {#if verified}
          <p class="locked-note">Your Username and Faction are locked while your account is verified - un-verify below to change them.</p>
        {/if}

        <div class="field">
          <label for="settings-username">Username</label>
          <input
            id="settings-username"
            type="text"
            maxlength="15"
            bind:value={newUsername}
            disabled={verified}
            class:locked={verified}
            style="color: var(--color-faction-{selectedFaction || 'unaligned'})"
          />
          <p class="explanation">
            Your public Agent name, shown across Ingress Plus. 3-15 characters, letters and numbers only.
          </p>
        </div>

        <div class="field">
          <label for="settings-faction">Faction</label>
          <select
            id="settings-faction"
            bind:value={selectedFaction}
            disabled={verified}
            class:locked={verified}
            style="color: var(--color-faction-{selectedFaction || 'unaligned'})"
          >
            <option value="enlightened">Enlightened</option>
            <option value="resistance">Resistance</option>
            {#if supporter === true}
              <option value="machina">Machina</option>
            {/if}
          </select>
          <p class="explanation">
            Colors your Agent name and some site theming to match your Faction.
            {#if supporter === true}
              As a Supporter, Machina is available to you too!
            {:else}
              Supporters can also select Machina.
            {/if}
          </p>
        </div>

        <button type="button" class="cta identity-save" disabled={verified} class:locked={verified} onclick={saveIdentity}>
          Save Username &amp; Faction
        </button>

        <div class="field">
          <p><b>User ID:</b> <code>ING+{userId}</code></p>
          <p class="explanation">Your internal Ingress Plus identifier. Include this if you contact support about your account.</p>
        </div>
        <div class="field">
          <p><b>E-mail:</b> <code>{email}</code></p>
        </div>
      </div>

      <div class="card">
        <h3>Privacy &amp; Notifications</h3>
        {@render toggleRow({
          checked: $authData.baseModel.public,
          onToggle: togglePublic,
          label: 'Profile visibility',
          explanation: `When public, anyone can view your earned badges at ingress.plus/agent/${newUsername}. When private, only you can see it.`,
          onTitle: 'Make Profile private',
          offTitle: 'Make Profile public',
          onStatus: 'Public',
          offStatus: 'Private'
        })}
        {#if $authData.baseModel.public}
          <p class="publicNotice">
            Your profile is public and will be visible at:<br />
            <span onclick={copyProfileLink}>
              https://ingress.plus/agent/{newUsername}
            </span>
          </p>
        {/if}
        {@render toggleRow({
          checked: $authData.baseModel.newsletterOptIn,
          onToggle: toggleNewsletter,
          label: 'Newsletter emails',
          explanation: 'Occasional emails such as new features and announcements. You will still receive emails for important account updates regardless of this setting.',
          onTitle: 'Unsubscribe from newsletters',
          offTitle: 'Subscribe to newsletters',
          onStatus: 'Subscribed',
          offStatus: 'Not subscribed'
        })}
      </div>

      {#if verified || $featureFlags.VERIFICATION_ENABLED}
        <div class="card verification">
          <h3>Verification</h3>
          {#if verified}
            {#if $featureFlags.VERIFICATION_ENABLED}
              <p>You are currently verified. You need to un-verify to change your Username or Faction.</p>
            {:else}
              <p>Verification is currently disabled. You must un-verify to edit your Username or Faction.</p>
            {/if}
            <div class="unverify-controls">
              {#if showUnverifyConfirm}
                {#if !$featureFlags.VERIFICATION_ENABLED}
                  <p class="unverify-warning">Verification is disabled and you will not be able to re-verify yourself.</p>
                {/if}
                <button
                  class="danger-button"
                  disabled={disableConfirmButton}
                  onclick={handleUnverify}
                  title={disableConfirmButton ? 'Please wait...' : 'Click to Confirm Un-Verify'}>Click to Confirm Un-Verify</button>
                <button class="secondary-button" onclick={() => { showUnverifyConfirm = false }}>Cancel</button>
              {:else}
                <button class="secondary-button" onclick={showConfirmationPrompt}>Un-Verify Account</button>
              {/if}
            </div>
          {:else}
            <p>You are not verified. You may change your Username or Faction.</p>
          {/if}
        </div>
      {/if}

      {#if supporter === true}
        <div class="card">
          <h3>Supporter Perks</h3>
          {@render toggleRow({
            checked: $authData.baseModel.hasUsernameGlow,
            onToggle: handleToggleUsernameGlow,
            label: 'Glowing username',
            explanation: 'Adds an animated shimmer and glow effect to your Agent name across the site, colored to match your Faction. Purely cosmetic.',
            onTitle: 'Disable glowing username',
            offTitle: 'Enable glowing username',
            onStatus: 'Enabled',
            offStatus: 'Disabled'
          })}
          <p class="preview">
            Preview:
            {#key reloadKey}
              <AgentName user={{ username }} linkable={false} factionLogo={true} />
            {/key}
          </p>
        </div>
      {/if}

      <div class="card">
        <h3>Account Actions</h3>
        <p class="explanation">Want to go through the setup steps again? You can revisit the Onboarding anytime.</p>
        <button type="button" class="secondary-button" onclick={() => goto(resolve('/onboarding'))}>Return to Onboarding</button>
      </div>
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
    margin: auto;
    padding: 0 1em;
    line-height: 1.2em;
    margin-top: 2em;
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
  p.back-link {
    text-align: center;
    margin: 0.5em auto 0;
  }
  p {
    text-align: center;
    margin: auto;
    max-width: 800px;
  }

  img.checkbox {
    height: 1.25em;
    vertical-align: sub;
    margin: 0 0.25em;
  }
  img.profilePicture {
    display: block;
    margin: 0 auto 1em;
    max-width: 160px;
    box-shadow: #9593c3 0px 0px 5px 1px;
    border-radius: 6px;
  }

  div.settings-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1em;
    margin-top: 1.5em;
  }
  @media (max-width: 700px) {
    div.settings-grid {
      grid-template-columns: 1fr;
    }
  }
  div.card {
    display: flex;
    flex-direction: column;
    gap: 1em;
    text-align: left;
    padding: 1em;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
    box-sizing: border-box;
  }
  div.card.identity {
    grid-column: 1 / -1;
  }
  div.card.verification {
    border-left: 4px solid #e07b54;
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

  div.field {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.35em;
    margin: 0;
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
  button.identity-save {
    max-width: none;
    width: 100%;
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

  p.publicNotice span {
    border: 3px double #5e5a75;
    border-radius: 8px;
    display: inline-block;
    padding: 1rem;
    margin-top: 1rem;
    cursor: pointer;
  }
  p.preview {
    display: flex;
    align-items: center;
    gap: 0.5em;
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
  .secondary-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .danger-button {
    padding: 0.5em 1em;
    background-color: #e07b54;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }
  .danger-button:hover {
    background-color: #c96a45;
  }
  .danger-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  div.unverify-controls {
    display: flex;
    align-items: center;
    gap: 1em;
    flex-wrap: wrap;
  }
  p.unverify-warning {
    color: #e07b54;
    margin-bottom: 0.75em;
  }
</style>
