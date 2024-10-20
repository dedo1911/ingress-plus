<svelte:head>
    <title>Ingress Plus</title>
</svelte:head>

<div class="container">
    <h1>Welcome to Ingress Plus!</h1>

    <p>
        Ingress Plus is a fan site for the Niantic game <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.ingress.com">Ingress Prime</a
        >. Users of this site can create a profile with badges they own in the game
        to share, submit Ingress media and raise bug reports for community awareness
        (ensure you raise in app firstly).
        <i>We are not affiliated with Ingress or Niantic.</i>
    </p>

    <a class="hero hero-left" href="/badges">
        <div style={"background-image: url('/images/homepage/cat_badges.jpg');"}>
            <p><img src="/images/medal.svg" alt="Badges" /> Badges</p>
        </div>
    </a>
    <a class="hero hero-right" href="/media">
        <div style={"background-image: url('/images/homepage/cat_mediagress.jpg');"}>
            <p><img src="/images/mediagress.png" alt="Mediagress" /> Mediagress</p>
        </div>
    </a>
    <a class="hero hero-left" href="/bugs">
        <div style={"background-image: url('/images/homepage/cat_bug_tracker.jpg');"}>
            <p><img src="/images/bugs.svg" alt="Bug Tracker" /> Bug Tracker</p>
        </div>
    </a>
    <a class="hero hero-right" href="/resources">
        <div style={"background-image: url('/images/homepage/cat_resources.jpg');"}>
            <p><img src="/images/resources.svg" alt="Resources" /> Resources</p>
        </div>
    </a>
</div>

<style>
    h1 {
        text-shadow: 0 0 10px black;
        text-align: center;
        margin: 1em auto;
        max-width: 800px;
    }
    div.container {
        text-align: center;
        max-width: 1000px;
        margin: auto;
        padding: 0 1em;
        line-height: 1.2em;
        margin-top: 2em;
    }
    .hero div {
        display: flex;
        align-items: center;
        margin: 2em auto;
        max-width: 700px;
        height: 150px;
        background-repeat: no-repeat;
        background-size: 100%;
        border-radius: 16px;
        box-shadow: #9593c3 0px 0px 5px 1px;
        transition: background-size 500ms ease-in-out;
    }
    .hero div:hover {
        background-size: 110%;
    }
    .hero-left div {
        justify-content: flex-start;
        background-position: right;
    }
    .hero-right div {
        justify-content: flex-end;
        background-position: left;
    }
    .hero p {
        font-size: 2em;
        color: white;
        text-shadow: 0 0 10px black;
        padding: 0.5em;
        border-radius: 16px;
        margin: 0;
    }
    img {
        height: 64px;
        vertical-align: middle;
    }
</style>
