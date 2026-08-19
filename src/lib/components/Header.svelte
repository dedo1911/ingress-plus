<script>
  import { onMount } from 'svelte'
  import { slide } from 'svelte/transition'

  import { afterNavigate } from '$app/navigation'
  import { resolve } from '$app/paths'
  import { pb } from '$lib/pocketbase'
  import { authData, freshLogin, ownedBadges } from '$lib/stores'
  import { refreshOwnedBadges } from '$lib/badges'

  let menuOpen = $state(false)
  let showSubTools = $state(false)
  let pathname = $state('/')
  let toolsMenuEl = $state(null)

  const toggleMenu = () => { menuOpen = !menuOpen }
  const toggleSubTools = () => { showSubTools = !showSubTools }

  // Closes the Tools submenu on an outside click or Escape, instead of leaving it open until
  // the same toggle is clicked again - the previous behavior with no way to dismiss it otherwise.
  const onWindowClick = e => {
    if (showSubTools && toolsMenuEl && !toolsMenuEl.contains(e.target)) {
      showSubTools = false
    }
  }
  const onWindowKeydown = e => {
    if (e.key === 'Escape' && showSubTools) showSubTools = false
  }

  const login = async () => {
    menuOpen = false
    const loginWindow = window.open('', '_blank')
    const user = await pb.collection('users').authWithOAuth2({
      provider: 'google',
      urlCallback: (url) => {
        loginWindow.location.href = url
      }
    })

    if (pb.authStore.isValid) {
      // Update username and avatar
      user.record.avatar = user.meta.avatarUrl
      user.record.display_name = user.meta.name
      pb.collection('users').update(user.record.id, user.record)
    }

    freshLogin.set(true)
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
    window.location.href = 'https://t.me/Ingress_Plus'
  }

  onMount(async () => {
    if (!pb.authStore.isValid) return
    await pb.collection('users').authRefresh()
    authData.set(pb.authStore)
    await refreshOwnedBadges()
  })

  afterNavigate(() => {
    pathname = window.location.pathname
    menuOpen = false
    // Previously left unset here, so the submenu could still be expanded the next time the
    // mobile menu was reopened, even though navigation had already happened.
    showSubTools = false
  })
</script>

{#snippet menu()}
  <ul transition:slide>
    {#if $authData.isValid }
      <a href={resolve('/agent')}>
        <li class="{pathname === '/agent' ? 'active' : '{$authData.model.username}'}">
          <img src="{$authData?.baseModel?.avatar.slice(0, -6)}" alt={$authData.baseModel.username}
            onerror={() => { this.src = '/images/user.svg' }} />
          {$authData.baseModel.username}
        </li>
      </a>
    {/if}
    <a href={resolve('/badges')}>
      <li class="{pathname === '/badges' ? 'active' : ''}">
        <img src="/images/medal.svg" alt="Badges" /> Badges
      </li>
    </a>
    <a href={resolve('/media')}>
      <li class="{pathname === '/media' ? 'active' : ''}">
        <img src="/images/mediagress.png" alt="Mediagress" /> Mediagress
      </li>
    </a>
    <a href={resolve('/events')}>
      <li class="{pathname === '/events' ? 'active' : ''}">
        <img src="/images/event.svg" alt="Events" /> Events
      </li>
    </a>
    <!--
    <a href="/bugs">
      <li class="{pathname === '/bugs' ? 'active' : ''}">
        <img src="/images/bugs.svg" alt="Bug Tracker" /> Bug Tracker
      </li>
    </a>
    -->
    <li class="tools {pathname.startsWith('/tools') ? 'active' : ''}" bind:this={toolsMenuEl}>
      <button type="button" class="tools-toggle" onclick={toggleSubTools} aria-haspopup="true" aria-expanded={showSubTools}>
        <img src="/images/tools.svg" alt="Tools" /> Tools &triangledown;
      </button>
      <ul class="submenu" class:visible={showSubTools}>
        <li><img src="/images/cmu.png" alt="CMU icon" /><a href={resolve('/tools/cmu_calc')}>CMU Calculator</a></li>
        <li><img src="/images/resources.svg" alt="Tools" /><a href={resolve('/tools/resources')}>Resources</a></li>
        <li><img src="/images/private.svg" alt="GDPR Analyzer icon" /><a href={resolve('/tools/gdpr_analyzer')}>GDPR Analyzer</a></li>
      </ul>
    </li>
    <a href={resolve('/stats')}>
      <li class="{pathname === '/stats' ? 'active' : ''}">
        <img src="/images/statistics.svg" alt="Statistics" /> Statistics
      </li>
    </a>
    <li>
      <button onclick={openTelegram}><img src="/images/telegram.svg" alt="Telegram" /> Telegram</button>
    </li>
    {#if $authData.isValid }
      <li>
        <button onclick={logout}>
          <img src="/images/logout.svg" alt="{$authData.model.username}" /> Logout
        </button>
      </li>
    {:else}
      <li>
        <button onclick={login}>
          <img src="/images/user.svg" alt="Login" /> Login
        </button>
      </li>
    {/if}
  </ul>
{/snippet}

<svelte:window onclick={onWindowClick} onkeydown={onWindowKeydown} />

<header>
  <div>
    <a href={resolve('/')}>
      <img src='/images/favicon.png' alt='Ingress Plus' height="75" width="75" />
      <h1>Ingress Plus</h1>
    </a>
  </div>
  <nav data-nav="mobile">
    <button class="hamburger" class:open={menuOpen} onclick={toggleMenu} aria-label="Menu"></button>
    {#if menuOpen}
      {@render menu()}
    {/if}
  </nav>
  <nav data-nav="large">
    {@render menu()}
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
  header button {
    color: #FFF;
    font-size: 1em;
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
    margin: 0;
    margin-right: 0.5em;
    border-radius: 6px;
  }

  nav[data-nav="large"] {
    display: flex;
  }
  nav[data-nav="mobile"] {
    display: none;
  }

  nav[data-nav="mobile"] button.hamburger {
    height: 32px;
    width: 32px;
    background-image: url('/images/menu.png');
    background-size: contain;
    transition: all 0.3s ease-in-out;
    cursor: pointer;
  }
  nav[data-nav="mobile"] button.hamburger.open {
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
    z-index: 10;
  }
  nav[data-nav="mobile"] ul li {
    padding: 1em 0.5em;
  }

  @media (max-width: 1400px) {
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
    .submenu {
      /* On the mobile menu the submenu should push the rest of the list down when it opens,
         not overlay on top of it like the absolutely-positioned desktop dropdown does. */
      position: static;
      box-shadow: none;
      min-width: auto;
    }
  }
  .tools {
    position: relative;
  }
  .tools-toggle {
    background: none;
    border: none;
    color: inherit;
    font: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    width: 100%;
    padding: 0;
    margin: 0;
  }

  .submenu {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    background: #111;
    border-radius: 6px;
    box-shadow: 0 0 10px rgba(0,0,0,0.5);
    z-index: 100;
    flex-direction: column;
    min-width: 100%;
    padding: 0;
    margin: 0;
  }

  .submenu.visible {
    display: flex;
  }
  .submenu li:hover {
    background: #222;
  }
  .submenu a {
    color: #fff;
    text-decoration: none;
  }
</style>
