// ==UserScript==
// @name IITC Plugin: Ingress Plus
// @category Misc
// @version 2.0.0
// @namespace https://ingress.plus
// @downloadURL https://ingress.plus/ingress-plus.user.js
// @updateURL https://ingress.plus/ingress-plus.user.js
// @homepageURL https://ingress.plus/plugins
// @description Connect IITC to your Ingress Plus account and load the plugins from the Ingress Plus store that are available to you.
// @icon https://ingress.plus/icons/icon_ingressplus_32.png
// @icon64 https://ingress.plus/icons/icon_ingressplus_64.png
// @author IngressPlus
// @include https://intel.ingress.com/*
// @match https://intel.ingress.com/*
// @grant none
// ==/UserScript==

//
//  Changelog 2.0.0
//    The store UI is no longer part of this script: it is loaded from
//    ingress.plus on every start, so it can change without an update here
//
//  Changelog 1.2.0
//    New dialog: Store and Enabled tabs, categories, search, Open Ingress Plus button
//
//  Changelog 1.1.0
//    Plugins load as soon as you tick them, no reload needed
//
//  Changelog 1.0.0
//    First release: connect to Ingress Plus, pick plugins from the store, load them on every IITC start
//

function wrapper (pluginInfo) {
  // Overridable for testing against a staging or local backend:
  //   localStorage.setItem('ingressPlus:baseUrl', 'http://localhost:8090')
  const DEFAULT_BASE_URL = 'https://ingress.plus'
  const STORE_PREFIX = 'ingressPlus:'
  const HKDF_INFO = 'ingress-plus-iitc-v1'
  const LOG_PREFIX = '[Ingress Plus]'

  if (typeof window.plugin !== 'function') window.plugin = function () {}

  pluginInfo.buildName = 'IngressPlus'
  pluginInfo.dateTimeVersion = '202611171800'
  pluginInfo.pluginId = 'ingress-plus'

  const self = window.plugin.ingressPlus = function () {}

  // The store UI (src/lib/iitc/store.js, served at /iitc/store.js) talks to
  // this script only through what's exposed on `self`. Bump apiVersion when
  // that surface changes in a way an older store can't handle.
  self.apiVersion = 1

  // ---- local state ------------------------------------------------------

  const read = (key, fallback) => {
    try {
      const raw = localStorage.getItem(STORE_PREFIX + key)
      return raw === null ? fallback : JSON.parse(raw)
    } catch (e) {
      return fallback
    }
  }
  const write = (key, value) => {
    try {
      if (value === undefined || value === null) localStorage.removeItem(STORE_PREFIX + key)
      else localStorage.setItem(STORE_PREFIX + key, JSON.stringify(value))
    } catch (e) {
      console.warn(LOG_PREFIX, `could not save ${key}:`, e)
    }
  }

  const baseUrl = () => (localStorage.getItem(STORE_PREFIX + 'baseUrl') || DEFAULT_BASE_URL).replace(/\/+$/, '')
  const baseOrigin = () => new URL(baseUrl()).origin

  // Listeners (the store dialog) are told whenever anything they show changes.
  const listeners = []
  const emit = () => {
    for (const fn of listeners) {
      try { fn() } catch (e) { console.error(LOG_PREFIX, e) }
    }
  }

  // Enabled plugins are remembered per device, by slug (slugs never change).
  const enabled = () => new Set(read('enabled', []))
  const setEnabled = (slug, on) => {
    const set = enabled()
    if (on) set.add(slug)
    else set.delete(slug)
    write('enabled', [...set])
    emit()
  }
  // Authors can opt in to their own version that's still waiting for review.
  const useDev = () => new Set(read('useDev', []))
  const setUseDev = (slug, on) => {
    const set = useDev()
    if (on) set.add(slug)
    else set.delete(slug)
    write('useDev', [...set])
    emit()
  }

  self.loaded = {} // slug -> { version, dev }
  self.failed = {} // slug -> error message
  self.catalog = read('catalog', [])

  // ---- API --------------------------------------------------------------

  class AuthError extends Error {}

  const api = async (path, options = {}) => {
    const token = read('token', null)
    if (!token) throw new AuthError('Not connected')
    const res = await fetch(baseUrl() + path, {
      ...options,
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      cache: 'no-store'
    })
    if (res.status === 401) {
      disconnectLocally()
      throw new AuthError('Your Ingress Plus connection expired or was revoked. Connect again from the toolbox.')
    }
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`)
    return body
  }

  const fetchCatalog = async () => {
    const { plugins } = await api('/api/iitc/plugins')
    self.catalog = plugins
    write('catalog', plugins)
    emit()
    return plugins
  }

  // ---- crypto (see ingress-plus-backend internal/iitc/crypto.go) --------

  const fromB64 = (s) => Uint8Array.from(atob(s), c => c.charCodeAt(0))
  const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)))

  const fetchPluginCode = async (plugin, version) => {
    const curve = { name: 'ECDH', namedCurve: 'P-256' }
    const pair = await crypto.subtle.generateKey(curve, false, ['deriveBits'])
    const clientPub = await crypto.subtle.exportKey('raw', pair.publicKey)

    const sealed = await api(`/api/iitc/plugins/${encodeURIComponent(plugin.slug)}/load`, {
      method: 'POST',
      body: JSON.stringify({ clientPub: toB64(clientPub), version: version || '' })
    })

    const serverPub = await crypto.subtle.importKey('raw', fromB64(sealed.serverPub), curve, false, [])
    const secret = await crypto.subtle.deriveBits({ name: 'ECDH', public: serverPub }, pair.privateKey, 256)
    const hkdf = await crypto.subtle.importKey('raw', secret, 'HKDF', false, ['deriveKey'])
    const key = await crypto.subtle.deriveKey(
      { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: new TextEncoder().encode(HKDF_INFO) },
      hkdf, { name: 'AES-GCM', length: 256 }, false, ['decrypt'])
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(sealed.iv) }, key, fromB64(sealed.ciphertext))

    return { code: new TextDecoder().decode(plain), version: sealed.version, dev: sealed.dev }
  }

  // ---- loading ----------------------------------------------------------

  // Store plugins are ordinary IITC userscripts. Injected as a script tag,
  // their own wrapper either pushes setup onto window.bootPlugins (IITC
  // still booting) or calls it straight away (already booted).
  const inject = (name, code) => {
    const script = document.createElement('script')
    script.textContent = code + `\n//# sourceURL=ingress-plus/${name}.js\n`
    script.dataset.ingressPlus = name
    ;(document.body || document.head || document.documentElement).appendChild(script)
  }

  const loading = {} // slug -> promise, so the startup load and a click never inject twice

  const loadPlugin = (plugin) => {
    if (self.loaded[plugin.slug]) return Promise.resolve()
    if (!loading[plugin.slug]) {
      loading[plugin.slug] = doLoadPlugin(plugin).finally(() => {
        delete loading[plugin.slug]
        emit()
      })
      emit()
    }
    return loading[plugin.slug]
  }

  const doLoadPlugin = async (plugin) => {
    const dev = plugin.isAuthor && plugin.devVersion && useDev().has(plugin.slug)
    try {
      const result = await fetchPluginCode(plugin, dev ? plugin.devVersion : '')
      inject(`${plugin.slug}.user`, result.code)
      self.loaded[plugin.slug] = { version: result.version, dev: result.dev }
      delete self.failed[plugin.slug]
      console.log(LOG_PREFIX, `loaded ${plugin.slug}@${result.version}${result.dev ? ' (pending review)' : ''}`)
    } catch (e) {
      self.failed[plugin.slug] = e.message
      console.error(LOG_PREFIX, `could not load ${plugin.slug}:`, e)
    }
  }

  // Started as soon as the sideloader is injected rather than in setup(),
  // so most plugins arrive while IITC is still booting and get set up
  // together with the built-in ones.
  const loadEnabled = async () => {
    if (!read('token', null)) return
    let catalog
    try {
      catalog = await fetchCatalog()
    } catch (e) {
      console.error(LOG_PREFIX, 'could not fetch the plugin list:', e)
      if (e instanceof AuthError) notify(e.message)
      return
    }
    const wanted = enabled()
    // Sequential, in catalog order, so plugins that depend on another one
    // being defined first behave the same on every load.
    for (const plugin of catalog) {
      if (wanted.has(plugin.slug)) await loadPlugin(plugin)
    }
    // Forget plugins the agent no longer has access to.
    const available = new Set(catalog.map(p => p.slug))
    write('enabled', [...wanted].filter(s => available.has(s)))
  }

  // The store UI is always on and doesn't need an account (it also shows the
  // connect screen), so it comes as plain code from the site, not through
  // the encrypted plugin endpoint. The last copy is kept for when the site
  // can't be reached.
  const loadStore = async () => {
    let code = null
    try {
      const res = await fetch(baseUrl() + '/iitc/store.js', { cache: 'no-cache' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      code = await res.text()
      write('storeCode', code)
    } catch (e) {
      console.warn(LOG_PREFIX, 'could not fetch the store, using the saved copy:', e)
      code = read('storeCode', null)
    }
    if (!code) return
    try {
      inject('store', code)
    } catch (e) {
      console.error(LOG_PREFIX, 'the store failed to start:', e)
    }
  }

  // ---- connect / disconnect ---------------------------------------------

  const deviceLabel = () => {
    const ua = navigator.userAgent
    const browser = /Firefox\//.test(ua)
      ? 'Firefox'
      : /Edg\//.test(ua)
        ? 'Edge'
        : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Browser'
    const os = /Android/.test(ua)
      ? 'Android'
      : /iPhone|iPad/.test(ua)
        ? 'iOS'
        : /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : ''
    return `IITC on ${browser}${os ? ' / ' + os : ''}`
  }

  const onMessage = (event) => {
    if (event.origin !== baseOrigin()) return
    const data = event.data || {}
    if (data.type !== 'ingress-plus:token' || typeof data.token !== 'string' || !data.token.startsWith('ipx_')) return
    saveToken(data.token, data.username)
  }

  const saveToken = async (token, username) => {
    write('token', token)
    write('username', username || null)
    try {
      if (!username) write('username', (await api('/api/iitc/me')).username)
      await fetchCatalog()
    } catch (e) {
      notify(e.message)
    }
    emit()
  }

  const connect = () => {
    window.removeEventListener('message', onMessage)
    window.addEventListener('message', onMessage)
    const url = `${baseUrl()}/iitc/connect?label=${encodeURIComponent(deviceLabel())}`
    const popup = window.open(url, 'ingressPlusConnect', 'width=480,height=640')
    if (!popup) notify('Your browser blocked the Ingress Plus window. Allow popups for intel.ingress.com, or paste a connection code instead.')
  }

  const disconnectLocally = () => {
    write('token', null)
    write('username', null)
    write('catalog', null)
    self.catalog = []
    emit()
  }

  const disconnect = async () => {
    // Revoke server-side too, so the token stops working everywhere it
    // might have been copied to. Best effort: forget it locally regardless.
    try {
      await api('/api/iitc/tokens/current', { method: 'DELETE' })
    } catch (e) {
      console.warn(LOG_PREFIX, 'could not revoke the token server-side:', e)
    }
    disconnectLocally()
  }

  const notify = (message) => {
    console.warn(LOG_PREFIX, message)
    if (window.dialog) window.dialog({ title: 'Ingress Plus', text: message })
  }

  // ---- API for the store UI ---------------------------------------------

  Object.assign(self, {
    version: pluginInfo.script ? pluginInfo.script.version : null,
    baseUrl,
    isConnected: () => !!read('token', null),
    username: () => read('username', null),
    enabled,
    setEnabled,
    useDev,
    setUseDev,
    isLoading: (slug) => !!loading[slug],
    loadPlugin,
    loadEnabled,
    fetchCatalog,
    connect,
    saveToken,
    disconnect,
    notify,
    onChange: (fn) => { listeners.push(fn) }
  })

  // Without the store there's still a toolbox entry that says what's wrong.
  // The store sets self.storeVersion as soon as it runs.
  const storeReady = loadStore()

  function setup () {
    storeReady.then(() => {
      if (self.storeVersion) return
      const explain = () => notify('The Ingress Plus store could not be loaded. Your enabled plugins still load; check your connection and reload IITC to get the store back.')
      if (window.IITC && window.IITC.toolbox && window.IITC.toolbox.addButton) {
        window.IITC.toolbox.addButton({ label: 'Ingress Plus', title: 'Ingress Plus plugins', action: explain })
      } else {
        $('<a>').text('Ingress Plus').attr('title', 'Ingress Plus plugins').click(explain).appendTo($('#toolbox'))
      }
    })
  }
  setup.info = pluginInfo

  loadEnabled()

  if (window.iitcLoaded) {
    setup()
  } else {
    if (!window.bootPlugins) window.bootPlugins = []
    window.bootPlugins.push(setup)
  }
}

((() => {
  const pluginInfo = {}
  if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) {
    pluginInfo.script = {
      version: GM_info.script.version,
      name: GM_info.script.name,
      description: GM_info.script.description
    }
  }
  const script = document.createElement('script')
  script.appendChild(document.createTextNode(`(${wrapper})(${JSON.stringify(pluginInfo)});`))
  ;(document.body || document.head || document.documentElement).appendChild(script)
})())
