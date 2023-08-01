<script>
  import { client } from '$lib/pocketbase'

  let isLogged = client.authStore.isValid
  const login = async () => {
    const user = await client.collection('users').authWithOAuth2({ provider: 'google' })
    isLogged = client.authStore.isValid
    
    if (isLogged) {
      // Update username and avatar
      user.record.avatar = user.meta.avatarUrl
      user.record.display_name = user.meta.name
      client.collection('users').update(user.record.id, user.record)
    }
  }
  const logout = () => {
    client.authStore.clear()
    isLogged = client.authStore.isValid
  }
  
  const openTelegram = () => (window.location.href = "https://t.me/ingressbadges")
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
      {#if isLogged}
        <li on:click={logout}><img src="{client.authStore.model.avatar}" alt="{client.authStore.model.display_name}" /> Logout</li>
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
