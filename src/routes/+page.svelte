<script async>
  import { fly } from 'svelte/transition'
  import { categories, badgeSize, siteSettings, authData } from '$lib/stores'
  import Category from '$lib/components/Category.svelte'
  import { onMount } from 'svelte'

  let width = 1024
  $: badgeSize.set(Math.min(128, width / 7))

  $: badgeCategories = $categories.map(c => ({
    ...c,
    badges: c.badges.filter(b => $siteSettings.showUnobtainable ? true : !b.unobtainable)
  }))

  const toggleSiteSettings = (name) => {
    return () => {
      const newValue = !$siteSettings[name]
      window.localStorage.setItem(`siteSettings:${name}`, newValue)
      siteSettings.set({
        ...$siteSettings,
        [name]: newValue
      })
    }
  }

  onMount(() => {
    width = document.getElementsByTagName('section')[0].clientWidth
    if (window.location.hash) document.querySelector(window.location.hash).scrollIntoView({ behavior: 'smooth' })
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault()
        document.querySelector(this.getAttribute('href')).scrollIntoView({
          behavior: 'smooth'
        });
        window.history.pushState({}, '', this.getAttribute('href'));
      });
    });
  })
</script>

<svelte:head>
    <title>Ingress Plus</title>
</svelte:head>

<h1>Welcome to Ingress Plus!</h1>
<p>Ingress Plus is a fan site for the Niantic game <a target="_blank" rel="noopener noreferrer" href="https://www.ingress.com">Ingress Prime</a>.
    Users of this site can create a profile with badges they own in the game to share, submit Ingress media
    and raise bug reports for community awareness (ensure you raise in app firstly). <i>We are not affiliated with Ingress or Niantic.</i></p>
<a href="/badges"><img src="/images/homepage/cat_badges.png"></a>
<a href="/media"><img src="/images/homepage/cat_mediagress.png"></a>
<a href="/bugs"><img src="/images/homepage/cat_bug_tracker.png"></a>
<a href="/resources"><img src="/images/homepage/cat_resources.png"></a>

<style>
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
    img {
        display: block;
        margin-left: auto;
        margin-right: auto;
        margin: 2em auto;
        width: 90%;
        max-width: 700px;
    }

</style>
