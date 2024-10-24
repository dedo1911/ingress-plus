<script>
    let { children } = $props()
</script>

<section>
    <div class="header">
        <a href="/media">
            <img src='/images/mediagress.png' alt='Mediagress' height="75" style="margin-right: 1em" />
            <h1>Mediagress</h1>
        </a>
        <div>
            <a href="/media/upload">
                Upload new media
                <img src="/images/upload.svg" alt="Upload" height="32" style="margin-left: 1em" />
            </a>
        </div>
    </div>

    {@render children?.()}
</section>

<style>
    div, a {
        display: flex;
        align-items: center;
        justify-content: space-around;
    }
    div.header {
        flex-wrap: wrap;
    }
    h1 {
        font-size: 2em;
        text-align: center;
        text-shadow: 0 0 10px black;
    }
    section {
        max-width: 1200px;
        margin: auto;
        min-height: calc(100vh - 450px);
    }
</style>
