<script>
  import { afterNavigate } from '$app/navigation'
  import { onMount } from 'svelte'
  import { slide, fly } from 'svelte/transition'
  import { pb } from '$lib/pocketbase'
  import { authData, ownedBadges } from '$lib/stores'

  let menuOpen = false
  let pathname = '/'

  const toggleMenu = () => (menuOpen = !menuOpen)

  const login = async () => {
    menuOpen = false
    let w = window.open()
    const user = await pb.collection('users').authWithOAuth2({
      provider: 'google',
      urlCallback: (url) => {
          w.location.href = url
      }
    })

    if (pb.authStore.isValid) {
      // Update username and avatar
      user.record.avatar = user.meta.avatarUrl
      user.record.display_name = user.meta.name
      pb.collection('users').update(user.record.id, user.record)
    }

    authData.set(pb.authStore)
    await refreshOwnedBadges()
  }

  const logout = () => {
    menuOpen = false
    pb.authStore.clear()
    authData.set({ isValid: false })
    ownedBadges.set([])
  }

  const openTelegram = () => {
    menuOpen = false
    window.location.href = "https://t.me/Ingress_Plus"
  }

  const refreshOwnedBadges = async () => ownedBadges.set(
    await pb.collection('user_badges').getFullList({
      expand: 'badge,badge.category',
      filter: `user="${pb.authStore.baseModel.id}"`,
    }))

  onMount(async () => {
    if (!pb.authStore.isValid) return
    await pb.collection('users').authRefresh()
    authData.set(pb.authStore)
    await refreshOwnedBadges()
  })

  afterNavigate(() => {
    pathname = window.location.pathname
    menuOpen = false
  })
</script>

<header>
  <div>
    <a href="/">
      <img src='/images/favicon.png' alt='Ingress Plus' height="75" width="75" />
      <h1>Ingress Plus</h1>
    </a>
  </div>
  <nav data-nav="mobile">
    <span class:open={menuOpen} on:click={toggleMenu} />
    {#if menuOpen}
      <ul transition:slide>
        <a href="/media">
          <li class="{pathname === '/media' ? 'active' : ''}">
            <img src="/images/mediagress.png" alt="Mediagress" /> Mediagress
          </li>
        </a>
        <a href="/bugs">
          <li class="{pathname === '/bugs' ? 'active' : ''}">
            <img src="/images/bugs.svg" alt="Bug Reports" /> Bug Reports
          </li>
        </a>
        <a href="/stats">
          <li class="{pathname === '/stats' ? 'active' : ''}">
            <img src="/images/statistics.svg" alt="Statistics" /> Statistics
          </li>
        </a>
        <li on:click={openTelegram}><img src="/images/telegram.svg" alt="Telegram" /> Telegram</li>
        {#if $authData.isValid }
        <a href="/agent">
          <li class="{pathname === '/agent' ? 'active' : ''}">
            <img src="/images/user.svg" alt="{$authData.model.username}" /> {$authData.baseModel.username}
          </li>
        </a>
        <li on:click={logout}><img src="/images/logout.svg" alt="{$authData.model.username}" /> Logout</li>
        {:else}
          <li on:click={login}><img src="/images/user.svg" alt="Login" /> Login</li>
        {/if}
      </ul>
    {/if}
  </nav>
  <nav data-nav="large">
    <ul>
      <a href="/media">
        <li class="{pathname === '/media' ? 'active' : ''}">
          <img src="/images/mediagress.png" alt="Mediagress" /> Mediagress
        </li>
      </a>
      <a href="/bugs">
        <li class="{pathname === '/bugs' ? 'active' : ''}">
          <img src="/images/bugs.svg" alt="Bug Reports" /> Bug Reports
        </li>
      </a>
      <a href="/stats">
        <li class="{pathname === '/stats' ? 'active' : ''}">
          <img src="/images/statistics.svg" alt="Statistics" /> Statistics
        </li>
      </a>
      <li on:click={openTelegram}><img src="/images/telegram.svg" alt="Telegram" /> Telegram</li>
      {#if $authData.isValid }
        <a href="/agent" transition:fly={{ y: 50, duration: 500 }}>
          <li class="{pathname === '/agent' ? 'active' : ''}">
            <img src="/images/user.svg" alt="{$authData.model.username}" /> {$authData.baseModel.username}
          </li>
        </a>
        <li on:click={logout} transition:fly={{ y: 50, duration: 500 }}>
          <img src="/images/logout.svg" alt="{$authData.model.username}" /> Logout
        </li>
      {:else}
        <li on:click={login}>
          <img src="/images/user.svg" alt="Login" /> Login
        </li>
      {/if}
    </ul>
  </nav>
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
  div, nav {
    display: flex;
    align-items: center;
    padding: 0 1em;
  }
  header a {
    display: flex;
    align-items: center;
  }
  div:first-child img {
    height: 75px;
    margin-right: 1em;
  }
  h1 {
    font-size: 2em;
    text-align: center;
  }
  nav ul {
    list-style: none;
    display: flex;
    align-items: center;
  }
  nav ul li {
    min-width: 75px;
    width: 120px;
    text-align: center;
    cursor: pointer;
    padding: 0.5em;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0);
    transition: border 0.3s ease-in-out;
  }
  nav ul li:hover,
  nav ul li.active {
    border-bottom: 1px solid rgba(255, 255, 255, 1);
  }
  nav ul li img {
    height: 1.5em;
    width: 1.5em;
    margin-right: 0.5em;
    border-radius: 6px;
  }

  nav[data-nav="large"] {
    display: flex;
  }
  nav[data-nav="mobile"] {
    display: none;
  }

  nav[data-nav="mobile"] span {
    height: 32px;
    width: 32px;
    background-image: url('/images/menu.png');
    background-size: contain;
    transition: all 0.3s ease-in-out;
    cursor: pointer;
  }
  nav[data-nav="mobile"] span.open {
    background-image: url('/images/close.png');
  }
  nav[data-nav="mobile"] ul {
    position: absolute;
    top: 75px;
    background: rgb(47,55,97);
    background: linear-gradient(0deg, rgba(47,55,97,0.9) 0%, rgba(17,20,35,0.9) 50%, rgba(0,0,0,1) 100%);
    flex-direction: column;
    margin: 0;
    width: 100%;
    left: 0;
    z-index: 1;
    padding: 1em 0;
    border-bottom: 3px double #5e5a75;
    border-radius: 0 0 8px 8px;
  }
  nav[data-nav="mobile"] ul li {
    padding: 1em 0.5em;
  }

  @media (max-width: 1185px) {
    nav[data-nav="large"] {
      display: none;
    }
    nav[data-nav="mobile"] {
      display: flex;
    }
    header {
      height: 75px;
    }
    div:first-child img {
      height: 55px;
      width: 55px;
      margin-right: 0.5em;
    }
    h1 {
      font-size: 1.5em;
    }
  }
</style>
