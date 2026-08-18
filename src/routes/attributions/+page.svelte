<svelte:head>
    <title>Ingress Plus &middot; Attributions</title>
</svelte:head>

<div class="page">

    <h2><img src="/images/user-search.svg" alt="User search icon" />Attributions</h2>

    <p class="intro">Ingress Plus wouldn't be possible without the following projects, assets and services.</p>

    <div class="grid">

      <div class="card">
        <div class="card-header">
          <img class="card-icon" src="/images/niantic-spatial-icon-white.png" alt="" />
          <h3><a href="https://www.nianticspatial.com/" target="_blank" rel="noopener noreferrer">Niantic Spatial, Inc.</a></h3>
        </div>
        <p>Various images and other resources, such as sprites and textures, from their game
          <a href="https://ingress.com/" target="_blank" rel="noopener noreferrer">Ingress</a>.</p>
      </div>

      <div class="card">
        <div class="card-header">
          <img class="card-icon" src="/images/svgrepo-icon.png" alt="" />
          <h3><a href="https://www.svgrepo.com" target="_blank" rel="noopener noreferrer">SVG Repo</a></h3>
        </div>
        <p>Various vectors and icons used throughout the site, some of them under the
          <a href="https://www.svgrepo.com/page/licensing/#CC%20Attribution" target="_blank" rel="noopener noreferrer">Creative Commons Attribution CC BY licence</a>.</p>
      </div>

      <div class="card">
        <div class="card-header">
          <img class="card-icon" src="/images/google-fonts-icon.svg" alt="" />
          <h3><a href="https://fonts.google.com" target="_blank" rel="noopener noreferrer">Google Fonts</a></h3>
        </div>
        <p>The <a href="https://fonts.google.com/specimen/Exo" target="_blank" rel="noopener noreferrer">Exo</a> and
          <a href="https://fonts.google.com/specimen/Kode+Mono" target="_blank" rel="noopener noreferrer">Kode Mono</a> typefaces used across the site.</p>
      </div>

      <div class="card">
        <div class="card-header">
          <img class="card-icon" src="/images/svelte.svg" alt="" />
          <h3><a href="https://svelte.dev" target="_blank" rel="noopener noreferrer">Svelte</a></h3>
        </div>
        <p>The framework this website's front-end is built with.</p>
      </div>

      <div class="card">
        <div class="card-header">
          <img class="card-icon" src="/images/pocketbase.svg" alt="" />
          <h3><a href="https://pocketbase.io" target="_blank" rel="noopener noreferrer">PocketBase</a></h3>
        </div>
        <p>The backend and database powering this website.</p>
      </div>

      <div class="card">
        <div class="card-header">
          <img class="card-icon" src="/images/github.svg" alt="" />
          <h3><a href="https://github.com/dedo1911/ingress-plus" target="_blank" rel="noopener noreferrer">GitHub</a></h3>
        </div>
        <p>Ingress Plus is open source &mdash; browse the code or contribute on GitHub.</p>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="icon-chip">
            <img class="card-icon" src="/images/green-web-foundation-logo.svg" alt="" />
          </span>
          <h3><a href="https://www.thegreenwebfoundation.org/green-web-check/?url=ingress.plus" target="_blank" rel="noopener noreferrer">The Green Web Foundation</a></h3>
        </div>
        <p>This website runs on green, renewable-energy-powered hosting, verified by The Green Web Foundation.</p>
      </div>

      <div class="card">
        <div class="card-header">
          <img class="card-icon" src="/images/kofi.png" alt="" />
          <h3><a href="https://ko-fi.com/dedo1911" target="_blank" rel="noopener noreferrer">Ko-fi</a></h3>
        </div>
        <p>If you'd like to support the project, consider buying us a Ko-fi.</p>
      </div>

    </div>
</div>

<style>
  div.page {
    max-width: 1000px;
    margin: auto;
    padding: 0 1em;
    line-height: 1.2em;
  }
  h2 {
    text-align: center;
  }
  h2 img {
      height: 1.25em;
      vertical-align: sub;
      margin: 0 0.25em;
  }
  p.intro {
    text-align: center;
    color: rgba(255, 255, 255, 0.75);
    max-width: 700px;
    margin: 0 auto 1.5em;
  }
  div.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    align-items: stretch;
    gap: 1em;
    margin: 0 0 2em;
  }
  div.card {
    display: flex;
    flex-direction: column;
    background: rgba(14, 11, 28, 0.9);
    border: 3px double #5e5a75;
    border-radius: 8px;
    padding: 1.1em 1.25em;
    text-align: left;
    line-height: 1.4em;
    transition: border-color 150ms ease-in-out, box-shadow 150ms ease-in-out;
  }
  div.card:hover {
    border-color: #9593c3;
    box-shadow: #9593c3 0px 0px 5px 1px;
  }
  div.card-header {
    display: flex;
    align-items: center;
    gap: 0.6em;
    margin-bottom: 0.5em;
  }
  img.card-icon {
    height: 2.1em;
    width: auto;
    max-width: 3em;
    object-fit: contain;
    flex-shrink: 0;
  }
  span.icon-chip {
    height: 2.1em;
    width: 2.1em;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #FFFFFF;
    border-radius: 6px;
    padding: 0.3em;
    box-sizing: border-box;
  }
  span.icon-chip img.card-icon {
    height: 100%;
    width: 100%;
    max-width: none;
  }
  div.card h3 {
    margin: 0;
    text-align: left;
  }
  div.card h3 a {
    color: #FFFFFF;
  }
  div.card p {
    margin: 0;
    font-size: 0.9em;
    color: rgba(255, 255, 255, 0.7);
  }
  div.card p a {
    text-decoration: underline;
  }
  div.card p a:hover {
    color: #FFFFFF;
  }
</style>
