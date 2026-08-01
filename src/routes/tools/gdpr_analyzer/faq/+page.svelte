<script>
  import { toast } from '@zerodevx/svelte-toast'
  import { resolve } from '$app/paths'
  import Callout from '$lib/components/Callout.svelte'

  // Built from parts (rather than a single hardcoded mailto: string) so the button and the
  // copyable fields below it can't drift out of sync with each other.
  const REQUEST_EMAIL = 'privacy@nianticspatial.com'
  const REQUEST_SUBJECT = 'GDPR Request'
  const REQUEST_BODY = `Dear Niantic Spatial team,
I'd like to request all of my data that Niantic Spatial holds that is connected to this Email address, [YOUR EMAIL HERE], including but not limited to all of my data that is connected to Ingress and Operation Portal Recon.

Thank you in advance.`

  const mailtoHref = `mailto:${REQUEST_EMAIL}?subject=${encodeURIComponent(REQUEST_SUBJECT)}&body=${encodeURIComponent(REQUEST_BODY)}`

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.push(`${label} copied to clipboard!`, { classes: ['successToast'] })
    } catch (err) {
      console.error(err)
      toast.push('Could not copy to clipboard.', { classes: ['errorToast'] })
    }
  }
</script>

<svelte:head>
  <title>Ingress Plus &middot; GDPR Analyzer &middot; Guide &amp; FAQ</title>
</svelte:head>

<div class="container">
  <h1>GDPR Analyzer &mdash; Guide &amp; FAQ</h1>

  <p class="back-link">
    <a href={resolve('/tools/gdpr_analyzer')}>&larr; Back to the GDPR Analyzer</a>
  </p>

  <h2>How this tool works</h2>
  <p>
    Thanks to the "General Data Protection Regulation" (GDPR) that was enacted in Europe, everyone who plays Ingress
    can request all their personal data that Niantic Spatial holds for them. This includes stuff like your location,
    coordinates of visited Portals, details about Portal Submissions and more. Interestingly, it contains a lot of data
    that the Ingress Scanner doesn't actually show, such as how much MU you destroyed or a list of all in-app purchases.
  </p>
  <p>
    With this tool you can add the data that Niantic Spatial sends to have it analyzed and visualized. You can simply drag-and-drop
    the files from the archive that is sent to you into the tool, which will analyze it entirely within your browser. No data is
    being sent to us or anyone else.
  </p>

  <h2>Requesting your data from Niantic</h2>
  <p>
    To start, send Niantic Spatial's privacy team an email requesting your data -
    use the button below to open a pre-filled email in your mail client, or copy the fields
    manually underneath it if that doesn't work.
  </p>

  <a class="mailto-button" href={mailtoHref}>
    <img src="/images/comment.svg" alt="" />
    Click to send an email to Niantic to request your data
  </a>

  <div class="mail-fields">
    <div
      class="mail-field"
      role="button"
      tabindex="0"
      onclick={() => copyToClipboard(REQUEST_EMAIL, 'Email address')}
      onkeydown={e => { if (e.key === 'Enter' || e.key === ' ') copyToClipboard(REQUEST_EMAIL, 'Email address') }}
    >
      <span class="mail-field-label">Send email to: (click to copy)</span>
      <span class="mail-field-value">{REQUEST_EMAIL}</span>
    </div>
    <div
      class="mail-field"
      role="button"
      tabindex="0"
      onclick={() => copyToClipboard(REQUEST_SUBJECT, 'Subject')}
      onkeydown={e => { if (e.key === 'Enter' || e.key === ' ') copyToClipboard(REQUEST_SUBJECT, 'Subject') }}
    >
      <span class="mail-field-label">Email subject (click to copy)</span>
      <span class="mail-field-value">{REQUEST_SUBJECT}</span>
    </div>
    <div
      class="mail-field"
      role="button"
      tabindex="0"
      onclick={() => copyToClipboard(REQUEST_BODY, 'Body')}
      onkeydown={e => { if (e.key === 'Enter' || e.key === ' ') copyToClipboard(REQUEST_BODY, 'Body') }}
    >
      <span class="mail-field-label">Email body (click to copy)</span>
      <span class="mail-field-value body">{REQUEST_BODY}</span>
    </div>
  </div>

  <ol>
    <li>Make sure to send this email from the same address that you are requesting your data for. Be sure to also replace the [YOUR EMAIL HERE] with your account email.</li>
    <li>Shortly after sending a request, you should receive a confirmation that your request is being processed.
      Normally, it takes almost a month until you actually receive your data back from Niantic Spatial, so the only thing you can do for now is wait.
    </li>
    <li>Once the download link with your data arrives, make sure to download the linked archive. It will most likely be saved on Google Drive and be deleted after 30 days.
      If you do not download your archive within that time (or lose it afterwards), it is lost and you need to request another one.
    </li>
    <li>Unpack your archive to a secure place on your device. It will be password protected, with the password being sent in a separate email.
    </li>
    <li>Once unpacked, you can simply drag and drop any file you want to analyze into the tool. Adding multiple files at once allows for more complex analysis, such as
      calculating your ratio of deployed and destroyed Resonators. Feel free to drop in your entire unpacked archive to make sure you get the most out of it!
    </li>
  </ol>

  <Callout variant="warning">
    Not all files can currently be analyzed. We are working to add as many as possible, with files that are listed as "verified to be part of a GDPR dump"
    already on our radar!<br>
    If you happen to have a file that is part of your GDPR dump, but listed as "does not seem to come from an Ingress GDPR export", please let us know so we can take
    a look and add it to the tool!
  </Callout>

  <h2>FAQ</h2>

  <details class="faq-item">
    <summary>Is my data actually kept private?</summary>
    <p>
      Yes, all the processing of the files happens entirely on your device. No data is ever sent back to us or any third party.
      If you are unsure, you can load the page, disconnect from the internet and then add the files; the tool will still work as
      no internet connection is needed.<br>
      <br>
      If you want to be extra sure, feel free to take a look at the source code of the tool itself on our GitHub page! It (and the entire site)
      is open source and all of the code can be examined.
    </p>
  </details>

  <details class="faq-item">
    <summary>Which files can this tool analyze right now?</summary>
    <p>
      [Placeholder] List/describe the file types currently supported (e.g. location history
      files, store_purchases.tsv) and note that more are being added over time.
    </p>
  </details>

  <details class="faq-item">
    <summary>I dropped in a file and nothing happened / it wasn't recognized. What do I do?</summary>
    <p>
      We need to look at each file separately and integrate its analysis into the tool. As such, not every file from the GDPR dump can be used
      by the tool yet. Based on one of our personal GDPR exports, we have created a list of file names that we already know exist and can be part
      of your data, but haven't yet had the opportunity to add to the tool. These will be listed at the bottom of the page after they have been added.<br>
      <br>
      That being said, there may be some files that we might have missed or new files that Niantic Spatial has added, such as for new events. Unrecognized files will
      also be listed at the bottom of the page as being unrecognized. If you are sure the file name is correct and the file is from your GDPR export, let us
      know so we can keep track of it and integrate it into the tool!
    </p>
  </details>

  <details class="faq-item">
    <summary>Some of the data does not date back to my account creation. Why is that?</summary>
    <p>
      Some data has not been tracked by Niantic since the beginning. As an example, the amount of MU Destroyed by you only started to be tracked
      at around August 2023. As such, the export is not a perfect replica of your activities and might miss some information.
    </p>
  </details>
