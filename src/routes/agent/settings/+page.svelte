<script>
  import { authData } from "$lib/stores"
  import { pb, serverAddress } from '$lib/pocketbase'
  import { toast } from '@zerodevx/svelte-toast'

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
          <p>Username: <code>{username}</code></p>
          <p>Faction: <code>{faction.toUpperCase()}</code></p>
          <p>
              <img
                  class="badge"
                  src="/images/verification/verified.svg"
                  alt={verification}
              />
              Verification level:
              <code>{verification.toUpperCase()}</code>
          </p>
          <p>User ID: <code>ING+{userId}</code></p>
          <p>E-mail: <code>{email}</code></p>
          <!-- TODO: Support for (un-)linking multiple Auth providers (Google, FB, Apple)-->
          <p>Authenticated with: </p>
          {#if supporter === true}
            <p>Enable glowing username: 
              <img src={$authData.baseModel.public ? '../images/public.svg' : '../images/private.svg'} alt="Glow" height="32" onclick={toggleUsernameGlow} />
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
