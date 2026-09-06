// ==UserScript==
// @name            IITC Plugin: Mediagress Admin
// @id              mediagress-admin
// @category        Misc
// @version         0.1.0
// @namespace       https://ingress.plus
// @updateURL       https://ingress.plus/mediagress-admin.meta.js
// @downloadURL     https://ingress.plus/mediagress-admin.user.js
// @description     Admin tools for Mediagress on ingress.plus. Currently only a COMM send probe.
// @match           https://intel.ingress.com/*
// @include         https://intel.ingress.com/*
// @grant           none
// @author          IngressPlus
// @icon64          https://ingress.plus/icons/icon_mediagress_64.png
// @homepageURL     https://ingress.plus
// @icon            https://ingress.plus/icons/icon_mediagress_32.png
// ==/UserScript==
function wrapper(SCRIPT_INFO) {
(() => {
    "use strict";
    const POINT_NEMO_lat = -48.876667, POINT_NEMO_lng = -123.393333;
    !function Register(plugin, name) {
        const setup = () => {
            window.plugin[name] = plugin, window.plugin[name].init();
        };
        setup.info = SCRIPT_INFO, window.bootPlugins || (window.bootPlugins = []), window.bootPlugins.push(setup), 
        window.iitcLoaded && setup();
    }(new class MediagressAdmin {
        init() {
            IITC.toolbox.addButton({
                label: "Send COMM probe",
                title: "Post a message to COMM stamped at Point Nemo",
                action: () => this.sendProbe()
            }), IITC.toolbox.addButton({
                label: "Go to Point Nemo",
                title: "Move the map there so COMM loads messages from that area",
                action: () => window.map.setView([ POINT_NEMO_lat, POINT_NEMO_lng ], 13)
            });
        }
        sendProbe() {
            const message = `mediagress probe ${(new Date).toISOString()}`;
            window.postAjax("sendPlext", {
                message,
                latE6: Math.round(1e6 * POINT_NEMO_lat),
                lngE6: Math.round(1e6 * POINT_NEMO_lng),
                tab: "all"
            }, response => this.report(message, "Server replied", response), (jqXHR, textStatus, errorThrown) => this.report(message, "Request failed", {
                textStatus,
                errorThrown,
                status: jqXHR.status,
                body: jqXHR.responseText
            }));
        }
        report(message, title, detail) {
            dialog({
                title: `COMM probe - ${title}`,
                html: `<p>Sent to <b>${POINT_NEMO_lat}, ${POINT_NEMO_lng}</b> on the <b>all</b> tab:</p><pre>${escapeHtmlSpecialChars(message)}</pre><pre>${escapeHtmlSpecialChars(JSON.stringify(detail, void 0, 2))}</pre><p>Now use "Go to Point Nemo" and check whether it appears in COMM.</p>`,
                width: 500
            });
        }
    }, "MediagressAdmin");
})();
};
(function () {
  const info = {};
  if (typeof GM_info !== 'undefined' && GM_info && GM_info.script)
    info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
  if (typeof unsafeWindow != 'undefined' || typeof GM_info == 'undefined' || GM_info.scriptHandler != 'Tampermonkey') {
    const script = document.createElement('script');
    script.appendChild(document.createTextNode( '('+ wrapper +')('+JSON.stringify(info)+');'));
    document.head.appendChild(script);} 
  else wrapper(info);
})();