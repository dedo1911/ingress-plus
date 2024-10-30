<script>
  let { rows, perPage, trimmedRows = $bindable() } = $props()

  const totalRows = $derived(rows.length)
  let currentPage = $state(0)
  const totalPages = $derived(Math.ceil(totalRows / perPage))
  const start = $derived(currentPage * perPage)
  const end = $derived(currentPage === totalPages - 1 ? totalRows - 1 : start + perPage - 1)

  $effect(() => {
    trimmedRows = rows.slice(start, end + 1)
  })
</script>

    {#if totalRows && totalRows > perPage}
        <div class='pagination'>
            <button onclick={() => currentPage -= 1} 
                disabled={currentPage === 0 ? true : false} 
                aria-label="left arrow icon" 
                aria-describedby="prev">
                    <img src="/images/left.svg" alt="Previous" />
            </button>
            <span id='prev' class='sr-only'>Load previous {perPage} rows</span>
            <p>Showing {start + 1} to {end + 1} of {totalRows}</p>
            <button onclick={() => currentPage += 1} 
                disabled={currentPage === totalPages - 1 ? true : false} 
                aria-label="right arrow icon" 
                aria-describedby="next">
                <img src="/images/right.svg" alt="Next" />
            </button>
            <span id='next' class='sr-only'>Load next {perPage} rows</span>
        </div>
    {/if}


<style>
  .sr-only {
    position: absolute;
    clip: rect(1px, 1px, 1px, 1px);
    padding: 0;
    border: 0;
    height: 1px;
    width: 1px;
    overflow: hidden;
  }
  
  .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: all;
  }

  .pagination p {
      margin: 0 1rem;
      text-align: center;
      flex-grow: 1;
  }

  img {
    width: 48px;
    height: 48px;
  }
	
	button {
		display: flex;
	}
	
</style>