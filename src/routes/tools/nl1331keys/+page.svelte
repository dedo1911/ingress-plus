<script>
  import { onMount } from 'svelte'
  import PocketBase from 'pocketbase';

  const pb = new PocketBase('https://ingress.plus');

  let portalList = []

  onMount(async () => {
    portalList = await pb.collection("nl1331_keys").getFullList({
      sort: "portal_name",
    })

    console.log(portalList)
  })
</script>

<h2>NL-1331 Key Tracker</h2>
{#each portalList as portal}
  <div class="container"><b>{portal.portal_name}</b><br>{@html portal.appearances}</div>
{/each}

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
