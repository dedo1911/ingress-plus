<script>
  import Time from 'svelte-time/src/Time.svelte.js'
  import { pb, serverAddress } from '$lib/pocketbase'
  import { page } from '$app/stores'
  import { slide } from 'svelte/transition'
  import { authData } from '$lib/stores'
  import { toast } from '@zerodevx/svelte-toast'
  import { Carta, CartaViewer, CartaEditor } from 'carta-md'
  import {onMount} from "svelte"
  import TimeAgo from 'svelte-timeago/TimeAgo.svelte'

	import '$lib/styles/editor.scss'
  import AgentName from "../../../components/AgentName.svelte";

  $: reloadData($page)

  export let data;
  let report = data.report
  let comments
  let new_comment = ''

  const carta = new Carta({})

  const reloadData = async (pageData) => {
    report = await pb.collection('bug_reports_public').getFirstListItem(`id="${pageData.params.bug_id}"`, {
      expand: 'tags',
    })
    loadComments()
  }

  const loadComments = async () => {
    comments = await pb.collection('bug_comments').getFullList({
      sort: 'created',
      filter: `bug="${report.id}"`,
      fields: 'id,created,comment,user'
    })
  }

  const postComment = async () => {
    if (new_comment.length < 3 || new_comment.length > 1024) {
      toast.push('Invalid comment', { classes: [ 'errorToast' ]})
      return
    }
    await pb.collection("bug_comments").create({
      bug: report.id,
      user: pb.authStore.model.id,
      comment: new_comment,
    })
    loadComments()
  }

  onMount(loadComments)
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
  {#key report.id}
  {#each report.expand.tags as tag}
    <span class="tag" title={tag.title}>{tag.name}</span>
  {/each}
  {/key}
</p>

<hr />

<p class="description">
  <CartaViewer {carta} value={report.description} />
</p>

{#if report.created != report.updated}
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
    <div transition:slide class="comment">
      <div class="info">
        <span><AgentName id={comment.user} /></span>
        <span><TimeAgo date={comment.created} live /></span>
      </div>
      <CartaViewer {carta} value={comment.comment} />
    </div>
    {/each}
  {/if}
{/if}

{#if $authData.isValid === true}
  <div transition:slide class="new-comment">
    <CartaEditor {carta} theme="ingressplus" bind:value={new_comment} placeholder="Comment..." />
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
  .description {
    line-height: 2em;
  }
  .tags {
    text-align: center;
  }
  .tag {
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
  .comment {
    display: flex;
    flex-wrap: wrap;
    background: #131627;
    padding: 1em;
    margin: auto auto 1em;
    max-width: calc(750px - 2em);
    border: 1px solid #2b3138;
    border-radius: 0.5em;
  }
  .comment .info {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    gap: 1em;
    margin-right: 2em;
    margin-top: 1em;
  }

  :global(.comment .carta-viewer) {
    flex-grow: 1;
  }
</style>