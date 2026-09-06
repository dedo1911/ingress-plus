import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * The kit hardcodes its own @namespace and emits no @grant, @include or
 * @homepageURL, so its metablock is missing tags the other Ingress Plus
 * plugins carry and Tampermonkey expects.
 *
 * Its banner plugin turns every option it is handed into a tag, and reads them
 * at emit time - so the fix is to reach in and add ours while the build is
 * still starting up. Merging a second banner plugin would emit a second
 * metablock, and forking the kit's config would have to be re-done on upgrade.
 */
const { metablock = {} } = JSON.parse(readFileSync("./plugin.json", "utf8"));

class ExtendMetaBlock {
  apply(compiler) {
    const banner = compiler.options.plugins.find((p) => typeof p?.generateMetaBlock === "function");
    if (!banner) throw new Error("iitcpluginkit's metablock plugin is gone - check the kit version");
    Object.assign(banner.options, metablock);
  }
}

export default {
  // Build straight into the site's static folder, so the plugin is served from
  // https://ingress.plus/mediagress-admin.user.js next to mediagress.user.js.
  // The kit also emits a .meta.js there, which is what @updateURL points at.
  output: { path: resolve(import.meta.dirname, "../../static") },
  plugins: [new ExtendMetaBlock()]
};
