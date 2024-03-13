<svelte:head>
    <title>Ingress Plus &middot; Media Upload</title>
</svelte:head>

<div>
    <h1>Upload Media</h1>
    <p>New media can be uploaded to Mediagress using our IITC-CE Plugin and the Ingress C.O.R.E. subscription. To learn more about IITC-CE, please <a href="https://iitc.app/" target="_blank">visit the official site.</a></p>

    <h2>Installation</h2>
    <p>We only support the newest version of IITC-CE. To ensure that everything works as planned, please keep it up-to-date.</p>
    <p><b>NOTE:</b> If you have installed IITC-CE via the Google Play Store on Android, it is <b>out of date</b> as it does not recieve any updates anymore. Make sure to <a href="https://iitc.app/download_mobile" target="_blank">follow the instructions on their site</a> to manually update your IITC-CE app via an APK or F-Droid.</p>

    <a href="/mediagress.user.js" class="download">
        DOWNLOAD PLUGIN
    </a>

    <p><b>Mediagress.net users:</b> If you still have the old plugin from mediagress.net installed, you should uninstall it before reinstalling the plugin from this site.</p>

    <h2>Usage</h2>
    <p><span style="color: #FFFFFF; text-decoration:underline">You need to have an active C.O.R.E. subscription</span> as the plugin needs to access your inventory from the Intel map.</p>

    <p>Once you have installed the plugin, the button "Upload to Mediagress" will be present in the toolbar on the right.</p>

    <img src="/images/mediagress_plugin.jpg" alt="Position of the upload button on IITC interface" width="320" />
    <p>Simply pressing this button will upload all the media from your capsules to Mediagress. Media outside capsules won't be uploaded.</p>

    <img src="/images/mediagress_upload.jpg" alt="Successful upload popup" width="320" />
    <p>The media won't show up on the site immediately. Give our moderators some time to properly categorize it and to add a description :)<br />
    If you have Media that you do not want to upload, make sure it is not in a Capsule. As long as it outside a capsule it will not be uploaded to Mediagress.</p>
    <p>Questions? Want to know about site updates? <a href="https://t.me/Mediagress" target="_blank">Join us in the Mediagress Telegram channel!</a></p>

    <h2>FAQ</h2>
    <p class="question">Is my entire Inventory being submitted to Mediagress?</p>
    <p class="answer">No, only Media is being submitted. The plugin will filter out everything that isn't a Media item in a Capsule locally before it's sent off to us. We will never see your Items or Keys.</p>
    <p class="question">Why do I need a C.O.R.E. subscription?</p>
    <p class="answer">Only Agents with an active C.O.R.E. subscription have the benefit of accesing their Inventory on the intel map. Without a C.O.R.E. Subscription, our plugin cannot read your Inventory and search for Media. For more information about C.O.R.E., please visit <a href="https://niantic.helpshift.com/a/ingress/?s=top-articles&f=what-is-c-o-r-e&p=all" target="_blank">the official Ingress support page for C.O.R.E. here</a>.</p>
    <p class="question">Can I manually submit media by sending you the links they lead to?</p>
    <p class="answer">We really appreciate your help, however there is certain data that is being sent via the Intel map that we want to capture that is not available in the Scanner, such as the Release Date and the Media Level. As such, we cannot manually upload Media at this time.</p>
    <p class="question">Why does the Media have to be in a Capsule for it to upload?</p>
    <p class="answer">For some reason, Media that is not in a Capsule doesn't return any data about itself, with the exception that it reports itself as a Media item. Once it is loaded into a Capsule it returns a lot more data about itself. In addition, this also serves as a way for you to control which Media is getting uploaded and gives you the chance to exclude certain Media you don't want to upload.</p>
    <p class="question">What about Media I don't want to upload?</p>
    <p class="answer">There may be a time you don't want to upload a Media. An example might be OpSec reasons. In that case, make sure that Media that should not be uploaded isn't loaded into any Capsule. This way, the Intel Map doesn't return any data for it and it'll not be uploaded to Mediagress. <b>Make sure that you have clearance to upload potential OpSec media.</b> We are not responsible for any broken OpSec and will not check beforehand if any Media might break it.</p>
    <p class="question">What does the message "Try again in 5 minutes" mean?</p>
    <p class="answer">Niantic rate-limits inventory requests if they happen to quickly and this is a safeguard to not hit that rate-limit. Try again after 5 minutes!</p>
    <p class="question">What does the message "No new media has been found in your inventory." mean?</p>
    <p class="answer">Since your last upload, no new media has been found in your capsules compared to the last upload. If you have new media, make sure that it has been loaded into a capsule and try again in 5 minutes.</p>
    <p class="question">I have another question!</p>
    <p class="answer">Join us in our @Mediagress Telegram group where we'll answer any questions that might come up <a href="https://t.me/Mediagress" target="_blank">with the link in this channel</a>.</p>
</div>

<style>
    div {
        text-align: center;
        margin: 0 1em;
    }
    img {
        border-radius: 1rem;
        border: 2px solid #5e5a75;
    }
    h1, h2 { text-shadow: 0 0 10px black; }
    h1 { font-size: 2.5em; }
    h2 { font-size: 2em; }
    a.download {
        background: rgba(94, 90, 117, 0.25) url("/images/download.svg") no-repeat 1rem center;
        background-size: 1.5rem;
        padding: 1em 1em 1em 3em;
        margin: 1em;
        display: inline-block;
        border-radius: 4px;
        transition: all 250ms ease-in-out;
    }
    a.download:hover {
        background-color: rgba(94, 90, 117, 0.75);
        color: #ffffff;
    }
    p.question { color: #FFFFFF; }
    p.question::before { content: "Q: "; }
    p.answer::before { content: "A: "; }
</style>
