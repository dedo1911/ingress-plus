<script>
  import { client, serverAddress } from '$lib/pocketbase'
  import { authData, ownedBadges, categories, badgeSize } from '$lib/stores'
  import Modal from './Modal.svelte'

  export let categoryIndex
  export let index

  const thumbSize = (badgeSize) => {
    if (badgeSize <= 64) return '96x96'
    if (badgeSize <= 128) return '128x128'
    return '256x256'
  }

  let badge = {}
  let category = {}
  let hasTiers = false
  let tiers = []
  let tier = 0
  let title = ''
  let showModal = false
  
  $: index
  $: category = $categories[categoryIndex]
  $: hasTiers = tiers.length > 0
  $: tiers = category.tiers.split(',').filter(t => t)
  $: badge = hasTiers
    ? category.badges[Math.floor(index/tiers.length)]
    : category.badges[index]
  $: tier = hasTiers
    ? index % tiers.length
    : 0
  $: title = hasTiers
    ? `${badge?.title} - ${tiers[tier]}`
    : badge?.title
  
  const onBadgeClick = () => (showModal = true)
  const onBadgeKeydown = (e) => {
    if (e.key === 'Escape') showModal = false
  }

  $: owned = badge
    ? $ownedBadges.some(b => b.badge === badge.id && b.tier >= tier)
    : false
  
  const toggleOwned = async () => {
    if (!$authData.isValid) return
    if (owned) {
      const el = $ownedBadges.find(b => b.badge === badge.id && b.tier >= tier)
      client.collection('user_badges').delete(el.id)
      ownedBadges.update(bs => bs.filter(b => b.id !== el.id))
    } else {
      const otherTier = $ownedBadges.find(b => b.badge === badge.id)
      if (otherTier) {
        const el = await client.collection('user_badges').update(otherTier.id, { ...otherTier, tier })
        ownedBadges.update(bs => [ ...bs.filter(b => b.id !== el.id), el ])
      } else {
        const el = await client.collection('user_badges').create({
          user: client.authStore.model.id,
          badge: badge.id,
          tier: tier
        })
        ownedBadges.update(bs => [ ...bs, el ])
      }
    }
  }
</script>

{#if badge }
  <span on:click={onBadgeClick} on:keydown={onBadgeKeydown} role='button' tabindex='0'>
    <img height="{$badgeSize}" width="{$badgeSize}" alt="{title}" data-owned={owned}
    src="{serverAddress}/api/files/{badge.collectionId}/{badge.id}/{badge.image[tier]}?thumb={thumbSize($badgeSize)}" />
  </span>
  <Modal bind:showModal>
    <a slot="owned" on:click={toggleOwned} title="{owned ? 'Mark not owned' : 'Mark owned'}">
      {#if $authData.isValid}
        <img src="/{owned ? 'checkbox_on' : 'checkbox_off'}.png" alt="Download" height="32" width="32" />
      {/if}
    </a>
    <img slot="image" height={$badgeSize*2} width={$badgeSize*2} alt="{title}"
    src="{serverAddress}/api/files/{badge.collectionId}/{badge.id}/{badge.image[tier]}?thumb={$badgeSize*2}x{$badgeSize*2}" />
    <a title="Download" slot="download" href="{serverAddress}/api/files/{badge.collectionId}/{badge.id}/{badge.image[tier]}?download=true">
      <img src="/download.svg" alt="Download" height="32" width="32" />
    </a>
    <h2 slot="title">{title}</h2>
    <p>{badge.description}</p>
    {#if badge.description_extra}
      <hr />
      <p>{@html badge.description_extra}</p>
    {/if}
  </Modal>
{/if}

<style>
  img {
    display: inline-block;
    cursor: pointer;
  }
  :global(img[data-owned="true"]) {
    opacity: 0.1;
    transition: opacity 0.3s ease-in-out;
  }
  :global(img[data-owned="true"]:hover) {
    opacity: 1;
  }
</style>
