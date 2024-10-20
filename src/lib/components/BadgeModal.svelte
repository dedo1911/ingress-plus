<script>
  import { slide } from 'svelte/transition'
  import { toast } from '@zerodevx/svelte-toast'
  import { pb, serverAddress } from '$lib/pocketbase'
  import { authData, ownedBadges, badgeSize } from '$lib/stores'
  import Modal from '$lib/components/Modal.svelte'

  export let showModal
  export let badge
  export let tier
  export let owned
  export let title
  let content
  let badgeData

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
  }

  let ownedCounter = 0

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

  $: {
    if (showModal) updateCounter()
  }

  $: if (showModal) {
    content?.scrollTo(0, 0)
    fetchBadge()
  }
</script>

<Modal bind:showModal>
  <header>
    {#if $authData.isValid && !!badgeData}

    {#if badge.unobtainable || (badgeData?.locked_tier > 0 && [tier] >= badgeData?.locked_tier)}
      <span>
          <img
          src="/images/{owned ? 'checkbox_on' : 'checkbox_locked'}.png"
          alt="Checkbox"
          height="32"
          width="32"
          />
      </span>
    {:else}
      <span on:click={toggleOwned} class="toggleOwned" title={owned ? 'Mark not owned' : 'Mark owned'}>
          <img
            src="/images/{owned ? 'checkbox_on' : 'checkbox_off'}.png"
            alt="Checkbox"
            height="32"
            width="32"
          />
      </span>
    {/if}

    {:else}
    <span>&nbsp;</span>

    {/if}
    <img
      height={$badgeSize * 2}
      width={$badgeSize * 2}
      alt={title}
      src="{serverAddress}/api/files/{badge.collectionId}/{badge.id}/{badge.image[tier]}?thumb={$badgeSize * 2}x{$badgeSize * 2}"
    />
    <a
      title="Download"
      href="{serverAddress}/api/files/{badge.collectionId}/{badge.id}/{badge.image[tier]}?download=true"
    >
      <img src="/images/download.svg" alt="Download" height="32" width="32" />
    </a>
  </header>
  <section bind:this={content} style="--badge-size: {$badgeSize}px">
    <h2>{title}</h2>
    {#if badgeData}
      <hr transition:slide />
      <p transition:slide>{badgeData.description}</p>
      {#if badgeData.description_extra}
        <hr />
        <p transition:slide>{@html badgeData.description_extra}</p>
      {/if}
    {/if}

    <button on:click={() => (showModal = false)}>Done</button>
    {#if ownedCounter > 0 }
      <small transition:slide>{ownedCounter} {ownedCounter === 1 ? 'agent has' : 'agents have'} this badge!</small>
    {/if}
  </section>
</Modal>

<style>
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    filter: drop-shadow(0px 5px 10px rgba(0,0,0,0.75));
  }
  header span, header a {
    height: 32px;
    width: 32px;
    margin: calc(32px + 15px) 20px 0;
  }
  header a img, span.toggleOwned {
    cursor: pointer;
  }
  section h2 {
    margin: 0.1em 0;
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
  button {
    cursor: pointer;
    width: 100%;
    max-width: 8em;
    padding: 0.25em 0;
    font-size: larger;
    color: #FFF;
    background: rgb(50,60,110);
    background: linear-gradient(90deg, rgba(50,60,110,1) 0%, rgba(52,39,83,1) 50%, rgba(83,52,118,1) 100%);
    border-color: #9593c3;
    border-radius: 6px;
  }
  small {
    color: #d1d1d1;
    text-align: right;
    width: 100%;
    position: relative;
    right: 0;
    bottom: 0;
    font-size: small;
    float: right;
    padding: 1em 0 0 0;
  }
</style>
