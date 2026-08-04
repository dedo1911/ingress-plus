<script>
  import { browser } from '$app/environment'
  import { pbAdmin } from '$lib/pocketbase/admin.js'
  import { pb } from '$lib/pocketbase/index.js'
  import { authData } from '$lib/stores'
  import { resolve } from '$app/paths'
  import Callout from '$lib/components/Callout.svelte'

  // pbAdmin.authStore is PocketBase's own store, not a Svelte one - it has
  // to be mirrored into local state via onChange to react to it here.
  let isAuthenticated = $state(pbAdmin.authStore.isValid)
  let adminEmail = $state(pbAdmin.authStore.record?.email || '')

  $effect(() => {
    return pbAdmin.authStore.onChange((token, record) => {
      isAuthenticated = pbAdmin.authStore.isValid
      adminEmail = record?.email || ''
    }, true)
  })

  let email = $state('')
  let password = $state('')
  let loggingIn = $state(false)
  let loginError = $state('')

  const handleLogin = async () => {
    loginError = ''
    loggingIn = true
    try {
      await pbAdmin.collection('_superusers').authWithPassword(email, password)
      password = ''
    } catch (err) {
      console.error(err)
      loginError = 'Invalid email or password.'
    } finally {
      loggingIn = false
    }
  }

  const handleLogout = () => {
    pbAdmin.authStore.clear()
  }

  // Impersonation PoC: PocketBase's impersonate endpoint (superuser-only)
  // mints a real auth token for the target user. It comes back on a
  // throwaway in-memory client, so the token/record are lifted out of that
  // and saved into the SITE's own `pb` client - that's what actually makes
  // the rest of the app (Header, badges, profile) render as that user.
  // This intentionally replaces whatever session `pb` currently holds
  // (including the admin's own regular account, if logged in as themselves
  // in the same browser) - that's the point of "become this user".
  const IMPERSONATE_DURATION_SECONDS = 30 * 60

  // Persisted (not just in-memory) so the "currently impersonating" state
  // and the way back to the admin's own account survive navigating away
  // to actually browse as the impersonated user, and page reloads.
  const IMPERSONATION_STORAGE_KEY = 'ip_impersonation_prior_session'

  const readImpersonation = () => {
    if (!browser) return null
    try {
      const raw = localStorage.getItem(IMPERSONATION_STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  const writeImpersonation = (state) => {
    if (browser) {
      if (state) {
        localStorage.setItem(IMPERSONATION_STORAGE_KEY, JSON.stringify(state))
      } else {
        localStorage.removeItem(IMPERSONATION_STORAGE_KEY)
      }
    }
    impersonation = state
  }

  // { username, priorToken, priorRecord } while impersonating, else null.
  // priorToken/priorRecord are null if there was nothing to return to.
  let impersonation = $state(readImpersonation())

  $effect(() => {
    return pb.authStore.onChange((token, record) => {
      // If the main session no longer matches what we think we're
      // impersonating - e.g. someone used the regular site's Logout
      // button, or the (non-refreshable) impersonation token expired on
      // its own - the stored marker is stale. Drop it rather than keep
      // showing an impersonation state that no longer reflects reality.
      if (impersonation && (!pb.authStore.isValid || record?.username !== impersonation.username)) {
        writeImpersonation(null)
      }
    }, true)
  })

  let searchQuery = $state('')
  let searchResults = $state([])
  let searching = $state(false)
  let searchError = $state('')

  let impersonatingId = $state('')
  let impersonateError = $state('')

  const searchUsers = async () => {
    const q = searchQuery.trim()
    if (!q) return
    searching = true
    searchError = ''
    try {
      const result = await pbAdmin.collection('users').getList(1, 10, {
        filter: pbAdmin.filter('username ~ {:q} || email ~ {:q}', { q })
      })
      searchResults = result.items
    } catch (err) {
      console.error(err)
      searchError = 'Could not search users.'
    } finally {
      searching = false
    }
  }

  const impersonate = async (user) => {
    impersonatingId = user.id
    impersonateError = ''
    try {
      // If already impersonating someone, keep the ORIGINAL prior session
      // rather than the one currently active, so switching targets doesn't
      // chain - Stop Impersonating should always return to the admin's own
      // account, not to a previous impersonation.
      const priorToken = impersonation ? impersonation.priorToken : (pb.authStore.isValid ? pb.authStore.token : null)
      const priorRecord = impersonation ? impersonation.priorRecord : (pb.authStore.isValid ? pb.authStore.record : null)

      const impersonatedClient = await pbAdmin.collection('users').impersonate(user.id, IMPERSONATE_DURATION_SECONDS)
      pb.authStore.save(impersonatedClient.authStore.token, impersonatedClient.authStore.record)
      authData.set(pb.authStore)

      writeImpersonation({ username: user.username, priorToken, priorRecord })
    } catch (err) {
      console.error(err)
      impersonateError = `Could not impersonate ${user.username}.`
    } finally {
      impersonatingId = ''
    }
  }

  const stopImpersonating = () => {
    if (impersonation?.priorToken) {
      pb.authStore.save(impersonation.priorToken, impersonation.priorRecord)
    } else {
      pb.authStore.clear()
    }
    authData.set(pb.authStore)
    writeImpersonation(null)
  }
</script>

<svelte:head>
  <title>Ingress Plus &middot; Admin</title>
</svelte:head>

<div class="page">
  <h1>Admin Panel</h1>

  {#if isAuthenticated}
    <div class="card">
      <p>Logged in as <strong>{adminEmail}</strong>.</p>
      <button type="button" class="cta" onclick={handleLogout}>Log Out</button>
    </div>

    {#if impersonation}
      <div class="card impersonation-banner">
        <p>
          Currently impersonating <strong>{impersonation.username}</strong>.
          <a href={resolve('/agent')}>Go to their profile &rarr;</a>
        </p>
        <button type="button" class="cta" onclick={stopImpersonating}>Stop Impersonating</button>
      </div>
    {/if}

    <div class="card">
      <h2>Impersonate a User</h2>
      <form class="search-row" onsubmit={(e) => { e.preventDefault(); searchUsers() }}>
        <input type="text" bind:value={searchQuery} placeholder="Search by username or email…" />
        <button type="submit" class="cta" disabled={searching || !searchQuery.trim()}>
          {searching ? 'Searching…' : 'Search'}
        </button>
      </form>

      {#if searchError}
        <Callout variant="error">{searchError}</Callout>
      {/if}
      {#if impersonateError}
        <Callout variant="error">{impersonateError}</Callout>
      {/if}

      {#if searchResults.length > 0}
        <ul class="results">
          {#each searchResults as user (user.id)}
            <li>
              <img src="{user.avatar}" alt="" onerror={(e) => (e.currentTarget.style.visibility = 'hidden')} />
              <div class="user-info">
                <strong>{user.username}</strong>
                <span>{user.email}</span>
              </div>
              <button
                type="button"
                class="cta"
                disabled={impersonatingId === user.id}
                onclick={() => impersonate(user)}
              >
                {impersonatingId === user.id ? 'Impersonating…' : 'Impersonate'}
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {:else}
    <form class="card" onsubmit={(e) => { e.preventDefault(); handleLogin() }}>
      <label>
        Email
        <input type="email" bind:value={email} autocomplete="username" required />
      </label>
      <label>
        Password
        <input type="password" bind:value={password} autocomplete="current-password" required />
      </label>

      {#if loginError}
        <Callout variant="error">{loginError}</Callout>
      {/if}

      <button type="submit" class="cta" disabled={loggingIn}>
        {loggingIn ? 'Logging in…' : 'Log In'}
      </button>
    </form>
  {/if}
</div>

<style>
  div.page {
    max-width: 700px;
    margin: auto;
    padding: 0 1em;
    line-height: 1.2em;
  }
  h1 {
    text-align: center;
    text-shadow: 0 0 10px black;
  }
  h2 {
    margin: 0;
    text-align: center;
    text-shadow: 0 0 10px black;
  }
  .card {
    display: flex;
    flex-direction: column;
    gap: 1em;
    background: rgba(14, 11, 28, 0.9);
    border: 3px double #5e5a75;
    border-radius: 8px;
    padding: 1.5em;
    margin-top: 1.5em;
  }
  .card p {
    margin: 0;
    text-align: center;
  }
  .card.impersonation-banner {
    background: rgba(150, 90, 0, 0.15);
    border-color: #a06b2a;
  }
  .card.impersonation-banner a {
    color: #ffb84d;
    text-decoration: underline;
    font-weight: bold;
  }
  .card.impersonation-banner button.cta {
    max-width: none;
    padding-left: 1em;
    padding-right: 1em;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.35em;
    text-align: left;
  }
  label input {
    width: auto;
  }
  button.cta {
    align-self: center;
    white-space: nowrap;
  }
  button.cta:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  form.search-row {
    display: flex;
    gap: 0.75em;
  }
  form.search-row input {
    flex: 1;
    width: auto;
  }
  form.search-row button {
    flex-shrink: 0;
  }
  ul.results {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75em;
  }
  ul.results li {
    display: flex;
    align-items: center;
    gap: 0.75em;
    padding: 0.5em;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
  }
  ul.results li img {
    height: 2.5em;
    width: 2.5em;
    border-radius: 50%;
    flex-shrink: 0;
    object-fit: cover;
  }
  div.user-info {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    text-align: left;
  }
  div.user-info span {
    font-size: 0.85em;
    color: rgba(255, 255, 255, 0.6);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
