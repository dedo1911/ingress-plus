// ==UserScript==
// @name IITC Plugin: Ingress Plus
// @category Misc
// @version 1.0.0
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
  pluginInfo.dateTimeVersion = '202611160000'
  pluginInfo.pluginId = 'ingress-plus'

  const self = window.plugin.ingressPlus = function () {}

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
    if (value === undefined || value === null) localStorage.removeItem(STORE_PREFIX + key)
    else localStorage.setItem(STORE_PREFIX + key, JSON.stringify(value))
  }

  const baseUrl = () => (localStorage.getItem(STORE_PREFIX + 'baseUrl') || DEFAULT_BASE_URL).replace(/\/+$/, '')
  const baseOrigin = () => new URL(baseUrl()).origin

  // Enabled plugins are remembered per device, by slug (slugs never change).
  const enabled = () => new Set(read('enabled', []))
  const setEnabled = (slug, on) => {
    const set = enabled()
    if (on) set.add(slug)
    else set.delete(slug)
    write('enabled', [...set])
  }
  // Authors can opt in to their own version that's still waiting for review.
  const useDev = () => new Set(read('useDev', []))
  const setUseDev = (slug, on) => {
    const set = useDev()
    if (on) set.add(slug)
    else set.delete(slug)
    write('useDev', [...set])
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
  const inject = (slug, code) => {
    const script = document.createElement('script')
    script.textContent = code + `\n//# sourceURL=ingress-plus/${slug}.user.js\n`
    script.dataset.ingressPlus = slug
    ;(document.body || document.head || document.documentElement).appendChild(script)
  }

  const loadPlugin = async (plugin) => {
    if (self.loaded[plugin.slug]) return
    const dev = plugin.isAuthor && plugin.devVersion && useDev().has(plugin.slug)
    try {
      const result = await fetchPluginCode(plugin, dev ? plugin.devVersion : '')
      inject(plugin.slug, result.code)
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
    renderDialog()
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
    renderDialog()
  }

  // ---- UI ---------------------------------------------------------------

  const notify = (message) => {
    console.warn(LOG_PREFIX, message)
    if (window.dialog) window.dialog({ title: 'Ingress Plus', text: message })
  }

  const el = (tag, attrs = {}, ...children) => {
    const node = document.createElement(tag)
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'onclick' || k === 'onchange') node[k] = v
      else if (v !== false && v !== undefined && v !== null) node.setAttribute(k, v === true ? '' : v)
    }
    for (const child of children.flat()) {
      if (child !== null && child !== undefined && child !== false) {
        node.append(child instanceof Node ? child : document.createTextNode(String(child)))
      }
    }
    return node
  }

  const pluginRow = (plugin) => {
    const isOn = enabled().has(plugin.slug)
    const loaded = self.loaded[plugin.slug]
    const failed = self.failed[plugin.slug]
    const changed = isOn !== !!loaded

    const version = plugin.version || (plugin.devVersion ? `${plugin.devVersion} (pending review)` : '')
    const description = (plugin.description || '').split('\n')[0].slice(0, 200)

    return el('div', { class: 'ingressplus-plugin' },
      el('label', {},
        el('input', { type: 'checkbox', checked: isOn, onchange: (e) => { setEnabled(plugin.slug, e.target.checked); renderDialog() } }),
        ' ', el('b', {}, plugin.name), ' ',
        el('span', { class: 'ingressplus-muted' }, version ? `v${version}` : '', plugin.author ? ` by ${plugin.author}` : '')
      ),
      description ? el('div', { class: 'ingressplus-muted' }, description) : null,
      plugin.isAuthor && plugin.devVersion
        ? el('label', { class: 'ingressplus-muted' },
          el('input', { type: 'checkbox', checked: useDev().has(plugin.slug), onchange: (e) => { setUseDev(plugin.slug, e.target.checked); renderDialog() } }),
          ` Use my version ${plugin.devVersion}, still waiting for review`)
        : null,
      failed ? el('div', { class: 'ingressplus-error' }, `Failed to load: ${failed}`) : null,
      changed ? el('div', { class: 'ingressplus-muted' }, isOn ? 'Will load after a reload.' : 'Will stop after a reload.') : null
    )
  }

  let dialogNode = null

  const renderDialog = () => {
    if (!dialogNode) return
    dialogNode.replaceChildren(dialogContent())
  }

  const dialogContent = () => {
    const token = read('token', null)
    const storeLink = el('a', { href: baseUrl() + '/plugins', target: '_blank', rel: 'noopener' }, 'Browse the plugin store')

    if (!token) {
      const codeInput = el('input', { type: 'text', placeholder: 'ipx_…', style: 'width: 100%' })
      return el('div', {},
        el('p', {}, 'Connect IITC to your Ingress Plus account to load the plugins available to you.'),
        el('p', {}, el('button', { onclick: connect }, 'Connect to Ingress Plus')),
        el('details', {},
          el('summary', {}, 'Paste a connection code instead'),
          el('p', { class: 'ingressplus-muted' }, 'For IITC Mobile or blocked popups: open ', baseUrl(), '/iitc/connect in a browser where you are signed in and create a code.'),
          codeInput,
          el('p', {}, el('button', {
            onclick: () => {
              const code = codeInput.value.trim()
              if (code.startsWith('ipx_')) saveToken(code, null)
              else notify('That does not look like an Ingress Plus connection code.')
            }
          }, 'Use code'))
        ),
        el('p', {}, storeLink)
      )
    }

    const plugins = self.catalog || []
    return el('div', {},
      el('p', {}, 'Connected as ', el('b', {}, read('username', '?')), '. ',
        el('a', { href: '#', onclick: (e) => { e.preventDefault(); disconnect() } }, 'Disconnect')),
      plugins.length === 0
        ? el('p', { class: 'ingressplus-muted' }, 'No plugins are available to you yet.')
        : plugins.map(pluginRow),
      el('p', {},
        el('button', {
          onclick: async () => {
            try { await fetchCatalog() } catch (e) { notify(e.message) }
            renderDialog()
          }
        }, 'Refresh list'), ' ',
        el('button', { onclick: () => window.location.reload() }, 'Reload IITC')
      ),
      el('p', {}, storeLink)
    )
  }

  const openDialog = () => {
    dialogNode = el('div', { class: 'ingressplus-dialog' })
    renderDialog()
    window.dialog({
      html: dialogNode,
      title: 'Ingress Plus',
      id: 'ingress-plus',
      width: 420,
      closeCallback: () => { dialogNode = null }
    })
  }

  const addStyles = () => {
    const style = document.createElement('style')
    style.textContent = `
      .ingressplus-dialog .ingressplus-plugin { padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
      .ingressplus-dialog .ingressplus-muted { opacity: 0.7; font-size: 0.9em; }
      .ingressplus-dialog .ingressplus-error { color: #ff8a8a; font-size: 0.9em; }
    `
    document.head.appendChild(style)
  }

  function setup () {
    addStyles()
    if (window.IITC && window.IITC.toolbox && window.IITC.toolbox.addButton) {
      window.IITC.toolbox.addButton({ label: 'Ingress Plus', title: 'Ingress Plus plugins', action: openDialog })
    } else {
      $('<a>').text('Ingress Plus').attr('title', 'Ingress Plus plugins').click(openDialog).appendTo($('#toolbox'))
    }
  }
  setup.info = pluginInfo

  self.openDialog = openDialog
  self.loadEnabled = loadEnabled
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
