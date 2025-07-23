<script>
  import { slide } from 'svelte/transition'
  import { pb, serverAddress } from '$lib/pocketbase'
  import { authData, ownedBadges, badgeSize } from '$lib/stores'
  import Modal from '$lib/components/Modal.svelte'
  import Time, { dayjs } from 'svelte-time'
  
  let {
    showModal = $bindable(),
    badge,
    tier,
    owned,
    hasWings,
    title
  } = $props()
  let content = $state()
  let badgeData = $state()
  let Requirement = $state()
  let wingsOwned = $state()

  const toggleOwned = async () => {
    if (!$authData.isValid) return
    if (owned) {
      const el = $ownedBadges.find(
        (b) => b.badge === badge.id && b.tier >= tier
      )
      await pb.collection('user_badges').delete(el.id)
      ownedBadges.update((bs) => bs.filter((b) => b.id !== el.id))
    } else {
      const otherTier = $ownedBadges.find((b) => b.badge === badge.id)
      if (otherTier) {
        const el = await pb
          .collection('user_badges')
          .update(otherTier.id, { ...otherTier, tier })
        ownedBadges.update((bs) => [...bs.filter((b) => b.id !== el.id), el])
      } else {
        const el = await pb.collection('user_badges').create({
          user: pb.authStore.model.id,
          badge: badge.id,
          tier
        })
        ownedBadges.update((bs) => [...bs, el])
      }
    }
    await updateCounter()
  }

  const fetchBadge = async () => {
    badgeData = await pb.collection('badges').getFirstListItem(`id="${badge.id}"`)
    const requirementsArray = badgeData.tier_values.split(",").map(Number)
    Requirement = Number(requirementsArray[tier]).toLocaleString()
  }

  let ownedCounter = $state(0)
  let ownedWingsCounter = $state(1)

  const updateCounter = async () => {
    try {
      const owned = await pb.collection('owned_badges')
        .getFullList({
          filter: `badge.id = '${badge.id}' && tier >= ${tier}`,
          sort: '-tier'
        })
      ownedCounter = owned.reduce((acc, o) => acc + o.count, 0)
    } catch {
      ownedCounter = 0
    }
  }

  $effect(() => {
    if (showModal) {
      updateCounter()
      content?.scrollTo(0, 0)
      fetchBadge()
    }
  })

    let description = $state(badge.description)

    // Special handling for Via Lux Explorer event
    if (title == "Via Lux Explorer - Bronze") {
      title = "Via Lux Adventure"
      description = "Adventured to over 300 unique Portals in September 2016."
    }

    if (title == "Via Lux Explorer - Silver") {
      title = "Via Lux Odyssey"
      description = "Above and beyond. Adventured to over 711 unique Portals in September 2016."
    }
</script>

<Modal bind:showModal>
  <header>
    {#if $authData.isValid && !!badgeData}
      {#if badge.unobtainable || (badgeData?.locked_tier > 0 && [tier] >= badgeData?.locked_tier) || (badgeData?.unlocks_at && dayjs(badgeData?.unlocks_at).isAfter(dayjs()))}
        <button disabled>
            <img
            src="/images/{owned ? 'checkbox_on' : 'checkbox_locked'}.png"
            alt="Checkbox"
            height="32"
            width="32"
            />
        </button>
      {:else}
        <button onclick={toggleOwned} title={owned ? 'Mark not owned' : 'Mark owned'}>
            <img
              src="/images/{owned ? 'checkbox_on' : 'checkbox_off'}.png"
              alt="Checkbox"
              height="32"
              width="32"
            />
        </button>
      {/if}
    {:else}
      <span>&nbsp;</span>
    {/if}
    <div class="image-wrapper">
      <img
        height={$badgeSize * 2}
        width={$badgeSize * 2}
        alt={title}
        src="{serverAddress}/api/files/{badge.collectionId}/{badge.id}/{badge.image[tier]}?thumb={$badgeSize * 2}x{$badgeSize * 2}"
        class="badge-image"
      />
      {#if wingsOwned}
      <img
        height=auto
        width={($badgeSize + ($badgeSize * (57/100))) * 2}
        alt="Recursed badge"
        src="images/badges/recursed_badge.png"
        class="recursed-badge-image"
      />
      {/if}
    </div>
    <a title="Download" href="{serverAddress}/api/files/{badge.collectionId}/{badge.id}/{badge.image[tier]}?download=true">
      <img src="/images/download.svg" alt="Download" height="32" width="32" />
    </a>
  </header>
  <section bind:this={content} style="--badge-size: {$badgeSize}px">
    <h2>
      {#if badgeData?.core_only}
        <img src="/images/core.png" alt="C.O.R.E" class="core-flare" />
      {/if}
      {title}
    </h2>
    {#if badgeData}
      <hr transition:slide />
      <p transition:slide>{description}</p>
      {#if badgeData.requirement}
          <hr />
          <p transition:slide >
            <b>Requirements:</b><br />
            {badgeData.requirement.replace('{0}', Requirement)}
          </p>
          {/if}
      {#if badgeData.description_extra}
        <hr />
        <p transition:slide>{@html badgeData.description_extra}</p>
      {/if}
    {/if}

    <button class="cta" onclick={() => (showModal = false)}>Done</button>
    <div class="footer">
      {#if ownedCounter > 0 }
        <small transition:slide>{ownedCounter} {ownedCounter === 1 ? 'agent has' : 'agents have'} this badge!</small>
        {#if hasWings && tier == 4 && ownedWingsCounter > 0 }
          <small transition:slide><img
                style="height:1em"
                src="images/badges/recursed_flair.png"
                alt="Recursion flair"
              /> {ownedWingsCounter} of those agents {ownedWingsCounter === 1 ? 'has' : 'have'} earned wings for it!</small>
        {/if}
      {/if}
      {#if (badgeData?.unlocks_at && dayjs(badgeData?.unlocks_at).isAfter(dayjs()))}
        <small transition:slide>Unlocks <Time timestamp={badgeData?.unlocks_at} relative live /></small>
      {/if}
    </div>
  </section>
</Modal>

<style>
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    filter: drop-shadow(0px 5px 10px rgba(0,0,0,0.75));
    position: sticky;
    z-index: 9999;
  }
  header button, header span, header a {
    flex: 1;
    margin: 4.5em 0 0 1em;
    text-align: left;
}
  header a {
    text-align: right;
    margin: 3.75em 0.75em 0 0;
  }
  section h2 {
    margin: 0.5em 0 0 0;
  }
  section {
    background: rgba(14, 11, 28, 0.9);
    margin-top: calc(var(--badge-size) * -1);
    padding: var(--badge-size) 2em 1em 2em;
    color: #9593c3;
    border: 3px double #5e5a75;
    border-radius: 8px;
    text-align: center;
    font-size: larger;
    white-space: pre-wrap;
    word-break: break-word;
    overflow: auto;
    max-height: 50vh;
  }
  div.footer {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin-top: 1em;
  }
  small {
    display: block;
    color: #d1d1d1;
    text-align: right;
    width: 100%;
    position: relative;
    right: 0;
    bottom: 0;
    font-size: small;
  }
  .image-wrapper {
    position: relative;
    display: inline-block;
  }
  .badge-image {
    position: relative;
    z-index: 2;
    display: block;
  }
  .recursed-badge-image {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
    pointer-events: none;
  }
</style>
