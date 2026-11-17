import { pb } from '$lib/pocketbase'
import { authData, freshLogin } from '$lib/stores'
import { refreshOwnedBadges } from '$lib/badges'
import { updateOwnUser } from '$lib/user'

const PROVIDER = 'google'
const PENDING_KEY = 'oauth2:pending'
// Long enough for a slow Google prompt, short enough that a stale entry from
// an abandoned attempt can't be replayed much later.
const PENDING_TTL_MS = 10 * 60 * 1000

export const callbackUrl = () => `${window.location.origin}/auth/callback`

// Only same-origin paths: returnTo ends up in a navigation, and "//evil.com"
// or "https://..." must not turn the callback into an open redirect.
const safeReturnTo = (value) =>
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')
    ? value
    : '/'

// Everything that follows a successful sign-in, whichever flow produced it.
export const finishLogin = async (user) => {
  // Mirror the Google profile onto the record. Best-effort: not worth
  // failing a successful login over.
  if (user?.meta) {
    updateOwnUser({ avatar: user.meta.avatarUrl, display_name: user.meta.name })
      .catch(err => console.error('Failed to sync the Google profile:', err))
  }

  freshLogin.set(true)
  authData.set(pb.authStore)
  await refreshOwnedBadges()
}

// Popup flow. The window has to be opened synchronously inside the click, so
// the caller passes it in; the OAuth URL only exists once the SDK hands it
// over in urlCallback.
export const loginWithPopup = async (loginWindow) => {
  try {
    const user = await pb.collection('users').authWithOAuth2({
      provider: PROVIDER,
      urlCallback: (url) => { loginWindow.location.href = url }
    })
    await finishLogin(user)
  } catch (err) {
    // A declined or failed Google prompt would otherwise leave the blank
    // popup open forever.
    loginWindow?.close()
    throw err
  }
}

// Redirect flow, for browsers where a popup can't work: blocked popups,
// in-app browsers, and mobile tabs that get suspended while the popup is in
// front (the popup flow waits for the result over a realtime connection in
// the original page). Google sends the agent back to /auth/callback, which
// calls completeRedirectLogin().
export const loginWithRedirect = async () => {
  const methods = await pb.collection('users').listAuthMethods()
  const provider = methods.oauth2?.providers?.find(p => p.name === PROVIDER)
  if (!provider) throw new Error(`OAuth2 provider "${PROVIDER}" is not enabled`)

  // localStorage rather than sessionStorage: some in-app browsers hand the
  // Google step to a fresh tab and come back in yet another one.
  localStorage.setItem(PENDING_KEY, JSON.stringify({
    state: provider.state,
    codeVerifier: provider.codeVerifier,
    returnTo: safeReturnTo(window.location.pathname + window.location.search + window.location.hash),
    createdAt: Date.now()
  }))

  // authURL already ends with "redirect_uri=".
  window.location.href = provider.authURL + encodeURIComponent(callbackUrl())
}

// Called by /auth/callback. Returns the path to send the agent back to.
export const completeRedirectLogin = async (params) => {
  let pending = null
  try { pending = JSON.parse(localStorage.getItem(PENDING_KEY)) } catch {}
  localStorage.removeItem(PENDING_KEY)

  if (!pending || Date.now() - pending.createdAt > PENDING_TTL_MS) {
    throw new Error('This sign-in link has expired. Please log in again.')
  }
  const returnTo = safeReturnTo(pending.returnTo)

  const providerError = params.get('error')
  if (providerError) {
    const error = new Error(providerError === 'access_denied' ? 'Login was cancelled.' : 'Google refused the login.')
    error.returnTo = returnTo
    throw error
  }
  if (!params.get('code') || params.get('state') !== pending.state) {
    const error = new Error('The login response did not match this browser. Please try again.')
    error.returnTo = returnTo
    throw error
  }

  const user = await pb.collection('users').authWithOAuth2Code(
    PROVIDER,
    params.get('code'),
    pending.codeVerifier,
    callbackUrl()
  )
  await finishLogin(user)
  return returnTo
}

// Touch-first devices get the redirect flow up front. A popup there opens as
// a new tab, and the page waiting for its result is often suspended or killed
// before the result arrives.
export const prefersRedirect = () =>
  window.matchMedia?.('(pointer: coarse)').matches ||
  window.matchMedia?.('(display-mode: standalone)').matches
