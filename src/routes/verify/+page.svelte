<script>
    import { authData } from "$lib/stores";

    let username = $authData?.baseModel?.username || "NONE";
    let faction = $authData?.baseModel?.faction || "NOT SET";
    let verification = $authData?.baseModel?.verification || "NONE";
    let userId = $authData?.baseModel?.id || "NONE";
</script>

<svelte:head>
    <title>Ingress Plus &middot; Verification</title>
</svelte:head>

<div>
{#if $authData.isValid}
    <img
        class="profilepicture"
        src={$authData?.baseModel?.avatar.slice(0, -6)}
        alt={username}
    /><br />
    <p>Your username is "<b>{username}</b>".</p>
    <p>Your faction is <b>{faction.toUpperCase()}</b>.</p>
    <p>
        <img
            class="badge"
            src="/images/verification/verified.svg"
            alt={verification}
        />Your Verification level is "<b>{verification.toUpperCase()}</b>".
    </p>
    <p>Your User ID is "<b>ING+{userId}</b>".</p>
{:else}
    <p style="margin-top:2em;">
        You are currently not logged in. Please log in first.
    </p>
{/if}
<hr />
<p>
    Verification is only done manually and at the discretion of the admins at
    the moment and can not be requested.
</p>
<br />
<p>
    If instructed, make sure that your username and faction above match your
    Ingress account, keep your User ID ready and follow further instructions
    provided by the admins.
    </p>
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
    img.profilepicture {
        display: block;
        margin: auto;
        max-width: 200px;
        border-radius: 20%;
        box-shadow: #9593c3 0px 0px 5px 1px;
        border-radius: 6px;
    }
</style>
