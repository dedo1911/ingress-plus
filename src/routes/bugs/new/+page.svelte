<script>
  import { toast } from "@zerodevx/svelte-toast"
  import { Carta, MarkdownEditor } from "carta-md"
  import DOMPurify from "isomorphic-dompurify"
  import { pb } from "$lib/pocketbase"
  import { goto } from "$app/navigation"
  import { browser } from '$app/environment'
  import { authData } from "$lib/stores"

  let title = $state("")
  let ingressVersion = $state("")
  let description = $state("")
  let ReproductionSteps = $state("")
  let attachments = $state()

  const carta = new Carta({
    sanitizer: DOMPurify.sanitize,
  })

  $effect(() => {
    if (browser && $authData.isValid !== true) goto("/bugs")
  })

  const publishReport = async () => {
    //Title lengh validation
    if (title.length < 3) {
      toast.push("Title needs to be at least 3 characters long", {
        classes: ["errorToast"],
      })
      return
    }
    if (title.length > 256) {
      toast.push("Title needs to be less than 256 characters long", {
        classes: ["errorToast"],
      })
      return
    }

    //Ingress version validation
    if (
      ingressVersion.length > 0 &&
      !/\b\d+\.\d+\.\d+\b/.test(ingressVersion)
    ) {
      toast.push('Ingress version needs to follow the format "2.XXX.X"', {
        classes: ["errorToast"],
      })
      return
    }

    //Description length validation
    if (description.length < 10) {
      toast.push("Description needs to be at least 10 characters long", {
        classes: ["errorToast"],
      })
      return
    }
    if (description.length > 1024) {
      toast.push(
        "Description needs to be less than 1024 characters long. If more space is needed, continue in the comments.",
        { classes: ["errorToast"] },
      )
      return
    }

    if (Array.from(attachments || []).length > 5) {
      toast.push('You can only upload up to 5 images.', { classes: ['errorToast'] })
      return
    }

    const formData = new FormData()
    formData.append('reporter', pb.authStore.model.id)
    formData.append('status', '3jxhx1qd595ldd0')
    formData.append('title', title)
    formData.append('description', description)
    formData.append('ingress_version', ingressVersion)
    formData.append('reproduction_steps', ReproductionSteps)
    for (const file of attachments || []) formData.append('attachments', file)
    const entry = await pb.collection("bug_reports").create(formData)
    goto(`/bugs/${entry.id}`)
  }

  const removeAttachment = (index) => {
    const newAttachments = Array.from(attachments)
    newAttachments.splice(index, 1)
    attachments = newAttachments
  }
</script>

<h1>New Bug Report</h1>

<div>
  <input type="text" name="title" placeholder="Title" bind:value={title} />

  <input
    type="text"
    name="ingressVersion"
    placeholder="Ingress version (2.XXX.X)"
    bind:value={ingressVersion}
  />

  <hr />

  <h2>Description of the bug</h2>
  <MarkdownEditor
    {carta}
    name="description"
    theme="ingressplus"
    bind:value={description}
    placeholder="Type here..."
  />
  <hr />

  <h3>Reproduction steps (optional)</h3>
  <MarkdownEditor
    {carta}
    name="reproductionSteps"
    theme="ingressplus"
    bind:value={ReproductionSteps}
    placeholder="Open Ingress, then..."
  />
  <hr />

  <!-- TODO: Sending attachments broken, didn't understand documentation: https://pocketbase.io/docs/files-handling ^^' -->
  {#if $authData?.baseModel?.verification != ""}
    <h3>Screenshots (optional)</h3>
    <p align="center">
      You can add up to 5 screenshots to your Bug Report.<br />Do not abuse this
      function or you will be banned.
    </p>
    <p align="center">
      <label class='file-upload' for="attachments">
        Add attachments
      </label>
      <input
        bind:files={attachments}
        id="attachments"
        type="file"
        name="attachments"
        accept="image/png, image/jpeg"
        multiple="multiple"
      />
    </p>
    <div id="filesPreview">
      {#if attachments}
        {#each Array.from(attachments) as file, index}
          <div class="previewRow">
            <div
              class="preview"
              style={`background-image: url(${URL.createObjectURL(file)})`}
            ></div>
            <span class="fileName">{file.name}</span>
            <span class="remove" onclick={() => removeAttachment(index)}></span>
          </div>
        {/each}
      {/if}
    </div>
  {:else}
    <p>
      If your Verification level is at least "BASIC" you can also upload images.
      Verification is done manually and at the discrecion of the admins only at
      the moment.
    </p>
  {/if}
  <div class="actions">
    <button onclick={publishReport}>Submit</button>
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
  .previewRow {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    margin-top: 1em;
    justify-content: space-between;
    row-gap: 1em;
  }
  .previewRow span.fileName {
    max-width: calc(100vw - 7em - 32px - 96px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .previewRow span.remove {
    background-image: url('/images/close.png');
    background-size: contain;
    background-repeat: no-repeat;
    width: 32px;
    height: 32px;
    cursor: pointer;
    margin: 0 2em;
  }
  .preview {
    height: 96px;
    width: 96px;
    margin-right: 1em;
    background-position: center;
    background-repeat: no-repeat;
    background-size: contain;
  }
</style>
