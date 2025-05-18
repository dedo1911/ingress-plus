<script>
  import { authData } from "$lib/stores"
  import { pb } from '$lib/pocketbase'
  import { toast } from '@zerodevx/svelte-toast'
  import AgentName from '$lib/components/AgentName.svelte'
  import { browser } from '$app/environment'

  const username = $derived($authData?.baseModel?.username || "NONE")
  const faction = $derived($authData?.baseModel?.faction || "NOT SET")
  const userId = $derived($authData?.baseModel?.id || "NONE")
  const email = $derived($authData?.baseModel?.email || "UNKNOWN")
  const supporter = $derived($authData?.baseModel?.supporter)

  let reloadKey = $state(0);

  const handleToggleUsernameGlow = async () => {
    await toggleUsernameGlow();
    reloadKey += 1; // Force AgentName to reload
  };

  const handleSaveUsername = async () => {
    await saveUsername();
    reloadKey += 1; // Force AgentName to reload
  };

  const handleSaveFaction = async () => {
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
            <input type="text" bind:value={newUsername} style="color: var(--color-faction-{$authData?.baseModel?.faction || 'unaligned'})" />
            <img src="../images/accept.svg" height="32" alt="Save" onclick={handleSaveUsername} />
          </p>
          <p>
            <b>Faction</b>: 
            <select bind:value={selectedFaction}>
              <option value="enlightened" >Enlightened</option>
              <option value="resistance">Resistance</option>
              {#if supporter === true}
              <option value="machina">Machina</option>
              {/if}
            </select>
            <button onclick={handleSaveFaction}>
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
</style>
