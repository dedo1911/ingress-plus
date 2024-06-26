<script>
import AgentName from '$lib/components/AgentName.svelte'
</script>

<svelte:head>
    <title>Ingress Plus &middot; About</title>
</svelte:head>

<h2>About</h2>
<p>Welcome to Ingress Plus!</p>
<br>
<p>This site is the evolution of <a href="https://web.archive.org/web/20230730162640/dedo1911.xyz/Badges/">Agent dedo1911's badge site</a> and was
    initially only planned to be a visual upgrade with a better database. Over time it has evolved to include various other things such as incorporating
    Mediagress and a community run Bug Report tool for Ingress into its website with no plans of slowing down. As Ingress Plus is open source everyone
    can contribute and add features to the site.</p>
<hr>
<h3>Admins</h3>
<p><AgentName id=z90z06hc0vo9oyx linkable={true} factionLogo={true} /> - <img src="/images/telegram.svg" alt="Telegram icon" />@dedo1911</p>
<p><AgentName id=l5jm7d8rp4o9wp3 linkable={true} factionLogo={true} /> - <img src="/images/telegram.svg" alt="Telegram icon" />@InvestigateXM</p>


<style>
p {
    text-align: center;
    margin: auto;
    max-width: 800px;
    }

    img {
        height: 1em;
        vertical-align: sub;
        margin: 0 0.25em;
    }
</style>
