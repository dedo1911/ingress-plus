<script>
    import MultiSelect from 'svelte-multiselect'
    import { SvelteURLSearchParams } from 'svelte/reactivity'
    import { goto } from '$app/navigation'
    import { resolve } from '$app/paths'

    const { data } = $props()
    const toOption = x => ({ label: x.name, value: x.id })

    // The controls are local state seeded from the URL (via load); the
    // results themselves come straight from data, so a change of filter is
    // a navigation and load does the fetching - on the server too.
    let itemsPerPage = $state(String(data.perPage))
    let sorting = $state(data.sort)
    let searchFilter = $state(data.search)
    let topicsFilter = $state(data.selectedTopics.map(toOption))
    let destinationsFilter = $state(data.selectedDestinations.map(toOption))

    const navigate = (page) => {
      // SvelteURLSearchParams only to satisfy svelte/prefer-svelte-reactivity;
      // nothing reacts to it.
      const params = new SvelteURLSearchParams()
      if (sorting !== '-released_at') params.set('s', sorting)
      if (searchFilter) params.set('q', searchFilter)
      if (topicsFilter.length > 0) params.set('t', topicsFilter.map(t => t.value).join(','))
      if (destinationsFilter.length > 0) params.set('d', destinationsFilter.map(d => d.value).join(','))
      if (itemsPerPage !== '20') params.set('n', itemsPerPage)
      if (page > 1) params.set('p', page)
      const queryString = params.toString()
      // replaceState: typing in the search box must not leave one history
      // entry per keystroke; keepFocus for the same reason.
      return goto(resolve(`/media${queryString ? `?${queryString}` : ''}`), { replaceState: true, keepFocus: true, noScroll: true })
    }

    const executeSearch = () => navigate(1)
    const prevPage = () => { if (data.page > 1) navigate(data.page - 1) }
    const nextPage = () => { if (data.page < data.totalPages) navigate(data.page + 1) }
</script>

<svelte:head>
    <title>Ingress Plus &middot; Media</title>
</svelte:head>

<div class="container">
    <div class="search">
        <div style="min-width: 270px">
            <input type="text" bind:value={searchFilter} oninput={executeSearch} placeholder="Search..." />
        </div>
        <div style="min-width: 270px">
            <select bind:value={sorting} onchange={executeSearch}>
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
            <MultiSelect bind:selected={topicsFilter} on:change={executeSearch} options={data.topics.map(toOption)} placeholder="Topics" />
        </div>
        <div>
            <MultiSelect bind:selected={destinationsFilter} on:change={executeSearch} options={data.destinations.map(toOption)} placeholder="Destinations" />
        </div>
    </div>
    <div class="media-container">
        {#each data.items as media (media.id)}
            <a class="media" href={resolve(`/media/${media.url_id}`)}>
                <div class="image" style="background-image: url('{media.image_url.replace('http://', 'https://')}"></div>
                <div class={`level level-${media.level}`}>L<span>{media.level}</span></div>
                <p>{media.short_description}</p>
            </a>
        {/each}
    </div>
    {#if data.items.length === 0 }
        <p class="empty">Nothing to show!</p>
    {/if}
    <div class="paginator">
        <img class:disabled={data.page <= 1} src="/images/left.svg" onclick={prevPage} alt="Previous Page" />
        Page {data.page} of {data.totalPages} (Total Media: {data.totalItems})
        <img class:disabled={data.page >= data.totalPages} src="/images/right.svg" onclick={nextPage} alt="Next Page" />
    </div>
    <div class="page-options">
        Media per page:&nbsp;
        <select bind:value={itemsPerPage} onchange={executeSearch}>
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
    div.search input {
        width: calc(100% - 1.25em);
    }
    div.search select {
        width: 100%;
    }
    .level {
        background: rgba(14, 11, 28, 0.9);
        position: relative;
        top: 76px;
        border-radius: 0 0 2px 2px;
        left: 2px;
        transition: all 250ms ease-in-out;
    }
    .level-1 { opacity: 0 }
    a.media:hover .level-1 { opacity: 1 }
</style>
