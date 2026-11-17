// ==UserScript==
// @name IITC Plugin: Ingress Plus
// @category Misc
// @version 1.2.0
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
  pluginInfo.dateTimeVersion = '202611171200'
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

  const loading = {} // slug -> promise, so the startup load and a click never inject twice

  const loadPlugin = (plugin) => {
    if (self.loaded[plugin.slug]) return Promise.resolve()
    if (!loading[plugin.slug]) {
      loading[plugin.slug] = doLoadPlugin(plugin).finally(() => { delete loading[plugin.slug] })
    }
    return loading[plugin.slug]
  }

  const doLoadPlugin = async (plugin) => {
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
      if (k.startsWith('on')) node[k] = v
      else if (v !== false && v !== undefined && v !== null) node.setAttribute(k, v === true ? '' : v)
    }
    for (const child of children.flat()) {
      if (child !== null && child !== undefined && child !== false) {
        node.append(child instanceof Node ? child : document.createTextNode(String(child)))
      }
    }
    return node
  }

  // Turning a plugin on loads it right away; IITC has no way to unload a
  // plugin, so turning one off only takes effect after a reload.
  const toggle = async (plugin, on) => {
    setEnabled(plugin.slug, on)
    if (on && !self.loaded[plugin.slug]) {
      const pending = loadPlugin(plugin)
      renderDialog()
      await pending
    }
    renderDialog()
  }

  // Dialog state survives re-renders (a toggle redraws the whole dialog).
  const ALL = '\u0000all'
  const OTHER = 'Other'
  const ui = { tab: 'store', category: ALL, query: '' }

  const categoryOf = (plugin) => (plugin.category || '').trim() || OTHER

  const matchesQuery = (plugin) => {
    const words = ui.query.toLowerCase().split(/\s+/).filter(Boolean)
    if (words.length === 0) return true
    const haystack = [plugin.name, plugin.slug, plugin.author, plugin.category, plugin.description]
      .filter(Boolean).join(' ').toLowerCase()
    return words.every(w => haystack.includes(w))
  }

  // A plugin switched off this session stays in the Enabled tab until the
  // reload, so its "will stop after a reload" note doesn't vanish on click.
  const enabledPlugins = () => {
    const on = enabled()
    return (self.catalog || []).filter(p => on.has(p.slug) || self.loaded[p.slug])
  }
  const tabPlugins = () => ui.tab === 'enabled' ? enabledPlugins() : (self.catalog || [])

  const needsReload = () => {
    const on = enabled()
    return Object.keys(self.loaded).some(slug => !on.has(slug))
  }

  const pluginRow = (plugin) => {
    const isOn = enabled().has(plugin.slug)
    const loaded = self.loaded[plugin.slug]
    const failed = self.failed[plugin.slug]
    const changed = isOn !== !!loaded

    const version = plugin.version || (plugin.devVersion ? `${plugin.devVersion} (pending review)` : '')
    const description = (plugin.description || '').split('\n')[0].slice(0, 200)

    let status = null
    if (loading[plugin.slug]) status = el('div', { class: 'ingressplus-muted' }, 'Loading…')
    else if (changed && !isOn) status = el('div', { class: 'ingressplus-muted' }, 'Will stop after a reload.')

    return el('div', { class: 'ingressplus-plugin' + (isOn ? ' is-on' : '') },
      el('label', { class: 'ingressplus-plugin-title' },
        el('input', { type: 'checkbox', checked: isOn, onchange: (e) => toggle(plugin, e.target.checked) }),
        el('b', {}, plugin.name),
        el('span', { class: 'ingressplus-muted' }, version ? `v${version}` : '', plugin.author ? ` by ${plugin.author}` : ''),
        ui.category === ALL ? el('span', { class: 'ingressplus-chip' }, categoryOf(plugin)) : null
      ),
      description ? el('div', { class: 'ingressplus-desc' }, description) : null,
      plugin.isAuthor && plugin.devVersion
        ? el('label', { class: 'ingressplus-muted' },
          el('input', { type: 'checkbox', checked: useDev().has(plugin.slug), onchange: (e) => { setUseDev(plugin.slug, e.target.checked); renderDialog() } }),
          ` Use my version ${plugin.devVersion}, still waiting for review`)
        : null,
      failed ? el('div', { class: 'ingressplus-error' }, `Failed to load: ${failed}`) : null,
      status
    )
  }

  // Categories come from the whole tab so the sidebar doesn't jump around
  // while typing; the counts follow the search.
  const categoryList = (plugins) => {
    const names = [...new Set(plugins.map(categoryOf))]
      .sort((a, b) => a === OTHER ? 1 : b === OTHER ? -1 : a.localeCompare(b))
    const counts = {}
    for (const p of plugins) {
      if (matchesQuery(p)) counts[categoryOf(p)] = (counts[categoryOf(p)] || 0) + 1
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    return [...names.map(name => ({ id: name, label: name, count: counts[name] || 0 })),
      { id: ALL, label: 'All Plugins', count: total }]
  }

  let bodyNode = null

  const renderBody = () => {
    if (!bodyNode) return
    const plugins = tabPlugins()
    const categories = categoryList(plugins)
    if (!categories.some(c => c.id === ui.category)) ui.category = ALL

    const sidebar = el('div', { class: 'ingressplus-cats', role: 'tablist', 'aria-orientation': 'vertical' },
      categories.map(c => el('button', {
        type: 'button',
        role: 'tab',
        'aria-selected': String(c.id === ui.category),
        class: 'ingressplus-cat' + (c.id === ui.category ? ' active' : '') + (c.id === ALL ? ' all' : ''),
        onclick: () => { ui.category = c.id; renderBody() }
      }, el('span', {}, c.label), el('span', { class: 'ingressplus-count' }, c.count)))
    )

    const shown = plugins.filter(p => (ui.category === ALL || categoryOf(p) === ui.category) && matchesQuery(p))
    let empty = null
    if (shown.length === 0) {
      if (ui.query) empty = `No plugins match “${ui.query}”.`
      else if (ui.tab === 'enabled') empty = 'You have not enabled any plugins yet. Pick some from the Store tab.'
      else empty = 'No plugins are available to you yet.'
    }

    const list = el('div', { class: 'ingressplus-list' },
      empty ? el('p', { class: 'ingressplus-empty' }, empty) : shown.map(pluginRow))

    bodyNode.replaceChildren(plugins.length ? sidebar : null, list)
  }

  let dialogNode = null

  const renderDialog = () => {
    if (!dialogNode) return
    const scroll = dialogNode.querySelector('.ingressplus-list')?.scrollTop || 0
    dialogNode.replaceChildren(dialogContent())
    renderBody()
    const list = dialogNode.querySelector('.ingressplus-list')
    if (list) list.scrollTop = scroll
  }

  const header = (connected) => {
    const total = (self.catalog || []).length
    const on = enabled().size
    return el('div', { class: 'ingressplus-header' },
      el('img', { class: 'ingressplus-logo', src: baseUrl() + '/icons/icon_ingressplus_64.png', alt: '' }),
      el('div', { class: 'ingressplus-who' },
        connected
          ? [
              el('div', { class: 'ingressplus-label' }, 'Connected agent'),
              el('div', { class: 'ingressplus-name' }, read('username', '?')),
              el('div', { class: 'ingressplus-muted' }, `${on} of ${total} plugin${total === 1 ? '' : 's'} enabled`)
            ]
          : [
              el('div', { class: 'ingressplus-label' }, 'Ingress Plus'),
              el('div', { class: 'ingressplus-name' }, 'Not connected'),
              el('div', { class: 'ingressplus-muted' }, 'Sign in to load your store plugins')
            ]
      ),
      connected
        ? el('button', {
          type: 'button',
          class: 'ingressplus-disconnect',
          onclick: () => { if (window.confirm('Disconnect IITC from Ingress Plus on this device?')) disconnect() }
        }, 'Disconnect')
        : null
    )
  }

  const footer = (connected) => {
    const reloadHint = connected && needsReload()
    return el('div', { class: 'ingressplus-footer' },
      el('a', { class: 'ingressplus-button', href: baseUrl(), target: '_blank', rel: 'noopener' }, 'Open Ingress Plus'),
      el('span', { class: 'ingressplus-spacer' }),
      connected
        ? el('button', {
          type: 'button',
          onclick: async () => {
            try { await fetchCatalog() } catch (e) { notify(e.message) }
            renderDialog()
          }
        }, 'Refresh list')
        : null,
      el('button', {
        type: 'button',
        class: reloadHint ? 'ingressplus-attention' : null,
        title: reloadHint ? 'Some plugins you turned off are still running until IITC reloads' : null,
        onclick: () => window.location.reload()
      }, 'Reload IITC')
    )
  }

  const dialogContent = () => {
    const token = read('token', null)
    bodyNode = null

    if (!token) {
      const codeInput = el('input', { type: 'text', placeholder: 'ipx_…', style: 'width: 100%' })
      return el('div', {},
        header(false),
        el('div', { class: 'ingressplus-connect' },
          el('p', {}, 'Connect IITC to your Ingress Plus account to load the plugins available to you.'),
          el('p', {}, el('button', { type: 'button', onclick: connect }, 'Connect to Ingress Plus')),
          el('details', {},
            el('summary', {}, 'Paste a connection code instead'),
            el('p', { class: 'ingressplus-muted' }, 'For IITC Mobile or blocked popups: open ', baseUrl(), '/iitc/connect in a browser where you are signed in and create a code.'),
            codeInput,
            el('p', {}, el('button', {
              type: 'button',
              onclick: () => {
                const code = codeInput.value.trim()
                if (code.startsWith('ipx_')) saveToken(code, null)
                else notify('That does not look like an Ingress Plus connection code.')
              }
            }, 'Use code'))
          )
        ),
        footer(false)
      )
    }

    const tabs = [
      { id: 'store', label: 'Store', count: (self.catalog || []).length },
      { id: 'enabled', label: 'Enabled', count: enabledPlugins().length }
    ]
    const search = el('input', {
      type: 'search',
      class: 'ingressplus-search',
      placeholder: 'Search plugins…',
      'aria-label': 'Search plugins',
      value: ui.query,
      oninput: (e) => { ui.query = e.target.value; renderBody() }
    })
    bodyNode = el('div', { class: 'ingressplus-main' })

    return el('div', {},
      header(true),
      el('div', { class: 'ingressplus-toolbar' },
        el('div', { class: 'ingressplus-tabs', role: 'tablist' },
          tabs.map(t => el('button', {
            type: 'button',
            role: 'tab',
            'aria-selected': String(ui.tab === t.id),
            class: 'ingressplus-tab' + (ui.tab === t.id ? ' active' : ''),
            onclick: () => { ui.tab = t.id; ui.category = ALL; renderDialog() }
          }, t.label, el('span', { class: 'ingressplus-count' }, t.count)))
        ),
        search
      ),
      bodyNode,
      footer(true)
    )
  }

  const openDialog = () => {
    dialogNode = el('div', { class: 'ingressplus-dialog' })
    renderDialog()
    window.dialog({
      html: dialogNode,
      title: 'Ingress Plus',
      id: 'ingress-plus',
      width: 620,
      closeCallback: () => { dialogNode = null; bodyNode = null }
    })
  }

  const addStyles = () => {
    const style = document.createElement('style')
    style.textContent = `
      .ingressplus-dialog { --ipx-accent: #ffce00; --ipx-teal: #20a8b1; --ipx-line: rgba(255,255,255,0.12); }
      .ingressplus-dialog .ingressplus-muted { opacity: 0.7; font-size: 0.9em; }
      .ingressplus-dialog .ingressplus-error { color: #ff8a8a; font-size: 0.9em; }

      .ingressplus-dialog .ingressplus-header {
        display: flex; align-items: center; gap: 12px;
        padding: 10px 12px; margin-bottom: 10px;
        background: linear-gradient(90deg, rgba(32,168,177,0.28), rgba(32,168,177,0.06));
        border-left: 3px solid var(--ipx-teal); border-radius: 2px;
      }
      .ingressplus-dialog .ingressplus-logo { width: 40px; height: 40px; flex: none; }
      .ingressplus-dialog .ingressplus-who { flex: 1; min-width: 0; line-height: 1.3; }
      .ingressplus-dialog .ingressplus-label { font-size: 0.75em; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ipx-teal); }
      .ingressplus-dialog .ingressplus-name { font-size: 1.35em; font-weight: bold; color: var(--ipx-accent); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .ingressplus-dialog .ingressplus-disconnect { flex: none; opacity: 0.8; }
      .ingressplus-dialog .ingressplus-disconnect:hover { opacity: 1; }

      .ingressplus-dialog .ingressplus-toolbar { display: flex; gap: 10px; align-items: flex-end; border-bottom: 1px solid var(--ipx-line); margin-bottom: 8px; }
      .ingressplus-dialog .ingressplus-tabs { display: flex; gap: 2px; }
      .ingressplus-dialog .ingressplus-tab {
        background: transparent; border: 1px solid transparent; border-bottom: none;
        color: inherit; padding: 5px 12px; cursor: pointer; opacity: 0.75; margin: 0;
      }
      .ingressplus-dialog .ingressplus-tab.active { opacity: 1; color: var(--ipx-accent); border-color: var(--ipx-line); background: rgba(255,255,255,0.05); box-shadow: inset 0 2px 0 var(--ipx-accent); }
      .ingressplus-dialog .ingressplus-search { flex: 1; min-width: 120px; margin-bottom: 4px; padding: 4px 6px; box-sizing: border-box; }

      .ingressplus-dialog .ingressplus-count { margin-left: 6px; font-size: 0.8em; opacity: 0.7; }
      .ingressplus-dialog .ingressplus-main { display: flex; gap: 10px; height: min(50vh, 380px); min-height: 180px; }
      .ingressplus-dialog .ingressplus-cats { flex: 0 0 140px; overflow-y: auto; display: flex; flex-direction: column; gap: 1px; }
      .ingressplus-dialog .ingressplus-cat {
        display: flex; justify-content: space-between; align-items: center; gap: 6px;
        width: 100%; text-align: left; margin: 0; padding: 5px 8px;
        background: transparent; border: none; border-left: 2px solid transparent; color: inherit; cursor: pointer;
      }
      .ingressplus-dialog .ingressplus-cat:hover { background: rgba(255,255,255,0.06); }
      .ingressplus-dialog .ingressplus-cat.active { border-left-color: var(--ipx-accent); background: rgba(255,206,0,0.12); color: var(--ipx-accent); }
      .ingressplus-dialog .ingressplus-cat.all { margin-top: auto; border-top: 1px solid var(--ipx-line); padding-top: 7px; }
      .ingressplus-dialog .ingressplus-list { flex: 1; min-width: 0; overflow-y: auto; padding-right: 4px; }
      .ingressplus-dialog .ingressplus-empty { opacity: 0.7; text-align: center; margin-top: 30px; }

      .ingressplus-dialog .ingressplus-plugin { padding: 7px 6px; border-bottom: 1px solid var(--ipx-line); border-left: 2px solid transparent; }
      .ingressplus-dialog .ingressplus-plugin.is-on { border-left-color: var(--ipx-teal); background: rgba(32,168,177,0.07); }
      .ingressplus-dialog .ingressplus-plugin-title { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px; cursor: pointer; }
      .ingressplus-dialog .ingressplus-desc { opacity: 0.8; font-size: 0.9em; margin: 2px 0 0 22px; }
      .ingressplus-dialog .ingressplus-plugin > .ingressplus-muted,
      .ingressplus-dialog .ingressplus-plugin > .ingressplus-error { margin: 2px 0 0 22px; }
      .ingressplus-dialog .ingressplus-chip { font-size: 0.75em; padding: 0 6px; border: 1px solid var(--ipx-line); border-radius: 8px; opacity: 0.8; }

      .ingressplus-dialog .ingressplus-footer { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--ipx-line); }
      .ingressplus-dialog .ingressplus-spacer { flex: 1; }
      .ingressplus-dialog .ingressplus-button { border: 1px solid var(--ipx-accent); padding: 2px 8px; text-decoration: none; }
      .ingressplus-dialog .ingressplus-attention { box-shadow: 0 0 0 1px var(--ipx-accent), 0 0 6px var(--ipx-accent); }
      .ingressplus-dialog .ingressplus-connect { padding: 0 4px; }

      @media (max-width: 560px) {
        .ingressplus-dialog .ingressplus-toolbar { flex-direction: column; align-items: stretch; }
        .ingressplus-dialog .ingressplus-main { flex-direction: column; height: auto; }
        .ingressplus-dialog .ingressplus-cats { flex: none; flex-direction: row; overflow-x: auto; overflow-y: hidden; }
        .ingressplus-dialog .ingressplus-cat { width: auto; white-space: nowrap; border-left: none; border-bottom: 2px solid transparent; }
        .ingressplus-dialog .ingressplus-cat.active { border-bottom-color: var(--ipx-accent); }
        .ingressplus-dialog .ingressplus-cat.all { margin-top: 0; margin-left: auto; border-top: none; padding-top: 5px; }
        .ingressplus-dialog .ingressplus-list { overflow: visible; }
      }
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
