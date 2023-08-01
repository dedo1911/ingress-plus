<script>
  import { onMount } from 'svelte'
  import { client } from '$lib/pocketbase'
  import { authData, ownedBadges } from '$lib/stores'

  const login = async () => {
    const user = await client.collection('users').authWithOAuth2({ provider: 'google' })
    
    if (client.authStore.isValid) {
      // Update username and avatar
      user.record.avatar = user.meta.avatarUrl
      user.record.display_name = user.meta.name
      client.collection('users').update(user.record.id, user.record)
    }

    authData.set(client.authStore)
    await refreshOwnedBadges()
  }
  const logout = () => {
    client.authStore.clear()
    authData.set({ isValid: false })
    ownedBadges.set([])
  }
  
  const openTelegram = () => (window.location.href = "https://t.me/ingressbadges")

  const refreshOwnedBadges = async () => {
    const owned = await client.collection('user_badges').getFullList()
    ownedBadges.set(owned)
  }

  onMount(async () => {
    if (!client.authStore.isValid) return
    await client.collection('users').authRefresh()
    authData.set(client.authStore)
    await refreshOwnedBadges()
  })
</script>

<header>
  <div>
    <img src="favicon.png" alt="Ingress" height="75" width="75" />
    <h1>Ingress Badges</h1>
  </div>
  <div data-nav="mobile">
    
  </div>
  <div data-nav="large">
    <ul>
      <li on:click={openTelegram}><img src="/telegram.svg" alt="Telegram" /> Telegram</li>
      {#if $authData.isValid }
        <li on:click={logout}><img src="/user.svg" alt="{$authData.model.display_name}" /> Logout</li>
      {:else}
        <li on:click={login}><img src="/user.svg" alt="Login" /> Login</li>
      {/if}
    </ul>
  </div>
</header>

<style>
  header {
    background: #000;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100px;
    color: #FFF;
  }
  div {
    display: flex;
    align-items: center;
    padding: 0 1em;
  }
  div:first-child img {
    height: 75px;
    margin-right: 1em;
  }
  h1 {
    font-size: 2em;
    text-align: center;
  }
  div[data-nav="large"] ul {
    list-style: none;
    display: flex;
    align-items: center;
  }
  div[data-nav="large"] ul li {
    min-width: 75px;
    width: 120px;
    text-align: center;
    cursor: pointer;
    padding: 0.5em;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0);
  }
  div[data-nav="large"] ul li:hover {
    border-bottom: 1px solid rgba(255, 255, 255, 1);
  }
  div[data-nav="large"] ul li img {
    height: 1.5em;
    width: 1.5em;
    margin-right: 0.5em;
    border-radius: 6px;
  }

  @media (max-width: 800px) {
    div[data-nav="large"] {
      display: none;
    }
  }
</style>
