<script>
  import { toast } from '@zerodevx/svelte-toast'
  import { Carta, MarkdownEditor } from 'carta-md'
  import DOMPurify from 'isomorphic-dompurify'
  import { pb } from '$lib/pocketbase'
  import { goto } from '$app/navigation'
  import { authData } from '$lib/stores'

  let title = ''
  let ingressVersion = ''
  let description = ''
  let ReproductionSteps = ''
  let attachments = ''

    const carta = new Carta({
    sanitizer: DOMPurify.sanitize
  })

  $: if ($authData.isValid !== true) goto('/bugs')

  const publishReport = async () => {

    //Title lengh validation
    if (title.length < 3) {
      toast.push('Title needs to be at least 3 characters long', { classes: ['errorToast'] })
      return
    }
    if (title.length > 256) {
      toast.push('Title needs to be less than 256 characters long', { classes: ['errorToast'] })
      return
    }

    //Ingress version validation
    if (ingressVersion.length > 0 && !/\b\d+\.\d+\.\d+\b/.test(ingressVersion)) {
      toast.push('Ingress version needs to follow the format "2.XXX.X"', { classes: ['errorToast'] })
      return
    }

    //Description length validation
    if (description.length < 10) {
      toast.push('Description needs to be at least 10 characters long', { classes: ['errorToast'] })
      return
    }
    if (description.length > 1024) {
      toast.push('Description needs to be less than 1024 characters long. If more space is needed, continue in the comments.', { classes: ['errorToast'] })
      return
    }

    //TODO: Image validation
    //Image validation (Only allow upload if max. 5 images)
    //if (parseInt(attachments.get(0).files.length) > 5) {
    //toast.push('You can only upload up to 5 images.', { classes: ['errorToast'] })
    //return
    //}

    const entry = await pb.collection('bug_reports').create({
      reporter: pb.authStore.model.id,
      status: '3jxhx1qd595ldd0',
      title,
      description,
      ingress_version: ingressVersion,
      reproduction_steps: ReproductionSteps,
      attachments
    })
    goto(`/bugs/${entry.id}`)
  }
</script>

<h1>New Bug Report</h1>

<div>
  <input type="text" placeholder="Title" bind:value={title} />

  <input type="text" placeholder="Ingress version (2.XXX.X)" bind:value={ingressVersion} />

  <hr />

<h2>Description of the bug</h2>
  <MarkdownEditor {carta} theme="ingressplus" bind:value={description} placeholder="Type here..." />
  <hr />

<h3>Reproduction steps (optional)</h3>
  <MarkdownEditor {carta} theme="ingressplus" bind:value={ReproductionSteps} placeholder="Open Ingress, then..." />
<hr>

<!-- TODO: Sending attachments broken, didn't understand documentation: https://pocketbase.io/docs/files-handling ^^' -->
{#if $authData?.baseModel?.verification != ''}
  <h3>Screenshots (optional)</h3>
    <p>You can add up to 5 screenshots to your Bug Report. Do not abuse this function or you will be banned.</p>
    <input type="file" accept="image/png, image/jpeg" multiple="multiple" onchange="loadFile(event)"><br>
    <div id="output"></div>
{:else}
    <p>If your Verification level is at least "BASIC" you can also upload images.
    Verification is done manually and at the discrecion of the admins only at the moment.</p>
{/if}

    <script>
        const img = (src) => `<img src=${src} width="20%"/>`;

        var loadFile = function (event) {
          var output = document.getElementById('output');
          output.innerHTML = '';

          [...event.target.files].forEach(
            (file) => (output.innerHTML += img(URL.createObjectURL(file)))
          );
        };
    </script>

    <script>
    fileInput.addEventListener('change', function () {
        for (let file of fileInput.files) {
            attachments.append('documents', file);
        }
    });
    </script>


  <div class="actions">
    <button on:click={publishReport}>Submit</button>
  </div>
</div>

<style>
  h1 {
    font-size: 2em;
    text-shadow: 0 0 10px black;
    display: inline-block;
  }
  input[type="text"] {
    width: calc(100% - 1em);
    margin: 0.5em 0;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
  }
  button {
    margin: 1em 0;
  }
</style>
