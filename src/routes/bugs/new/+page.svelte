<script>
  import { toast } from '@zerodevx/svelte-toast'
  import { Carta, CartaEditor } from 'carta-md'
  import DOMPurify from 'isomorphic-dompurify'
  import { pb } from '$lib/pocketbase'
  import { goto } from '$app/navigation'
  import { authData } from '$lib/stores'

  let title = ''
  let ingressVersion = ''
  let description = ''

  const carta = new Carta({
    sanitizer: DOMPurify.sanitize
  })

  $: if ($authData.isValid !== true) goto('/bugs')

  const publishReport = async () => {
    if (title.length < 3 || title.length > 256) {
      toast.push('Invalid title', { classes: ['errorToast'] })
      return
    }
    if (description.length < 3 || description.length > 1024) {
      toast.push('Invalid description', { classes: ['errorToast'] })
      return
    }
    if (ingressVersion.length > 0 && !/\b\d+\.\d+\.\d+\b/.test(ingressVersion)) {
      toast.push('Invalid Ingress version', { classes: ['errorToast'] })
      return
    }
    const entry = await pb.collection('bug_reports').create({
      reporter: pb.authStore.model.id,
      tags: ['3jxhx1qd595ldd0'],
      title,
      description,
      ingress_version: ingressVersion
    })
    goto(`/bugs/${entry.id}`)
  }
</script>

<h1>New Bug Report</h1>

<div>
  <input type="text" placeholder="Title" bind:value={title} />
  <input type="text" placeholder="Ingress version" bind:value={ingressVersion} />
  <hr />
  <h2>Description</h2>
  <CartaEditor {carta} theme='ingressplus' bind:value={description} placeholder="Type here..." />
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
