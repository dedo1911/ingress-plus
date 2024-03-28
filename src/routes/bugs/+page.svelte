<script>
    import { onMount } from 'svelte';
    import { pb } from '$lib/pocketbase/index.js'
    import { authData } from '$lib/stores'
    import TimeAgo from 'svelte-timeago/TimeAgo.svelte'

    let itemsPerPage = "20"
    let sorting = "-created"
    let items = []
    let page = 1
    let totalPages = 1
    let totalItems = 1

    const fetchBugs = async () => {
        const options = {
            sort: sorting,
            expand: 'tags',
            fields: 'id,title,expand.tags.name,expand.tags.description,username,faction,created'
        }
        const r = await pb.collection('bug_reports_public').getList(page, 1 * itemsPerPage, options)
        totalPages = r.totalPages
        totalItems = r.totalItems
        items = r.items
    }

    const prevPage = () => {
        if (page <= 1) return
        page--
        fetchBugs()
    }

    const nextPage = () => {
        if (page >= totalPages) return
        page++
        fetchBugs()
    }

    onMount(() => {
        fetchBugs()
    })
</script>

<svelte:head>
    <title>Ingress Plus &middot; Bug Tracker</title>
</svelte:head>

<div class="header">
    <h1>Bug Tracker</h1>
    {#if $authData.isValid === true}
    <a href="/bugs/new">
        Submit bug report
        <img src="/images/upload.svg" alt="Submit bug report" height="32" style="margin-left: 1em" />
    </a>
    {/if}
</div>

<p class="help">
    You can use this page to quickly search through bug reports that were submitted by other players as well as create a bug report yourself. Please note that this Bug Tracker is run by the community and not by Niantic. Submitting bug reports does not mean that they are sent to or read by Niantic.
</p>

<p class="help">
    This Bug Tracker is currently in <strong>alpha</strong>! Please send us feedback to our <a href="https://t.me/Ingress_Plus" target="_blank">Telegram channel</a>.
</p>

<hr />
<div class="container">
    {#each items as report}
        <a class="bugreport" href="/bugs/{report.id}">
            <span class="date"><TimeAgo date={report.created} live /></span>
            <span class="title">{report.title}</span>
            <span class="tags">
                {#each report.expand.tags as tag}
                    <span class="tag" title={tag.description}>{tag.name}</span>
                {/each}
            </span>
            <!-- <span class="upvotes">0</span> -->
        </a>
    {/each}

    <div class="paginator">
        <img class:disabled={page <= 1} src="/images/left.svg" on:click={prevPage} alt="Previous Page" />
        Page {page} of {totalPages} (Total Bug Reports: {totalItems})
        <img class:disabled={page >= totalPages} src="/images/right.svg" on:click={nextPage} alt="Next Page" />
    </div>
</div>

<style>
    .header {
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
    }
    .header a {
        display: flex;
        align-items: center;
    }
    h1 {
        font-size: 2em;
        text-align: center;
        text-shadow: 0 0 10px black;
        display: inline-block;
    }
    .container .bugreport {
        padding: 0.5em;
        display: flex;
        justify-content: space-between;
        cursor: pointer;
        flex-wrap: wrap;
    }
    .container .bugreport:hover {
        background: rgba(0, 0, 0, 0.25);
        border-radius: 5px;
    }
    .tag {
        margin: 0 1em;
        background-color: #9593c3;
        color: #000000;
        border-radius: 5px;
        padding: 0.1em 0.25em;
        font-size: small;
    }
    .upvotes {
        background-color: #9593c3;
        border-radius: 5px;
        padding: 0.25em 1em;
        display: inline-block;
        width: 30px;
        text-align: center;
        color: #000000;
        cursor: pointer;
        align-self: flex-end;
    }
    .upvotes.voted {
        background-color: #7871ff;
    }
    .help {
        text-align: center;
        margin: 2em auto;
        max-width: 800px;
    }
</style>
