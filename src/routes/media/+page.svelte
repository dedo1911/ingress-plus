<script>
    import { pb } from '$lib/pocketbase/index.js'
    import {onMount} from "svelte";
    import MultiSelect from "svelte-multiselect";

    let itemsPerPage = "20"
    let sorting = "-released_at"
    let items = []
    let page = 1
    let totalPages = 1
    let totalItems = 1
    let searchFilter = ""
    let topicsFilter = []
    let topics = []
    let destinationsFilter = []
    let destinations = []

    const fetchMedias = async () => {
        const options = {
            sort: sorting,
        }
        let filter = []
        if (searchFilter.length > 0) {
            filter.push(`(short_description ~ '${searchFilter}' || description ~ '${searchFilter}')`)
        }
        if (topicsFilter.length > 0) {
            filter.push(`(${topicsFilter.map(t => `topic ~ '${t.value}'`).join(' || ')})`)
        }
        if (destinationsFilter.length > 0) {
            filter.push(`(${destinationsFilter.map(t => `destination ~ '${t.value}'`).join(' || ')})`)
        }
        if (filter.length > 0) {
            options.filter = filter.join(' && ')
        }
        const r = await pb.collection('medias').getList(page, 1 * itemsPerPage, options)
        totalPages = r.totalPages
        totalItems = r.totalItems
        items = r.items
    }

    const prevPage = () => {
        if (page <= 1) return
        page--
        fetchMedias()
    }

    const nextPage = () => {
        if (page >= totalPages) return
        page++
        fetchMedias()
    }

    const executeSearch = async () => {
        page = 1
        await fetchMedias()
    }

    onMount(async () => {
        return Promise.all([
            fetchMedias(),
            (async () => {
                topics = await pb.collection("media_categories").getFullList({
                    sort: 'name'
                })
            })(),
            (async () => {
                destinations = await pb.collection("media_destinations").getFullList({
                    sort: 'name'
                })
            })(),
        ])
    })
</script>

<svelte:head>
    <title>Ingress Plus &middot; Media</title>
</svelte:head>

<div class="container">
    <div class="search">
        <div>
            <input type="text" bind:value={searchFilter} on:change={executeSearch} placeholder="Search..." />
        </div>
        <div>
            <select bind:value={sorting} on:change={executeSearch}>
                <option value="-released_at">Release (Newest first)</option>
                <option value="released_at">Release (Oldest first)</option>
                <option value="-created">Upload (Newest first)</option>
                <option value="created">Upload (Oldest first)</option>
                <option value="short_description">Name</option>
                <option value="-short_description">Name (Reversed)</option>
                <option value="-level">Level (Highest first)</option>
            </select>
        </div>
        <div>
            <MultiSelect bind:selected={topicsFilter} on:change={executeSearch} options={topics.map(t => ({ label: t.name, value: t.id }))} placeholder="Topics" />
        </div>
        <div>
            <MultiSelect bind:selected={destinationsFilter} on:change={executeSearch} options={destinations.map(t => ({ label: t.name, value: t.id }))} placeholder="Destinations" />
        </div>
    </div>
    <div class="media-container">
        {#each items as media}
            <a class="media" href={`/media/${media.url_id}`}>
                <div class="image" style="background-image: url('{media.image_url.replace('http://', 'https://')}" />
                <div class={`level level-${media.level}`}>L<span>{media.level}</span></div>
                <p>{media.short_description}</p>
            </a>
        {/each}
    </div>
    {#if items.length == 0 }
        <p class="empty">Nothing to show!</p>
    {/if}
    <div class="paginator">
        <img class:disabled={page <= 1} src="/images/left.svg" on:click={prevPage} alt="Previous Page" />
        Page {page} of {totalPages} (Total Medias: {totalItems})
        <img class:disabled={page >= totalPages} src="/images/right.svg" on:click={nextPage} alt="Next Page" />
    </div>
    <div class="page-options">
        Media per page:&nbsp;
        <select bind:value={itemsPerPage} on:change={fetchMedias}>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
        </select>
    </div>
</div>

<style>
    div.container {
        max-width: 1000px;
        margin: auto;
        padding: 0 1em;
    }
    div.search, div.page-options {
        margin: 2em 0;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
    }
    div.search {
        align-items: flex-start;
    }
    div.search div {
        flex: calc(50% - .5em);
        flex-grow: 1;
        margin: .25em;
    }
    p.empty {
        text-align: center;
        font-size: 1.25em;
        color: var(--color-faction-machina);
    }
    div.media-container {
        text-align: center;
    }
    a.media {
        height: 95px;
        width: 128px;
        display: inline-block;
        margin: 1.75em 1em;
        cursor: pointer;
    }
    a.media div.image {
        height: 95px;
        width: 128px;
        position: absolute;
        background-color: #000;
        background-size: 100%;
        background-position: center;
        background-repeat: no-repeat;
        transition: all 250ms ease-in-out;
        border-radius: 4px;
        border: 2px solid #5e5a75;
    }
    a.media p {
        opacity: 0.75;
        text-align: center;
        transition: all 250ms ease-in-out;
        top: 65px;
        position: relative;
    }
    a.media:hover div.image {
        background-size: 110%;
    }
    a.media:hover p {
        opacity: 1;
        color: #FFF;
    }
    div.paginator {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 2em;
    }
    div.paginator img {
        height: 48px;
        width: 48px;
        opacity: 1;
        cursor: pointer;
        transition: all 250ms ease-in-out;
    }
    div.paginator img.disabled {
        opacity: 0.1;
        cursor: not-allowed;
    }
    div.search input {
        width: calc(100% - 1.25em);
    }
    div.search select {
        width: 100%;
    }
    .level {
        background: rgba(14, 11, 28, 0.9);
        position: relative;
        top: 75px;
        left: 2px;
        transition: all 250ms ease-in-out;
    }
    .level-1 { opacity: 0 }
    a.media:hover .level-1 { opacity: 1 }
</style>
