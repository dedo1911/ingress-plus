<svelte:head>
    <title>Ingress Plus &middot; Media Upload</title>
</svelte:head>

<div>
    <h1>Upload Media</h1>
    <p>New media can be uploaded to Mediagress using our IITC-CE Plugin. To learn more about IITC-CE, please <a href="https://iitc.app/" target="_blank">visit the official site.</a></p>

    <h2>Installation</h2>
    <p>We only support the newest version of IITC-CE. For minimal probability of errors, please use most recent version of your browser.</p>

    <a href="/mediagress.user.js" class="download">
        DOWNLOAD PLUGIN
    </a>

    <h2>Usage</h2>
    <p><span style="color: #FFFFFF">You need to have a C.O.R.E. subscription active</span>, because the plugin works by accessing your inventory from Intel.</p>

    <p>Once you have installed the plugin, a button "Upload to Mediagress" will be present in the toolbar to the right.</p>

    <img src="/images/mediagress_plugin.jpg" alt="Position of the upload button on IITC interface" width="320" />
    <p>Simply pressing this button will upload all the media from your capsules to Mediagress. Media outside capsules won't be uploaded.</p>

    <img src="/images/mediagress_upload.jpg" alt="Successful upload popup" width="320" />
    <p>The media won't show up on the site immediately. Give our admin some time to properly categorize it and add some description :)<br />
    If you have Media that you do not want to upload, make sure it is not in a Capsule. As long as it is not, it'll not be uploaded to Mediagress.</p>
    <p>Questions? Want to know about site updates? <a href="https://t.me/Mediagress" target="_blank">Join us on Telegram.</a></p>

    <h2>FAQ</h2>
    <p class="question">Is my entire Inventory being submitted to Mediagress?</p>
    <p class="answer">No, only Media is being submitted. The plugin will filter out everything that is not a Media item in a Capsule locally before it is sent off. We will never see your Items or Keys.</p>
    <p class="question">Why do I need a C.O.R.E. Subscription?</p>
    <p class="answer">Only Agents with an active C.O.R.E. Subscription have the benefit of accesing their Inventory on the intel map. Without a C.O.R.E. Subscription, our plugin cannot read your Inventory and search for Media. For more information about C.O.R.E., please see <a href="https://niantic.helpshift.com/a/ingress/?s=top-articles&f=what-is-c-o-r-e&p=all" target="_blank">the official Ingress support page</a>.</p>
    <p class="question">Why does the Media have to be in a Capsule for it to upload?</p>
    <p class="answer">For some reason, Media that is not in a Capsule doesn't return any data about itself except that it is an Media item. Once it is loaded into a Capsule or Quantum Capsule, it returns a lot more data about itself.</p>
    <p class="question">What about Media I don't want to upload?</p>
    <p class="answer">There may be a time you don't want to upload a Media, for example due to OpSec reasons. In that case, make sure that the Media that should not be uploaded isn't loaded into any Capsule. This way, the Intel Map doesn't return any data for it and it'll not be uploaded to Mediagress. Make sure that you have clearance to upload potential OpSec media. We are not responsible for any broken OpSec and will not check beforehand if any Media might break it.</p>
    <p class="question">What does the message "Try again in 5 minutes" mean?</p>
    <p class="answer">Niantic rate-limits inventory requests if they happen to quickly, and this is a safeguard to not hit that rate-limit. Try again after 5 minutes!</p>
    <p class="question">What does the message "No new media has been found in your inventory." mean?</p>
    <p class="answer">Since your last upload, no new media has been found in your inventory compared to the last upload. If you have new media, make sure that it has been loaded into a capsule and try again in 5 minutes.</p>
    <p class="question">I have another question!</p>
    <p class="answer">Join us in our Telegram group, where we'll answer any questions that might come up, <a href="https://t.me/Mediagress" target="_blank">here.</a>.</p>
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