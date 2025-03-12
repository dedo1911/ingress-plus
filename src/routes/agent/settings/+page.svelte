<script>
  import { authData } from "$lib/stores"
  import { pb, serverAddress } from '$lib/pocketbase'
  import { toast } from '@zerodevx/svelte-toast'
  import AgentName from '$lib/components/AgentName.svelte'
  import { browser } from '$app/environment'

  const username = $derived($authData?.baseModel?.username || "NONE")
  const faction = $derived($authData?.baseModel?.faction || "NOT SET")
  const verification = $derived($authData?.baseModel?.verification || "NONE")
  const userId = $derived($authData?.baseModel?.id || "NONE")
  const email = $derived($authData?.baseModel?.email || "UNKNOWN")
  const supporter = $derived($authData?.baseModel?.supporter)

  const toggleUsernameGlow = async () => {
    $authData.baseModel.showSupport = !$authData.baseModel.showSupport
    await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
    toast.push('Updated glowing username to ' + $authData.baseModel.showSupport, { classes: ['successToast'] })
  }

  const togglePublic = async () => {
    $authData.baseModel.public = !$authData.baseModel.public
    await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
    toast.push('Profile is public: ' + $authData.baseModel.public, { classes: ['successToast'] })
  }

  $effect(() => {
    if (browser && $authData.isValid === false) goto('/')
  })

  const toggleFaction = async () => {
    $authData.baseModel.faction = $authData.baseModel.faction === 'enlightened' ? 'resistance' : 'enlightened'
    await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
  }

  let newUsername = $state('')
  $effect(() => {
    newUsername = username
  })

  const saveUsername = async () => {
    const oldUsername = $authData.baseModel.username
    try {
      $authData.baseModel.username = newUsername
      await pb.collection('users').update($authData.baseModel.id, $authData.baseModel)
    } catch (err) {
      $authData.baseModel.username = oldUsername
      console.log('Error: ' + err.response?.data?.username?.code)
      console.error(username, err)

      // Check if error because username already exists
      if (err.response?.data?.username?.code === 'validation_not_unique') {
        toast.push('The username is already taken. Please choose a different username.', { classes: ['errorToast'] });
      } 
      
      // Check for minimum username lenght
      else if (err.response?.data?.username?.code === 'validation_min_text_constraint') {
        toast.push('The username is too short. It needs to be at least 3 characters long.', { classes: ['errorToast'] });
      }      
      
      // Check for maximum username lenght
      else if (err.response?.data?.username?.code === 'validation_max_text_constraint') {
        toast.push('The username is too long. It needs to be 15 characters or less.', { classes: ['errorToast'] });
      }

      // Check for illegal characters
      else if (err.response?.data?.username?.code === 'validation_invalid_format') {
        toast.push('The username contains characters that are not allowed. You can only use letters or numbers.', { classes: ['errorToast'] });
      }

      else {
        toast.push('An error has occurred. Please try again later.', { classes: ['errorToast'] });
      }
      return
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
          <p>Username: 
            <input type="text" bind:value={newUsername} style="color: var(--color-faction-{$authData?.baseModel?.faction || 'unaligned'})" />
            <img src="../images/accept.svg" height="32" alt="Save" onclick={saveUsername} />
          </p>
          <p>Faction: <code>{faction.toUpperCase()}</code> - 
            <img class="checkbox" src="../images/{factionLogo}" height="64" alt={$authData?.baseModel?.faction || 'unaligned'} onclick={toggleFaction} /> - Click me!</p>
          <p>Profile visiblity:
            <button onclick={togglePublic} title={$authData.baseModel.public ? 'Make Profile private' : 'Make Profile public'}>
              <img
                class="checkbox"
                src="../images/{$authData.baseModel.public ? 'checkbox_on' : 'checkbox_off'}.png"
                alt="Checkbox"
              />
            </button>
            - {$authData.baseModel.public ? 'Public' : 'Private'}</p>
            <br>
          <p>User ID: <code>ING+{userId}</code></p>
          <p>E-mail: <code>{email}</code></p>
          <!-- TODO: Support for (un-)linking multiple Auth providers (Google, FB, Apple)-->
          <p>Authenticated with: Google</p>
          {#if supporter === true}
            <br>
            <p><b>For Supporters:</b></p>
            <p>Enable glowing username: 
              <button onclick={toggleUsernameGlow} title={$authData.baseModel.showSupport ? 'Disable glowing username' : 'Enable glowing username'}>
                <img
                  class="checkbox"
                  src="../images/{$authData.baseModel.showSupport ? 'checkbox_on' : 'checkbox_off'}.png"
                  alt="Checkbox"
                />
              </button>
              <AgentName user={{ username: username }} linkable={false} factionLogo={true} />
               - {$authData.baseModel.showSupport ? 'Enabled' : 'Disabled'}!
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
</style>
