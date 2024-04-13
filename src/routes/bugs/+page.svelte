<script>
    import { onMount } from 'svelte'
    import Time from 'svelte-time'
    import { pb } from '$lib/pocketbase'
    import { authData } from '$lib/stores'
    import { formatNumber } from '$lib/utils.js'

    const itemsPerPage = '20'
    const sorting = '-created'
    let items = []
    let myUpvotes = []
    let page = 1
    let totalPages = 1
    let totalItems = 1
    let refetch = 0

    const fetchBugs = async () => {
      const options = {
        sort: sorting,
        expand: 'status',
        fields: 'id,title,expand.status.name,expand.status.description,username,faction,comments,upvotes,created',
        requestKey: null
      }
      const r = await pb.collection('bug_reports_public').getList(page, 1 * itemsPerPage, options)
      totalPages = r.totalPages
      totalItems = r.totalItems
      items = r.items
      refetch++
    }

    const fetchUpvotes = async () => {
      pb.collection('bug_upvotes').getFullList({
        filter: `user="${pb.authStore.model.id}"`,
        fields: 'bug',
        requestKey: null
      }).then(upvotes => { myUpvotes = upvotes.map(u => u.bug) })
    }

    const toggleUpvote = async (e, id) => {
      if (!$authData.isValid) return
      e.preventDefault()
      try {
        if (myUpvotes.includes(id)) {
          const bug = await pb.collection('bug_upvotes').getFirstListItem(`user="${pb.authStore.model.id}" && bug="${id}"`, { requestKey: null })
          await pb.collection('bug_upvotes').delete(bug.id)
        } else {
          await pb.collection('bug_upvotes').create({
            user: pb.authStore.model.id,
            bug: id
          })
        }
      } catch {}
      await fetchUpvotes()
      await fetchBugs()
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

    onMount(fetchBugs)

    $: {
      if ($authData.isValid) fetchUpvotes()
    }
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
    You can use this page to quickly search through bug reports that were submitted by other players, upvote and comment on them as well as create a bug report yourself. Please note that this Bug Tracker is run by the community and not by Niantic. Submitting bug reports does not mean that they are sent to or read by Niantic, <a href="https://niantic.helpshift.com/hc/en/3-ingress/faq/419-how-to-file-a-bug-report/" target="_blank"please make sure to also submit a Bug Report to them directly.</a>
</p>

<p class="help">
    This Bug Tracker is currently in <strong>alpha</strong>! Please send us feedback to our <a href="https://t.me/Ingress_Plus" target="_blank">Telegram channel</a> or <a href="https://github.com/dedo1911/ingress-plus/issues" target="_blank"create an issue on GitHub if you have a Feature Request or notice any problems.</a
</p>

<hr />
<div class="container">
    {#key refetch}
    {#each items as report}
        <a class="bugreport" href="/bugs/{report.id}">
            <span class="date"><Time timestamp={report.created} relative live /></span>
            <span class="title">{report.title}</span>
            <span class="tag" title={report.expand.status.description}>{report.expand.status.name}</span>
            <span class="comments">{formatNumber(report.comments)}</span>
            <span class="upvotes" class:voted={myUpvotes.includes(report.id)}
              title={myUpvotes.includes(report.id) ? 'Remove upvote' : 'Upvote'}
              on:click={e => toggleUpvote(e, report.id)}>
                {formatNumber(report.upvotes)}
            </span>
        </a>
    {/each}
    {/key}

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
        cursor: pointer;
        flex-wrap: wrap;
        justify-content: space-between;
    }
    .container .bugreport:hover {
        background: rgba(0, 0, 0, 0.25);
        border-radius: 5px;
    }
    .bugreport .tag {
        margin: 0 1em;
        background-color: #9593c3;
        color: #000000;
        border-radius: 5px;
        padding: 0.1em 0.25em;
        font-size: small;
    }
    .bugreport .date {
        min-width: 75px;
        margin-right: 1em;
    }
    .bugreport .title {
        flex-grow: 1;
    }
    .bugreport .comments {
        background: url("/images/comment.svg") no-repeat right;
        background-size: contain;
        min-width: 25px;
        padding-right: 1.5em;
        text-align: right;
    }
    .bugreport .upvotes {
        background: url("/images/like_off.svg") no-repeat right;
        background-size: contain;
        min-width: 25px;
        padding-right: 1.5em;
        text-align: right;
        cursor: pointer;
        height: 100%;
    }
    .bugreport .upvotes.voted {
        background: url("/images/like_on.svg") no-repeat right;
        background-size: contain;
    }
    .help {
        text-align: center;
        margin: 2em auto;
        max-width: 800px;
    }
</style>
