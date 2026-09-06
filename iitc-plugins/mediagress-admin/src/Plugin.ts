import * as Plugin from "iitcpluginkit";

/**
 * Point Nemo, the oceanic pole of inaccessibility: the furthest point on Earth
 * from any land, and so from any portal or player. Intel accepted a message
 * stamped with these coordinates (verified 2026-09-06), so it does not check
 * where the sender actually is.
 */
const POINT_NEMO = { lat: -48.876667, lng: -123.393333 };

class MediagressAdmin implements Plugin.Class {

    init(): void {
        console.log("MediagressAdmin " + VERSION);

        IITC.toolbox.addButton({
            label: "Send COMM probe",
            title: "Post a message to COMM stamped at Point Nemo",
            action: () => this.sendProbe()
        });

        IITC.toolbox.addButton({
            label: "Go to Point Nemo",
            title: "Move the map there so COMM loads messages from that area",
            action: () => window.map.setView([POINT_NEMO.lat, POINT_NEMO.lng], 13)
        });
    }

    /**
     * Posts straight to sendPlext rather than through IITC.comm.sendChatMessage,
     * which reads the coordinates from the map centre and swallows the server's
     * reply behind a generic alert. The reply is the whole point here.
     */
    private sendProbe(): void {
        const message = `mediagress probe ${new Date().toISOString()}`;

        window.postAjax("sendPlext", {
            message,
            latE6: Math.round(POINT_NEMO.lat * 1e6),
            lngE6: Math.round(POINT_NEMO.lng * 1e6),
            tab: "all"
        },
            (response) => this.report(message, "Server replied", response),
            (jqXHR, textStatus, errorThrown) => this.report(message, "Request failed", { textStatus, errorThrown, status: jqXHR.status, body: jqXHR.responseText })
        );
    }

    /**
     * A 200 with no error only means Intel took the message. Whether it is
     * really there has to be read back out of COMM at those coordinates, which
     * is what the second button is for. Expect a few seconds' delay before it
     * shows up.
     */
    private report(message: string, title: string, detail: unknown): void {
        console.log("MediagressAdmin probe", title, detail);

        dialog({
            title: `COMM probe - ${title}`,
            html: `<p>Sent to <b>${POINT_NEMO.lat}, ${POINT_NEMO.lng}</b> on the <b>all</b> tab:</p>`
                + `<pre>${escapeHtmlSpecialChars(message)}</pre>`
                + `<pre>${escapeHtmlSpecialChars(JSON.stringify(detail, undefined, 2))}</pre>`
                + `<p>Now use "Go to Point Nemo" and check whether it appears in COMM.</p>`,
            width: 500
        });
    }

}

export const main = new MediagressAdmin();
Plugin.Register(main, "MediagressAdmin");
