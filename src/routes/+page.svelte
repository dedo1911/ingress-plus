<svelte:head>
    <title>Ingress Plus</title>
</svelte:head>

<div>
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

    <a class="hero" href="/badges">
        <div style={"background-image: url('/images/homepage/cat_badges.png');"} />
    </a>
    <a class="hero" href="/media">
        <div style={"background-image: url('/images/homepage/cat_mediagress.png');"} />
    </a>
    <a class="hero" href="/bugs">
        <div style={"background-image: url('/images/homepage/cat_bug_tracker.png');"} />
    </a>
    <a class="hero" href="/resources">
        <div style={"background-image: url('/images/homepage/cat_resources.png');"} />
    </a>
</div>

<style>
    h1 {
        text-shadow: 0 0 10px black;
    }
    div {
        max-width: 1000px;
        margin: auto;
        padding: 0 1em;
        line-height: 1.2em;
        margin-top: 2em;
    }
    h1 {
        text-align: center;
        margin: 1em auto;
        max-width: 800px;
    }
    p {
        text-align: center;
        margin: 2em auto;
        max-width: 800px;
    }
    a.hero div {
        display: block;
        margin-left: auto;
        margin-right: auto;
        margin: 2em auto;
        width: 90%;
        height: 280px;
        max-width: 700px;
        background: no-repeat center;
        background-size: 100%; 
        border-radius: 16px;
        box-shadow: #9593c3 0px 0px 5px 1px;
        transition: background-size 250ms ease-in-out;
    }
    a.hero div:hover {
        background-size: 105%; 
    }
</style>