</div>

<style>
  h1 {
    text-shadow: 0 0 10px black;
    text-align: center;
    margin: 1em auto;
    max-width: 800px;
  }
  div.container {
    max-width: 800px;
    margin: auto;
    padding: 0 1em 3em;
    line-height: 1.4em;
    margin-top: 2em;
  }
  p.back-link {
    text-align: center;
    margin: 0 0 1.5em;
  }
  p.back-link a {
    color: rgba(255, 255, 255, 0.6);
    transition: color 150ms ease-in-out;
  }
  p.back-link a:hover {
    color: #FFF;
  }
  h2 {
    margin-top: 2em;
  }
  code {
    background: rgba(14, 11, 28, 0.9);
    border: 1px solid #5e5a75;
    border-radius: 4px;
    padding: 0.1em 0.4em;
    font-size: 0.9em;
  }
  details.faq-item {
    background: rgba(14, 11, 28, 0.9);
    border: 1px solid #5e5a75;
    border-radius: 8px;
    padding: 0.75em 1em;
    margin: 0.75em 0;
  }
  details.faq-item summary {
    cursor: pointer;
    font-weight: bold;
  }
  details.faq-item summary:hover {
    color: #9593c3;
  }
  details.faq-item p {
    margin: 0.75em 0 0;
    color: rgba(255, 255, 255, 0.85);
  }
  a.mailto-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5em;
    background: rgba(14, 11, 28, 0.9);
    border: 3px double #5e5a75;
    border-radius: 8px;
    color: #FFF;
    font-size: 1.1em;
    padding: 0.6em 1em;
    margin: 1em 0;
    transition: border-color 150ms ease-in-out, background-color 150ms ease-in-out;
  }
  a.mailto-button:hover {
    border-color: #9593c3;
    background: rgba(89, 86, 154, 0.35);
  }
  a.mailto-button img {
    height: 1.3em;
  }
  div.mail-fields {
    margin: 0 0 1.5em;
  }
  div.mail-field {
    background: rgba(14, 11, 28, 0.9);
    border: 1px solid #5e5a75;
    border-radius: 8px;
    padding: 0.6em 0.9em;
    margin: 0.5em 0;
    cursor: pointer;
    transition: border-color 150ms ease-in-out;
  }
  div.mail-field:hover {
    border-color: #9593c3;
  }
  span.mail-field-label {
    display: block;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.8em;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.3em;
  }
  span.mail-field-value {
    display: block;
    font-family: "Kode Mono", monospace;
    color: #FFF;
  }
  span.mail-field-value.body {
    white-space: pre-wrap;
  }
</style>
