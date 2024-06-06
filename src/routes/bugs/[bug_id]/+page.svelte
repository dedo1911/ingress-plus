<script>
  import { onMount } from 'svelte'
  import { slide } from 'svelte/transition'
  import Time from 'svelte-time'
  import { Carta, CartaViewer, MarkdownEditor } from 'carta-md'
  import { toast } from '@zerodevx/svelte-toast'
  import { page } from '$app/stores'
  import { pb, serverAddress } from '$lib/pocketbase'
  import { authData } from '$lib/stores'
  import AgentName from '$lib/components/AgentName.svelte'
  import Comment from '$lib/components/Comment.svelte'

  export let data
  let report = data.report
  let comments
  let newComment = ''

  const carta = new Carta({})

  const reloadData = async (pageData) => {
    report = await pb.collection('bug_reports_public').getFirstListItem(`id="${pageData.params.bug_id}"`, {
      expand: 'status'
    })
    await loadComments()
  }

  const loadComments = async () => {
    comments = await pb.collection('bug_comments').getFullList({
      sort: 'created',
      filter: `bug="${report.id}"`,
      fields: 'id,created,comment,user'
    })
  }

  const postComment = async () => {
    if (newComment.length < 3) {
      toast.push('Comment too short', { classes: ['errorToast'] })
      return
    }
    await pb.collection('bug_comments').create({
      bug: report.id,
      user: pb.authStore.model.id,
      comment: newComment
    })
    newComment = ''
    await loadComments()
  }

  onMount(loadComments)

  $: reloadData($page)
</script>

<svelte:head>
  <title>Ingress Plus &middot; {report?.title || 'Bug Report'}</title>
</svelte:head>

{#key report.id}
<h1>{report.title}</h1>

<p class="created">
  Reported <Time timestamp={report.created} relative live />
  on <Time timestamp={report.created} format="MMMM D, YYYY [at] h:mm A" />
  by <AgentName id={report.agent} />
</p>

{#if report.ingress_version.length > 0}
<p class="version">
  First confirmed Ingress version <strong>{report.ingress_version}</strong>
</p>
{/if}

<p class="tags">
  <span title={report.expand.status.title}>{report.expand.status.name}</span>
</p>

<hr />

<CartaViewer {carta} value={report.description} theme="ingressplus" />

{#if report.created !== report.updated}
<p class="updated">
  Updated <Time timestamp={report.updated} relative live />
  on <Time timestamp={report.updated} format="MMMM D, YYYY [at] h:mm A" />
</p>
{/if}

<hr />

{#if report.attachments.length > 0}
  <h2>Attachments</h2>
  <div class="attachments">
  {#each report.attachments as attachment}
    <a href="{serverAddress}/api/files/{report.collectionId}/{report.id}/{attachment}" alt="{attachment}" target="_blank">
      <img src="{serverAddress}/api/files/{report.collectionId}/{report.id}/{attachment}?thumb=150x0" alt="{attachment}" />
    </a>
  {/each}
  </div>

  <hr />
{/if}

<h2>Comments</h2>

{#if comments}
  {#if comments.length === 0}
    <p transition:slide class="no-comments">Nothing to show yet...</p>
  {:else}
    {#each comments as comment}
    <Comment {comment} />
    {/each}
  {/if}
{/if}

{#if $authData.isValid === true}
  <div transition:slide class="new-comment">
    <MarkdownEditor {carta} theme="ingressplus" bind:value={newComment} placeholder="Comment..." />
    <div class="new-comment-button">
      <button on:click={postComment}>Comment</button>
    </div>
  </div>
{/if}

{/key}

<style>
  h1 {
    font-size: 2em;
    text-align: center;
    text-shadow: 0 0 10px black;
  }
  h2 {
    text-align: center;
    text-shadow: 0 0 10px black;
  }
  .created {
    text-align: center;
  }
  .version {
    text-align: center;
    font-size: small;
  }
  .tags {
    text-align: center;
  }
  .tags span {
    margin: 0 1em;
    background-color: #9593c3;
    color: #000000;
    border-radius: 5px;
    padding: 0.1em 0.25em;
    font-size: small;
  }
  .attachments {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
  }
  .updated {
    text-align: center;
    font-size: small;
  }

  .new-comment {
    max-width: 750px;
    margin: auto;
    display: flex;
    flex-direction: column;
    gap: 1em;
  }
  .new-comment-button {
    display: flex;
    justify-content: flex-end;
  }
  .no-comments {
    text-align: center;
    font-style: italic;
  }
</style>
