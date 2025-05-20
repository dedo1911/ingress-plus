<script>
  import { authData } from "$lib/stores"
  import { pb } from '$lib/pocketbase'
  import { toast } from '@zerodevx/svelte-toast'
  import AgentName from '$lib/components/AgentName.svelte'
  import { browser } from '$app/environment'

  const username = $derived($authData?.baseModel?.username || "NONE")
  const userId = $derived($authData?.baseModel?.id || "NONE")
  const email = $derived($authData?.baseModel?.email || "UNKNOWN")
  const supporter = $derived($authData?.baseModel?.supporter)
  const verified = $derived($authData?.baseModel?.verification)

  let reloadKey = $state(0);

  const handleToggleUsernameGlow = async () => {
    await toggleUsernameGlow();
    reloadKey += 1; // Force AgentName to reload
  };

  const handleSaveUsername = async () => {
    if (verified) {
      toast.push('You must un-verify your account to change your username.', { classes: ['errorToast'] });
      return;
    }
    await saveUsername();
    reloadKey += 1; // Force AgentName to reload
  };

  const handleSaveFaction = async () => {
    if (verified) {
      toast.push('You must un-verify your account to change your faction.', { classes: ['errorToast'] });
      return;
    }
    await saveFaction();
    reloadKey += 1; // Force AgentName to reload
  };

  const togglePublic = async () => {
    $authData.baseModel.public = !$authData.baseModel.public
    await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
    if ($authData.baseModel.public) {
      toast.push('Profile has been set to public!', { classes: ['successToast'] })
    }
    else {
      toast.push('Profile has been set to private!', { classes: ['successToast'] })
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
    if (browser && $authData.isValid === false) goto('/')
  })

  const toggleUsernameGlow = async () => {
    $authData.baseModel.hasUsernameGlow = !$authData.baseModel.hasUsernameGlow
    await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
    if ($authData.baseModel.hasUsernameGlow) {
      toast.push('Glowing Username has been enabled!', { classes: ['successToast'] })
    }
    else {
      toast.push('Glowing Username has been disabled!', { classes: ['successToast'] })
    }
  }

  let selectedFaction = $state($authData?.baseModel?.faction || 'unaligned');

  const saveFaction = async () => {
    if ($authData.baseModel.faction == selectedFaction) {
      console.log('Faction same as before, skipping')
      return
    }
  $authData.baseModel.faction = selectedFaction;
  await pb.collection('users').update($authData.baseModel.id, $authData.baseModel);
  toast.push('Faction has been changed to ' + selectedFaction.charAt(0).toUpperCase() + selectedFaction.slice(1) + '!', {
    classes: ['successToast']
  });
  };


  let newUsername = $state('')
  $effect(() => {
    newUsername = username
  })

  const saveUsername = async () => {
    const oldUsername = $authData.baseModel.username
    if (oldUsername == newUsername) {
      console.log('Username same as before, skipping')
      return
    }
    try {
      $authData.baseModel.username = newUsername
      await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
      toast.push('Username has been changed to ' + $authData.baseModel.username, { classes: ['successToast'] })
    } catch (err) {
      $authData.baseModel.username = oldUsername;
      const errorCode = err.response?.data?.username?.code;
      console.error('Username Error:', errorCode, err);

      const errorMessages = {
        validation_not_unique: 'The username is already taken. Please choose a different username.',
        validation_required: 'Username cannot be blank.',
        validation_min_text_constraint: 'The username is too short. It needs to be at least 3 characters long.',
        validation_max_text_constraint: 'The username is too long. It needs to be 15 characters or less.',
        validation_invalid_format: 'The username contains characters that are not allowed. You can only use letters or numbers.',
      };

      const message = errorMessages[errorCode] || 'An error has occurred. Please try again later.';
      toast.push(message, { classes: ['errorToast'] });
    }

  }

  const factionLogo = $derived($authData?.baseModel?.faction === 'machina'
    ? '/machina.png'
    : `/${$authData?.baseModel?.faction || 'unaligned'}.svg`)

    let showUnverifyConfirm = $state(false)

    const handleUnverify = async () => {
      try {
        $authData.baseModel.verification = "";
        await pb.collection('users').update($authData.baseModel.id, $authData.baseModel);
        toast.push('You have been un-verified. You may now edit your Username or Faction.', { classes: ['successToast'] });
        showUnverifyConfirm = false;
      } catch (err) {
        console.error('Unverify error:', err);
        toast.push('An error occurred while un-verifying. Please try again later.', { classes: ['errorToast'] });
      }
    };

    let disableConfirmButton = $state(false);

    function showConfirmationPrompt() {
      showUnverifyConfirm = true;
      disableConfirmButton = true;

      setTimeout(() => {
        disableConfirmButton = false;
      }, 1000); // Delay to avoid misclick
    }

</script>

<svelte:head>
  <title>Ingress Plus &middot; Settings</title>
</svelte:head>

