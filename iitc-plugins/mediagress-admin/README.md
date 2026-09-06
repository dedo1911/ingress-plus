# Mediagress Admin (IITC plugin)

Admin-side IITC plugin for Mediagress. Built with
[IITCPluginKit](https://github.com/McBen/IITCPluginKit) (TypeScript + webpack),
unlike `static/mediagress.user.js`, which is still a hand-written single file.

Public on purpose: it only reads COMM and formats what it finds for pasting into
the gated `/admin` page. Anyone could collect the same thing by scrolling to
Point Nemo by hand.

## Build

```bash
yarn          # once
yarn build    # -> ../../static/mediagress-admin.user.js  (+ .meta.js)
```

The output goes straight into the site's `static/` folder, so it is served from
`https://ingress.plus/mediagress-admin.user.js` next to the player plugin, and
Tampermonkey auto-updates from the `.meta.js` beside it. **Both built files are
committed** - the site image is built from the repo, not from this project.

`yarn autobuild` watches and serves on :8100 for development.

## Notes

- The site's eslint does not reach in here (this project has its own linter,
  shipped by the kit), so `yarn lint` at the repo root ignores it in practice.
- `webpack.config.js` extends the kit's metablock with the tags it does not
  emit (`@grant`, `@include`, `@namespace`, `@homepageURL`, the icons). The kit
  picks that file up on its own; it must not import the kit's config back, or
  the build deadlocks.
- Bump `version` in `plugin.json` for any change that should reach installed
  copies - that is what Tampermonkey compares against.
