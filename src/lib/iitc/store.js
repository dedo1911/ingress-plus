// Ingress Plus store for IITC.
//
// Not a userscript: the sideloader (static/ingress-plus.user.js) fetches
// this file from /iitc/store.js on every IITC start and injects it into the
// page, so the store UI can change without agents updating the userscript.
// Everything it does goes through the API the sideloader exposes on
// window.plugin.ingressPlus.
/* global $, Node */
(function () {
  const STORE_VERSION = '1.2.0'
  const API_VERSION = 1
  const LOG_PREFIX = '[Ingress Plus store]'

  const ip = window.plugin && window.plugin.ingressPlus
  if (!ip || ip.apiVersion !== API_VERSION) {
    console.error(LOG_PREFIX, 'the Ingress Plus sideloader is missing or too old for this store, update it from https://ingress.plus/ingress-plus.user.js')
    return
  }
  if (ip.storeVersion) return // already injected
  ip.storeVersion = STORE_VERSION

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
  // plugin, so turning one off only takes effect after a reload. The
  // sideloader announces every state change, which redraws the dialog.
  const toggle = (plugin, on) => {
    ip.setEnabled(plugin.slug, on)
    if (on && !ip.loaded[plugin.slug]) ip.loadPlugin(plugin)
  }

  // Dialog state survives re-renders (any state change redraws the dialog).
  const ALL = '\u0000all'
  const OTHER = 'Other'
  const ui = { tab: 'store', category: ALL, query: '' }

  const catalog = () => ip.catalog || []
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
    const on = ip.enabled()
    return catalog().filter(p => on.has(p.slug) || ip.loaded[p.slug])
  }
  const tabPlugins = () => ui.tab === 'enabled' ? enabledPlugins() : catalog()

  const needsReload = () => {
    const on = ip.enabled()
    return Object.keys(ip.loaded).some(slug => !on.has(slug))
  }

  // The API returns icon paths relative to the site (/api/files/...), and
  // icon files are public, so a plain <img> works from intel.ingress.com.
  // Without an icon, or if it fails to load, show the name's first letter.
  const iconFallback = (plugin) =>
    el('span', { class: 'ingressplus-icon ingressplus-icon-empty', 'aria-hidden': 'true' },
      (plugin.name || plugin.slug || '?').trim().charAt(0).toUpperCase())

  const pluginIcon = (plugin) => {
    if (!plugin.icon) return iconFallback(plugin)
    const src = /^https?:\/\//.test(plugin.icon) ? plugin.icon : ip.baseUrl() + plugin.icon
    return el('img', {
      class: 'ingressplus-icon',
      src,
      alt: '',
      loading: 'lazy',
      onerror: (e) => e.target.replaceWith(iconFallback(plugin))
    })
  }

  const pluginRow = (plugin) => {
    const isOn = ip.enabled().has(plugin.slug)
    const loaded = ip.loaded[plugin.slug]
    const failed = ip.failed[plugin.slug]
    const changed = isOn !== !!loaded

    const version = plugin.version || (plugin.devVersion ? `${plugin.devVersion} (pending review)` : '')
    const description = (plugin.description || '').split('\n')[0].slice(0, 200)

    let status = null
    if (ip.isLoading(plugin.slug)) status = el('div', { class: 'ingressplus-muted' }, 'Loading…')
    else if (changed && !isOn) status = el('div', { class: 'ingressplus-pending' }, 'Will stop after a reload.')

    // The name is a label for the switch, so clicking it toggles too. The
    // version opens the changelog.
    const toggleId = 'ingressplus-toggle-' + plugin.slug
    return el('div', { class: 'ingressplus-plugin' + (isOn ? ' is-on' : '') },
      pluginIcon(plugin),
      el('div', { class: 'ingressplus-plugin-body' },
        el('div', { class: 'ingressplus-plugin-title' },
          el('label', { for: toggleId }, el('b', {}, plugin.name)),
          version
            ? el('button', {
              type: 'button',
              class: 'ingressplus-version',
              title: 'Show changelog',
              'aria-label': `Show the changelog of ${plugin.name}`,
              onclick: () => openChangelog(plugin)
            }, `v${version}`)
            : null,
          plugin.author ? el('span', { class: 'ingressplus-muted' }, `by ${plugin.author}`) : null,
          ui.category === ALL ? el('span', { class: 'ingressplus-chip' }, categoryOf(plugin)) : null
        ),
        description ? el('div', { class: 'ingressplus-desc' }, description) : null,
        plugin.isAuthor && plugin.devVersion
          ? el('label', { class: 'ingressplus-muted' },
            el('input', { type: 'checkbox', checked: ip.useDev().has(plugin.slug), onchange: (e) => ip.setUseDev(plugin.slug, e.target.checked) }),
          ` Use my version ${plugin.devVersion}, still waiting for review`)
          : null,
        failed ? el('div', { class: 'ingressplus-error' }, `Failed to load: ${failed}`) : null,
        status
      ),
      el('label', { class: 'ingressplus-switch', title: isOn ? 'Turn off' : 'Turn on' },
        el('input', {
          type: 'checkbox',
          role: 'switch',
          id: toggleId,
          checked: isOn,
          'aria-label': `Enable ${plugin.name}`,
          onchange: (e) => toggle(plugin, e.target.checked)
        }),
        el('span', { class: 'ingressplus-switch-track', 'aria-hidden': 'true' })
      )
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

  let dialogNode = null
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

  const renderDialog = () => {
    if (!dialogNode) return
    const scroll = dialogNode.querySelector('.ingressplus-list')?.scrollTop || 0
    dialogNode.replaceChildren(dialogContent())
    renderBody()
    const list = dialogNode.querySelector('.ingressplus-list')
    if (list) list.scrollTop = scroll
  }

  // The agent's faction, as Intel reports it for the signed-in player.
  const FACTIONS = {
    ENLIGHTENED: { name: 'Enlightened', key: 'enl', image: 'enlightened.svg', color: '#03dc03' },
    RESISTANCE: { name: 'Resistance', key: 'res', image: 'resistance.svg', color: '#0088ff' }
  }

  // The logos are white SVGs on ingress.plus, which sends no CORS headers,
  // so a CSS mask can't load them from Intel. An <img> can, and an SVG
  // filter paints its shape in the faction colour. The wrapper carries the
  // pulsing glow, so it shines in the colour the image already has.
  const factionLogo = () => {
    const faction = FACTIONS[window.PLAYER && window.PLAYER.team]
    if (!faction) return null
    return el('span', { class: 'ingressplus-faction', style: `--ipx-faction: ${faction.color}`, title: faction.name },
      el('img', {
        src: `${ip.baseUrl()}/images/${faction.image}`,
        alt: faction.name,
        style: `filter: url(#ingressplus-tint-${faction.key})`
      }))
  }

  // The tint filters live outside the dialog, which is rebuilt on every
  // state change, so the images never point at a filter that is gone.
  const addFactionFilters = () => {
    const holder = document.createElement('div')
    holder.setAttribute('aria-hidden', 'true')
    holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'
    // Static markup built from the constants above, no outside data.
    holder.innerHTML = '<svg width="0" height="0">' + Object.values(FACTIONS).map(f =>
      `<filter id="ingressplus-tint-${f.key}" color-interpolation-filters="sRGB"><feFlood flood-color="${f.color}"/><feComposite in2="SourceAlpha" operator="in"/></filter>`
    ).join('') + '</svg>'
    document.body.appendChild(holder)
  }

  const header = (connected) => {
    const total = catalog().length
    const on = ip.enabled().size
    return el('div', { class: 'ingressplus-header' },
      el('div', { class: 'ingressplus-who' },
        connected
          ? [
              el('div', { class: 'ingressplus-label' }, 'Connected agent'),
              el('div', { class: 'ingressplus-name' }, factionLogo(), el('span', {}, ip.username() || '?')),
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
          onclick: () => { if (window.confirm('Disconnect IITC from Ingress Plus on this device?')) ip.disconnect() }
        }, 'Disconnect')
        : null
    )
  }

  const footer = (connected) => {
    const reloadHint = connected && needsReload()
    return el('div', { class: 'ingressplus-footer' },
      el('a', { class: 'ingressplus-home', href: ip.baseUrl(), target: '_blank', rel: 'noopener' },
        el('img', { src: ip.baseUrl() + '/icons/icon_ingressplus_64.png', alt: '' }),
        el('span', {}, 'Open Ingress Plus')),
      el('span', { class: 'ingressplus-spacer' }),
      connected
        ? el('button', {
          type: 'button',
          onclick: () => ip.fetchCatalog().catch(e => ip.notify(e.message))
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
    bodyNode = null

    if (!ip.isConnected()) {
      const codeInput = el('input', { type: 'text', placeholder: 'ipx_…', style: 'width: 100%' })
      return el('div', {},
        header(false),
        el('div', { class: 'ingressplus-connect' },
          el('p', {}, 'Connect IITC to your Ingress Plus account to load the plugins available to you.'),
          el('p', {}, el('button', { type: 'button', onclick: ip.connect }, 'Connect to Ingress Plus')),
          el('details', {},
            el('summary', {}, 'Paste a connection code instead'),
            el('p', { class: 'ingressplus-muted' }, 'For IITC Mobile or blocked popups: open ',
              el('a', { class: 'ingressplus-link', href: ip.baseUrl() + '/iitc/connect', target: '_blank', rel: 'noopener' }, ip.baseUrl() + '/iitc/connect'),
              ' in a browser where you are signed in and create a code.'),
            codeInput,
            el('p', {}, el('button', {
              type: 'button',
              onclick: () => {
                const code = codeInput.value.trim()
                if (code.startsWith('ipx_')) ip.saveToken(code, null)
                else ip.notify('That does not look like an Ingress Plus connection code.')
              }
            }, 'Use code'))
          )
        ),
        footer(false)
      )
    }

    const tabs = [
      { id: 'store', label: 'Store', count: catalog().length },
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
    dialogNode = el('div', { id: 'ingressplus-store', class: 'ingressplus-dialog' })
    renderDialog()
    window.dialog({
      html: dialogNode,
      title: 'Ingress Plus',
      id: 'ingress-plus',
      width: 620,
      closeCallback: () => { dialogNode = null; bodyNode = null }
    })
  }

  // ---- changelog --------------------------------------------------------

  // Sideloader 2.2.0 and newer expose their API helper. Older ones don't, so
  // the store makes the call itself with the token they keep.
  const apiGet = async (path) => {
    if (typeof ip.api === 'function') return ip.api(path)
    let token = null
    try { token = JSON.parse(localStorage.getItem('ingressPlus:token')) } catch (e) {}
    if (!token) throw new Error('Not connected')
    const res = await fetch(ip.baseUrl() + path, { headers: { Authorization: 'Bearer ' + token }, cache: 'no-store' })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`)
    return body
  }

  // Version history per plugin, fetched once per published version.
  const details = {}
  const fetchDetail = (plugin) => {
    const key = `${plugin.slug}@${plugin.version || ''}@${plugin.devVersion || ''}`
    if (!details[key]) {
      details[key] = apiGet(`/api/iitc/plugins/${encodeURIComponent(plugin.slug)}`)
      details[key].catch(() => { delete details[key] })
    }
    return details[key]
  }

  // Versions follow semver (the backend checks it on upload). A suffix sorts
  // before the plain release, which is right for -beta and close enough for
  // the rare +build.
  const parseVersion = (v) => {
    const m = /^(\d+)\.(\d+)\.(\d+)(?:[-.+](.+))?$/.exec(v || '')
    return m ? { nums: [+m[1], +m[2], +m[3]], suffix: m[4] || '' } : null
  }
  const compareVersions = (a, b) => {
    const pa = parseVersion(a)
    const pb = parseVersion(b)
    if (!pa || !pb) return String(a).localeCompare(String(b), undefined, { numeric: true })
    for (let i = 0; i < 3; i++) {
      if (pa.nums[i] !== pb.nums[i]) return pa.nums[i] - pb.nums[i]
    }
    if (pa.suffix === pb.suffix) return 0
    if (!pa.suffix) return 1
    if (!pb.suffix) return -1
    return pa.suffix.localeCompare(pb.suffix, undefined, { numeric: true })
  }

  const STATUS_LABELS = { pending: 'pending review', rejected: 'rejected' }

  const versionList = (versions) => {
    if (versions.length === 0) return el('p', { class: 'ingressplus-muted' }, 'No versions to show.')
    return el('ol', { class: 'ingressplus-versions' },
      versions.map(v => el('li', {},
        el('div', { class: 'ingressplus-version-head' },
          el('b', {}, `v${v.version}`),
          el('span', { class: 'ingressplus-muted' }, (v.created || '').slice(0, 10)),
          v.status && STATUS_LABELS[v.status] ? el('span', { class: 'ingressplus-chip' }, STATUS_LABELS[v.status]) : null
        ),
        (v.changelog || '').trim()
          ? el('div', { class: 'ingressplus-changelog' }, v.changelog.trim())
          : el('div', { class: 'ingressplus-muted' }, 'No changelog for this version.')
      )))
  }

  const newestFirst = (versions) => [...versions].sort((a, b) => compareVersions(b.version, a.version))

  // Fills holder once the history arrives. pick narrows the version list.
  const fillChangelog = (holder, plugin, pick = (v) => v) => {
    holder.replaceChildren(el('p', { class: 'ingressplus-muted' }, 'Loading changelog…'))
    fetchDetail(plugin)
      .then(detail => holder.replaceChildren(versionList(newestFirst(pick(detail.versions || [])))))
      .catch(e => holder.replaceChildren(el('p', { class: 'ingressplus-error' }, `Could not load the changelog: ${e.message}`)))
  }

  const openChangelog = (plugin) => {
    const holder = el('div', { class: 'ingressplus-changelog-list' })
    fillChangelog(holder, plugin)
    window.dialog({
      html: el('div', { class: 'ingressplus-dialog ingressplus-changelog-dialog' }, holder),
      title: `${plugin.name} changelog`,
      id: 'ingress-plus-changelog',
      width: 480
    })
  }

  // ---- what's new after an update ---------------------------------------

  // The version of each plugin that was loaded last time, so a newer one can
  // say what changed. Only reviewed versions count: an author trying their
  // pending upload shouldn't be told about it later.
  const SEEN_KEY = 'ingressPlus:seenVersions'
  const readSeen = () => {
    try { return JSON.parse(localStorage.getItem(SEEN_KEY)) || {} } catch (e) { return {} }
  }
  const writeSeen = (seen) => {
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)) } catch (e) { console.warn(LOG_PREFIX, 'could not save the loaded versions:', e) }
  }

  const updates = {} // slug -> { from, to }, waiting for the popup
  let booted = false
  let updatesTimer = null

  const checkUpdates = () => {
    const seen = readSeen()
    let dirty = false
    for (const [slug, loaded] of Object.entries(ip.loaded)) {
      if (loaded.dev || !loaded.version || updates[slug] || seen[slug] === loaded.version) continue
      if (seen[slug] && compareVersions(loaded.version, seen[slug]) > 0) {
        updates[slug] = { from: seen[slug], to: loaded.version }
      } else {
        // First load, or a version that was pulled: nothing to announce.
        seen[slug] = loaded.version
        dirty = true
      }
    }
    if (dirty) writeSeen(seen)
    if (booted && Object.keys(updates).length) {
      // Wait for the startup loads to settle, so one popup covers them all.
      clearTimeout(updatesTimer)
      updatesTimer = setTimeout(showUpdates, 1500)
    }
  }

  const showUpdates = () => {
    if (catalog().some(p => ip.isLoading(p.slug))) {
      updatesTimer = setTimeout(showUpdates, 1500)
      return
    }
    const slugs = Object.keys(updates)
    if (slugs.length === 0) return
    const seen = readSeen()
    const items = []
    for (const slug of slugs) {
      const { from, to } = updates[slug]
      delete updates[slug]
      seen[slug] = to
      const plugin = catalog().find(p => p.slug === slug)
      if (plugin) items.push({ plugin, from, to })
    }
    writeSeen(seen)
    if (items.length === 0) return

    items.sort((a, b) => a.plugin.name.localeCompare(b.plugin.name))
    const sections = items.map(({ plugin, from, to }, i) => {
      const holder = el('div', { class: 'ingressplus-changelog-list' })
      fillChangelog(holder, plugin, (versions) => versions.filter(v =>
        (!v.status || v.status === 'approved') &&
        compareVersions(v.version, from) > 0 && compareVersions(v.version, to) <= 0))
      return el('details', { class: 'ingressplus-update', name: 'ingressplus-updates', open: i === 0 },
        el('summary', {},
          pluginIcon(plugin),
          el('b', {}, plugin.name),
          el('span', { class: 'ingressplus-muted' }, `v${from} → v${to}`)),
        holder)
    })

    window.dialog({
      html: el('div', { class: 'ingressplus-dialog ingressplus-changelog-dialog' },
        el('p', {}, items.length === 1
          ? 'A plugin you use was updated since you last opened IITC.'
          : `${items.length} plugins you use were updated since you last opened IITC.`),
        sections),
      title: 'Ingress Plus: plugins updated',
      id: 'ingress-plus-updates',
      width: 520
    })
  }

  // Layout plugins such as Prime Intel restyle every button and input in
  // IITC windows with selectors like "body.x .ui-dialog-content button".
  // The store outranks them without !important: :is() takes the specificity
  // of its strongest argument, the dialog's id, so every rule here beats
  // theirs. It also matches the class, because Prime animates a closing
  // window through a copy with all ids removed, and the copy must keep the
  // store's styles (without them the faction logo shows at full size).
  // So the store sets every property those plugins touch, instead of
  // inheriting whatever the page has.
  const S = ':is(#ingressplus-store, .ingressplus-dialog)'

  const addStyles = () => {
    const style = document.createElement('style')
    style.textContent = `
      ${S} { --ipx-accent: #ffce00; --ipx-teal: #20a8b1; --ipx-line: rgba(255,255,255,0.12); }

      ${S} button {
        margin: 0; padding: 3px 10px; cursor: pointer;
        font: inherit; font-weight: normal; letter-spacing: normal; text-transform: none; line-height: normal;
        background: rgba(8,48,78,0.9); border: 1px solid var(--ipx-accent); border-radius: 2px;
        color: var(--ipx-accent); box-shadow: none; transition: none;
      }
      ${S} button:where(:hover) { background: rgba(255,206,0,0.12); }
      ${S} input[type="text"], ${S} input[type="search"] {
        margin: 0; font: inherit; letter-spacing: normal; text-transform: none;
        background: rgba(0,0,0,0.3); border: 1px solid var(--ipx-line); border-radius: 2px;
        color: inherit; box-shadow: none; outline: none;
      }
      ${S} input[type="text"]:focus, ${S} input[type="search"]:focus { border-color: var(--ipx-teal); }
      ${S} .ingressplus-muted { opacity: 0.7; font-size: 0.9em; }
      ${S} .ingressplus-error { color: #ff8a8a; font-size: 0.9em; }
      ${S} .ingressplus-pending { color: var(--ipx-accent); font-size: 0.9em; font-weight: bold; }

      ${S} .ingressplus-header {
        display: flex; align-items: center; gap: 12px;
        padding: 10px 12px; margin-bottom: 10px;
        background: linear-gradient(90deg, rgba(32,168,177,0.28), rgba(32,168,177,0.06));
        border-left: 3px solid var(--ipx-teal); border-radius: 2px;
      }
      ${S} .ingressplus-who { flex: 1; min-width: 0; line-height: 1.3; }
      ${S} .ingressplus-label { font-size: 0.75em; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ipx-teal); }
      ${S} .ingressplus-name { display: flex; align-items: center; gap: 8px; font-size: 1.35em; font-weight: bold; color: var(--ipx-accent); }
      ${S} .ingressplus-name > span:last-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      ${S} .ingressplus-faction { flex: none; display: inline-flex; animation: ingressplus-pulse 2.4s ease-in-out infinite; }
      ${S} .ingressplus-faction img { display: block; height: 1.3em; width: auto; }
      @keyframes ingressplus-pulse {
        0%, 100% { filter: drop-shadow(0 0 1px var(--ipx-faction)); }
        50% { filter: drop-shadow(0 0 6px var(--ipx-faction)) drop-shadow(0 0 2px var(--ipx-faction)); }
      }
      ${S} .ingressplus-disconnect { flex: none; opacity: 0.8; }
      ${S} .ingressplus-disconnect:hover { opacity: 1; }

      ${S} .ingressplus-toolbar { display: flex; gap: 10px; align-items: flex-end; border-bottom: 1px solid var(--ipx-line); margin-bottom: 8px; }
      ${S} .ingressplus-tabs { display: flex; gap: 2px; }
      ${S} .ingressplus-tab {
        background: transparent; border: 1px solid transparent; border-bottom: none;
        color: inherit; padding: 5px 12px; cursor: pointer; opacity: 0.75; margin: 0; border-radius: 0;
      }
      ${S} .ingressplus-tab.active { opacity: 1; color: var(--ipx-accent); border-color: var(--ipx-line); background: rgba(255,255,255,0.05); box-shadow: inset 0 2px 0 var(--ipx-accent); }
      ${S} .ingressplus-search { flex: 1; min-width: 120px; margin-bottom: 4px; padding: 4px 6px; box-sizing: border-box; height: auto; }

      ${S} .ingressplus-count { margin-left: 6px; font-size: 0.8em; opacity: 0.7; }
      ${S} .ingressplus-main { display: flex; gap: 10px; height: min(50vh, 380px); min-height: 180px; }
      ${S} .ingressplus-cats { flex: 0 0 140px; overflow-y: auto; display: flex; flex-direction: column; gap: 1px; }
      ${S} .ingressplus-cat {
        display: flex; justify-content: space-between; align-items: center; gap: 6px;
        width: 100%; text-align: left; margin: 0; padding: 5px 8px;
        background: transparent; border: none; border-left: 2px solid transparent; border-radius: 0; color: inherit; cursor: pointer;
      }
      ${S} .ingressplus-cat:hover { background: rgba(255,255,255,0.06); }
      ${S} .ingressplus-cat.active { border-left-color: var(--ipx-accent); background: rgba(255,206,0,0.12); color: var(--ipx-accent); }
      ${S} .ingressplus-cat.all { margin-top: auto; border-top: 1px solid var(--ipx-line); padding-top: 7px; }
      ${S} .ingressplus-list { flex: 1; min-width: 0; overflow-y: auto; padding-right: 4px; }
      ${S} .ingressplus-empty { opacity: 0.7; text-align: center; margin-top: 30px; }

      ${S} .ingressplus-plugin { display: flex; gap: 10px; align-items: flex-start; padding: 7px 6px; border-bottom: 1px solid var(--ipx-line); border-left: 2px solid transparent; }
      ${S} .ingressplus-plugin-body { flex: 1; min-width: 0; }
      ${S} .ingressplus-icon { flex: none; width: 36px; height: 36px; object-fit: contain; border-radius: 4px; }
      ${S} .ingressplus-icon-empty {
        display: flex; align-items: center; justify-content: center;
        background: rgba(32,168,177,0.2); color: var(--ipx-teal); font-weight: bold; font-size: 1.2em;
      }
      ${S} .ingressplus-plugin.is-on { border-left-color: var(--ipx-teal); background: rgba(32,168,177,0.07); }
      ${S} .ingressplus-plugin-title { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px; }
      ${S} .ingressplus-desc { opacity: 0.8; font-size: 0.9em; margin-top: 2px; }
      ${S} .ingressplus-plugin-body > .ingressplus-muted,
      ${S} .ingressplus-plugin-body > .ingressplus-error,
      ${S} .ingressplus-plugin-body > .ingressplus-pending { margin-top: 2px; }

      ${S} .ingressplus-switch { flex: none; align-self: center; position: relative; display: block; width: 38px; height: 22px; cursor: pointer; }
      ${S} .ingressplus-switch input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
      ${S} .ingressplus-switch-track {
        position: absolute; inset: 0; border-radius: 11px; pointer-events: none;
        background: rgba(255,255,255,0.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.25);
        transition: background 0.18s, box-shadow 0.18s;
      }
      ${S} .ingressplus-switch-track::after {
        content: ''; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%;
        background: #cfd8dc; box-shadow: 0 1px 3px rgba(0,0,0,0.5);
        transition: transform 0.18s ease, background 0.18s;
      }
      ${S} .ingressplus-switch input:checked + .ingressplus-switch-track { background: var(--ipx-teal); box-shadow: inset 0 0 0 1px var(--ipx-teal), 0 0 8px rgba(32,168,177,0.5); }
      ${S} .ingressplus-switch input:checked + .ingressplus-switch-track::after { transform: translateX(16px); background: #fff; }
      ${S} .ingressplus-switch:hover .ingressplus-switch-track { box-shadow: inset 0 0 0 1px var(--ipx-accent); }
      ${S} .ingressplus-switch input:focus-visible + .ingressplus-switch-track { outline: 2px solid var(--ipx-accent); outline-offset: 2px; }
      @media (prefers-reduced-motion: reduce) {
        ${S} .ingressplus-switch-track, ${S} .ingressplus-switch-track::after { transition: none; }
        ${S} .ingressplus-faction { animation: none; filter: drop-shadow(0 0 3px var(--ipx-faction)); }
      }
      ${S} .ingressplus-plugin-title label { cursor: pointer; }
      ${S} .ingressplus-version {
        padding: 0; background: none; border: none; border-radius: 0;
        color: inherit; opacity: 0.7; font-size: 0.9em;
        text-decoration: underline dotted; text-underline-offset: 2px;
      }
      ${S} .ingressplus-version:hover, ${S} .ingressplus-version:focus-visible { background: none; opacity: 1; color: var(--ipx-accent); }

      ${S}.ingressplus-changelog-dialog { max-height: min(70vh, 560px); overflow-y: auto; }
      ${S} .ingressplus-versions { list-style: none; margin: 0; padding: 0; }
      ${S} .ingressplus-versions li { padding: 6px 0; border-bottom: 1px solid var(--ipx-line); }
      ${S} .ingressplus-versions li:last-child { border-bottom: none; }
      ${S} .ingressplus-version-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; }
      ${S} .ingressplus-version-head b { color: var(--ipx-accent); }
      ${S} .ingressplus-changelog { white-space: pre-wrap; overflow-wrap: anywhere; margin-top: 3px; opacity: 0.9; }
      ${S} .ingressplus-update { border: 1px solid var(--ipx-line); border-radius: 2px; margin-bottom: 6px; }
      ${S} .ingressplus-update[open] { border-color: var(--ipx-teal); }
      ${S} .ingressplus-update summary {
        display: flex; align-items: center; gap: 8px; padding: 6px 8px; cursor: pointer;
        list-style: none; background: rgba(32,168,177,0.08);
      }
      ${S} .ingressplus-update summary::-webkit-details-marker { display: none; }
      ${S} .ingressplus-update summary::after { content: '▸'; margin-left: auto; color: var(--ipx-teal); }
      ${S} .ingressplus-update[open] summary::after { content: '▾'; }
      ${S} .ingressplus-update summary .ingressplus-icon { width: 24px; height: 24px; font-size: 0.9em; }
      ${S} .ingressplus-update .ingressplus-changelog-list { padding: 2px 10px 4px; }
      ${S} .ingressplus-chip { font-size: 0.75em; padding: 0 6px; border: 1px solid var(--ipx-line); border-radius: 8px; opacity: 0.8; }

      ${S} .ingressplus-footer { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--ipx-line); }
      ${S} .ingressplus-spacer { flex: 1; }
      ${S} .ingressplus-home { display: inline-flex; align-items: center; gap: 6px; text-decoration: none; }
      ${S} .ingressplus-home img { width: 22px; height: 22px; }
      ${S} .ingressplus-home:hover span { text-decoration: underline; }
      ${S} .ingressplus-attention { box-shadow: 0 0 0 1px var(--ipx-accent), 0 0 6px var(--ipx-accent); }
      ${S} .ingressplus-connect { padding: 0 4px; }
      ${S} .ingressplus-link { color: var(--ipx-accent); text-decoration: underline; word-break: break-all; }

      @media (max-width: 560px) {
        ${S} .ingressplus-toolbar { flex-direction: column; align-items: stretch; }
        ${S} .ingressplus-main { flex-direction: column; height: auto; }
        ${S} .ingressplus-cats { flex: none; flex-direction: row; overflow-x: auto; overflow-y: hidden; }
        ${S} .ingressplus-cat { width: auto; white-space: nowrap; border-left: none; border-bottom: 2px solid transparent; }
        ${S} .ingressplus-cat.active { border-bottom-color: var(--ipx-accent); }
        ${S} .ingressplus-cat.all { margin-top: 0; margin-left: auto; border-top: none; padding-top: 5px; }
        ${S} .ingressplus-list { overflow: visible; }
      }
    `
    document.head.appendChild(style)
  }

  function setup () {
    addStyles()
    addFactionFilters()
    booted = true
    checkUpdates()
    if (window.IITC && window.IITC.toolbox && window.IITC.toolbox.addButton) {
      window.IITC.toolbox.addButton({ label: 'Ingress Plus', title: 'Ingress Plus plugins', action: openDialog })
    } else {
      $('<a>').text('Ingress Plus').attr('title', 'Ingress Plus plugins').click(openDialog).appendTo($('#toolbox'))
    }
  }
  setup.info = { script: { name: 'Ingress Plus store', version: STORE_VERSION } }

  ip.openDialog = openDialog
  ip.openChangelog = openChangelog
  ip.onChange(renderDialog)
  ip.onChange(checkUpdates)

  if (window.iitcLoaded) {
    setup()
  } else {
    if (!window.bootPlugins) window.bootPlugins = []
    window.bootPlugins.push(setup)
  }
})()