<div>
  {#if $authData.isValid}
      <div class="profileData">
          <p>
              <img
                  class="profilePicture"
                  src={$authData?.baseModel?.avatar.slice(0, -6)}
                  alt={username}
              />
          </p>
          <p><b>Username</b>: 
            <input type="text" maxlength="15" bind:value={newUsername} disabled={verified} style="color: var(--color-faction-{$authData?.baseModel?.faction || 'unaligned'}); cursor: {verified ? 'not-allowed' : 'pointer'}; opacity: {verified ? 0.5 : 1}" />
            <img src="../images/accept.svg" height="32" alt="Save" onclick={handleSaveUsername} disabled={verified} style="cursor: {verified ? 'not-allowed' : 'pointer'}; opacity: {verified ? 0.5 : 1}"/>
          </p>
          <p>
            <b>Faction</b>: 
            <select bind:value={selectedFaction} disabled={verified} style="color: var(--color-faction-{$authData?.baseModel?.faction || 'unaligned'}); cursor: {verified ? 'not-allowed' : 'pointer'}; opacity: {verified ? 0.5 : 1}">
              <option value="enlightened" >Enlightened</option>
              <option value="resistance">Resistance</option>
              {#if supporter === true}
              <option value="machina">Machina</option>
              {/if}
            </select>
            <button onclick={handleSaveFaction} style="cursor: {verified ? 'not-allowed' : 'pointer'}; opacity: {verified ? 0.5 : 1}">
              <img src="../images/accept.svg" height="24" alt="Save faction" />
            </button>
          </p>
          <p><b>Profile visiblity</b>:
            <button onclick={togglePublic} title={$authData.baseModel.public ? 'Make Profile private' : 'Make Profile public'}>
              <img
                class="checkbox"
                src="../images/{$authData.baseModel.public ? 'checkbox_on' : 'checkbox_off'}.png"
                alt="Checkbox"
              />
            </button>
            - {$authData.baseModel.public ? 'Public' : 'Private'}</p>
            {#if $authData.baseModel.public}
            <p class="publicNotice">
              Your profile is public and will be visible at:<br />
              <span onclick={copyProfileLink}>
              https://ingress.plus/agent/{newUsername}
              </span>
            </p>
            {/if}
            <br>
          <p><b>User ID:</b> <code>ING+{userId}</code></p>
          <p><b>E-mail:</b> <code>{email}</code></p>
          {#if verified}
            <p>You are currently verified. You need to un-verify to change your Username or Faction.</p>
            <div style="text-align: center; margin-top: 0.5em;">
              {#if showUnverifyConfirm}
                <button 
                  class="unverify-button"
                  disabled={disableConfirmButton}
                  onclick={handleUnverify}
                  title={disableConfirmButton ? "Please wait..." : "Click to Confirm Un-Verify"}>Click to Confirm Un-Verify</button>
                <button class="unverify-button" onclick={() => showUnverifyConfirm = false} style="margin-left: 1em;">Cancel</button>
              {:else}
                <button class="unverify-button" onclick={showConfirmationPrompt}>Un-Verify Account</button>
              {/if}
            </div>
          {:else}
            <p>You are not verified. You may change your Username or Faction.</p>
          {/if}
          {#if supporter === true}
            <br>
            <p><b>For Supporters:</b></p>
            <p>Enable glowing username: 
              <button onclick={handleToggleUsernameGlow} title={$authData.baseModel.hasUsernameGlow ? 'Disable glowing username' : 'Enable glowing username'}>
                <img
                  class="checkbox"
                  src="../images/{$authData.baseModel.hasUsernameGlow ? 'checkbox_on' : 'checkbox_off'}.png"
                  alt="Checkbox"
                />
              </button>
              {#key reloadKey}
              <AgentName user={{ username: username }} linkable={false} factionLogo={true} />
              {/key}
               - {$authData.baseModel.hasUsernameGlow ? 'Enabled' : 'Disabled'}!
            </p>
          {/if}
      </div>
  {:else}
      <p style="margin-top:2em;">
          You are currently not logged in. Please log in first.
      </p>
  {/if}
</div>

<style>
  div {
      max-width: 1000px;
      margin: auto;
      padding: 0 1em;
      line-height: 1.2em;
      margin-top: 2em;
  }
  p {
      text-align: center;
      margin: auto;
      max-width: 800px;
  }

  img.badge {
      height: 1em;
      vertical-align: sub;
      margin: 0 0.25em;
  }
  img.checkbox {
      height: 1.25em;
      vertical-align: sub;
      margin: 0 0.25em;
  }
  div.profileData {
      display: flex;
      flex-direction: column;
      row-gap: 1em;
  }
  img.profilePicture {
      display: block;
      margin: 1em auto;
      max-width: 200px;
      border-radius: 20%;
      box-shadow: #9593c3 0px 0px 5px 1px;
      border-radius: 6px;
  }
  p.publicNotice span {
    border: 3px double #5e5a75;
    border-radius: 8px;
    display: inline-block;
    padding: 1rem;
    margin-top: 1rem;
    cursor: pointer;
  }
  .unverify-button {
    padding: 0.5em 1em;
    background-color: #5e5a75;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }
  .unverify-button:hover {
    background-color: #4a4660;
  }
  .unverify-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

</style>
