# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Ingress Plus — a fan site for Niantic's Ingress Prime. Public site lives at https://ingress.plus (not affiliated with Niantic). The repo contains only the SvelteKit frontend; the backend is a PocketBase instance reached through `/api`.

## Commands

Package manager is **yarn** (yarn.lock is committed; `engine-strict=true` in `.npmrc`).

- `yarn dev` — Vite dev server (binds `--host`, so it's reachable on the LAN). The dev server proxies `/api` → `https://ingress.plus`, so the local UI talks to the **production** PocketBase by default. Be careful with any write-path testing while logged in.
- `yarn build` — production build via `@sveltejs/adapter-node` (output in `build/`).
- `yarn preview` — preview the built app.
- `yarn lint` — ESLint over the repo (config: `.eslintrc.cjs`, extends `eslint:recommended`, `standard`, `plugin:svelte/recommended`; `svelte/no-at-html-tags` is disabled because templates use `{@html ...}` for rendered markdown).
- `yarn commit` — commitizen with conventional-changelog. The repo expects Conventional Commits (`feat:`, `fix:`, `feat(scope): ...`).

There is **no test suite** and **no typecheck script**; don't invent one. The project is plain JS + Svelte (no TypeScript in `src/`, although `svelte.config.ts` exists alongside the identical `svelte.config.js` — `vite.config.js` only references the `.js` one).

## Architecture

### Stack

- **SvelteKit 2** + **Svelte 5** (runes). New code uses `$state`, `$props`, `$derived`, snippets (`{#snippet}` / `{@render}`). Don't fall back to Svelte 4 reactivity (`$:`, `export let`) when touching components that already use runes.
- **`@sveltejs/adapter-node`** — the app ships as a Node server (see `Dockerfile`: built artefact runs on distroless `nodejs24`).
- **PocketBase JS SDK** (`pocketbase` npm package). The single shared client lives in [src/lib/pocketbase/index.js](src/lib/pocketbase/index.js) — `new PocketBase('/')`. All collection access goes through this `pb` instance; there is no separate API layer.
- **carta-md** for the markdown editor; **isomorphic-dompurify** wraps untrusted HTML; **@zerodevx/svelte-toast** for toasts; **svelte-multiselect** + **svelte-time** + **lodash.sortby** as smaller helpers.
- **Sass** for styles. Global CSS is `src/style.css`; editor styling is `src/lib/styles/editor.scss`. Both are imported once from the root layout.

### Data flow

The frontend is a thin shell over PocketBase. All reads and writes happen client-side against `pb.collection(...)`, including from `+page.js` `load` functions (which pass `fetch` through to the SDK). Collections currently referenced from the codebase: `badges`, `bug_comments`, `bug_reports`, `bug_reports_public`, `bug_upvotes`, `categories`, `game_events`, `game_events_list`, `media_categories`, `media_destinations`, `medias`, `media_users`, `owned_badges`, `public_users`, `public_users_owned_badges`, `statistics`, `top_media_uploads`, `user_badges`, `users`. Several of these are PocketBase **views** (`*_public`, `*_list`, `top_*`, `public_*`) — treat them as read-only and don't try to write to them.

Auth is Google OAuth2 via `pb.collection('users').authWithOAuth2({ provider: 'google', urlCallback })`. The login flow opens a popup window for the OAuth redirect — see [src/lib/components/Header.svelte](src/lib/components/Header.svelte). On successful login the code copies `meta.avatarUrl` and `meta.name` back onto the user record and persists them. PocketBase's `authStore` is the source of truth; the app mirrors it into the `authData` store on login/refresh.

### Stores

[src/lib/stores/index.js](src/lib/stores/index.js) defines the small set of writable stores used app-wide:

- `authData` — mirror of `pb.authStore` (`{ isValid: null }` until checked).
- `ownedBadges` — current user's `user_badges` rows (refreshed on login and after badge edits).
- `categories` — badge categories with their badges, populated by [src/routes/badges/+page.js](src/routes/badges/+page.js).
- `siteSettings` — UI preferences (`opaqueOwned`, `showUnobtainable`). Hydrated from `localStorage` keys prefixed `siteSettings:` in the root layout's `onMount`. When adding a new setting, follow that prefix convention so it loads automatically.
- `badgeSize` — display size for the badge grid.
- `pendingRequests` / `isLoading` — count of in-flight PocketBase requests, plus a derived boolean. Maintained by the `pb.beforeSend` fetch wrapper in [src/lib/pocketbase/index.js](src/lib/pocketbase/index.js) (browser only — a module-level counter would be shared across SSR requests). Read by [LoadingBar.svelte](src/lib/components/LoadingBar.svelte), the fixed top progress bar in the root layout, which also reacts to SvelteKit's `navigating`. Don't move the counting into `afterSend`: it doesn't run for network errors or auto-cancelled requests, so the count would leak.

### Routing

Standard SvelteKit file-based routing under [src/routes/](src/routes/). Top-level sections: `agent` (own profile + `[username]` public profile + `settings`), `badges`, `events/[event_id]`, `bugs/[bug_id]` + `bugs/new`, `media/[url_id]`, `stats`, `resources`, `investigation`, `verify`, plus static pages (`about`, `attributions`, `privacy`, `terms`). The root [+layout.svelte](src/routes/+layout.svelte) wires the header, footer, toast container, and global stylesheets.

`+page.js` files run on both server and client (no `+page.server.js` anywhere). Pass the framework `fetch` into `pb.collection(...).getFullList({ fetch })` in `load` functions so SSR and client share cache/cookies.

### Service worker

[src/service-worker.js](src/service-worker.js) caches build assets + `static/` for offline use, and uses a network-first-with-cache-fallback strategy for everything else. SvelteKit auto-registers it. If you change cache strategy, bear in mind it intercepts everything except `range`-headed and non-GET requests.

### Dev → prod proxy quirk

[vite.config.js](vite.config.js) hardcodes `/api` → `https://ingress.plus`. There's no local PocketBase fixture in this repo. So `yarn dev` against a logged-in browser session is hitting **live data**. Read-only browsing is safe; mutations (badge ownership edits, bug comments, media submissions, profile updates) will write to production. If a task needs write-path testing, ask the user how they want to point at a staging/local PocketBase before touching it.

### Deployment

`Dockerfile` is a two-stage build: `node:24` for `yarn build`, then `gcr.io/distroless/nodejs24-debian12` running the adapter-node output as `index.js` under uid 65532. No env vars are wired in — the production deployment serves PocketBase on the same origin so the relative `/api` path resolves correctly.

### IITC plugin store

Behind the `PLUGIN_STORE_ENABLED` feature flag. [static/ingress-plus.user.js](static/ingress-plus.user.js) is the sideloader userscript: it gets a long-lived `ipx_` token through the [/iitc/connect](src/routes/iitc/connect/+page.svelte) popup (`postMessage` to `https://intel.ingress.com` only), lists the agent's plugins from `/api/iitc/plugins` and decrypts each one with WebCrypto (ECDH P-256 → HKDF-SHA256 → AES-GCM, matching `internal/iitc/crypto.go` in the backend). Store pages live under [src/routes/plugins/](src/routes/plugins/); the admin review queue is [AdminPlugins.svelte](src/lib/components/plugins/AdminPlugins.svelte). Store data needs a signed-in agent and the backend only returns plugins they can access, so it's fetched client-side after auth, never in a `load` function. Collections: `iitc_plugins`, `iitc_plugin_versions`, `iitc_tokens` (schema and rules in the backend's `docs/iitc-plugins.md`).
