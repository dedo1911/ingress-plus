<script>
    import Time from 'svelte-time/src/Time.svelte.js';
    import zalgo from '$lib/zalgo'
    import { serverAddress } from '$lib/pocketbase'

  export let data;
  $: report = data.report
</script>

<svelte:head>
  <title>Ingress Plus &middot; {report?.title || 'Bug Report'}</title>
</svelte:head>

<h1>{report.title}</h1>

<p class="created">
  Reported <Time timestamp={report.created} relative live />
  on <Time timestamp={report.created} format="MMMM D, YYYY [at] h:mm A" />
  by <span class="agent" style="color: var(--color-faction-{report.faction.toLowerCase() || 'unaligned'})">
    {#if report.faction.toLowerCase() === 'machina'}
        {zalgo(report.username)}
    {:else}
        <a href="/agent/{report.username}">{report.username}</a>
    {/if}
    </span>
</p>

{#if report.ingress_version.length > 0}
<p class="version">
  First confirmed Ingress version <strong>{report.ingress_version}</strong>
</p>
{/if}

<p class="tags">
  {#each report.expand.tags as tag}
    <span class="tag" title={tag.title}>{tag.name}</span>
  {/each}
</p>

<hr />

<p class="description">
  {@html report.description}
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
</style>