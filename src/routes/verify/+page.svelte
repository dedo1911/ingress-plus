<script>
      import { authData } from '$lib/stores'

      let username = ''
      let faction = ''
      let verification = '';
      let userId = '';
$: {
       username = $authData?.baseModel?.username || '';
       if (username === '') {
        username = 'NONE';}

       faction = $authData?.baseModel?.faction || '';
       if (faction === '') {
        faction = 'NOT SET';}

       verification = $authData?.baseModel?.verification || '';
       if (verification === '') {
        verification = 'NONE';}

        userId = $authData?.baseModel?.id || '';
          if (userId === '') {
          userId = 'NONE';}
    }

</script>

<svelte:head>
    <title>Ingress Plus &middot; Verification</title>
</svelte:head>

{#if $authData.isValid }
<img class="profilepicture" src="{$authData?.baseModel?.avatar.slice(0, -6)}" width=10% /><br>
<p>Your username is "<b>{username}</b>".
<p>Your faction is <b>{faction.toUpperCase()}</b>.
<p><img class="badge" src="/images/verification/verified.svg"/>Your Verification level is "<b>{verification.toUpperCase()}</b>".</p>
<p>Your User ID is "<b>ING+{userId}</b>".</p>
{:else}
<p style="margin-top:2em;">You are currently not logged in. Please log in first.<p>
{/if}
<hr>
<p>Verification is only done manually and at the discretion of the admins at the moment and can not be requested.</p>
<br>
<p>If instructed, make sure that your username and faction above match your Ingress account, keep your User ID ready and follow further instructions provided by the admins.</p>

<style>
p {
    text-align: center;
    margin: auto;
    max-width: 800px;
    }

  .badge {
      height: 1em;
      vertical-align: sub;
      margin: 0 0.25em;
  }
  .profilepicture {
      border: 1px solid white;
      margin-top:2em;
      display: block;
      width: 200px;
      margin-left: auto;
      margin-right: auto;
  }

</style>
