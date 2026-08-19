<script>
  import { onMount } from 'svelte'
  import { resolve } from '$app/paths'
  import { pb, serverAddress } from '$lib/pocketbase'
  import AddToCalendarButton from '$lib/components/AddToCalendarButton.svelte'
  import EventBadges from '$lib/components/EventBadges.svelte'
  import Time, { dayjs } from 'svelte-time'
  import utc from 'dayjs/plugin/utc'
  import timezone from 'dayjs/plugin/timezone'

  dayjs.extend(utc)
  dayjs.extend(timezone)

  let eventsList = $state([])
  let showAll = $state(true)
  let page = $state(1)
  let totalPages = $state(1)
  let totalItems = $state(1)
  const itemsPerPage = 5

  const toggleShowAll = () => {
    showAll = !showAll
  }

  const prevPage = () => {
    if (page <= 1) return
    page--
  }

  const nextPage = () => {
    if (page >= totalPages) return
    page++
  }

  const loadData = async () => {
    const userTZ = dayjs.tz.guess() || 'UTC'
    const r = await pb.collection('game_events_list').getFullList({
      expand: 'linked_badge'
    })
    totalPages = Math.ceil(r.length / itemsPerPage)
    totalItems = r.length
    eventsList = r.map((e) => {
      const isLocal = e.time_type === 'local'
      e = {
        ...e,
        badges: e.expand?.linked_badge ?? [],
        start_time: isLocal
          ? dayjs(e.start_time.substring(0, 19)).tz(userTZ)
          : dayjs(e.start_time),
        end_time: isLocal
          ? dayjs(e.end_time.substring(0, 19)).tz(userTZ)
          : dayjs(e.end_time),
      }

      e.is_active = dayjs().isAfter(e.start_time) && dayjs().isBefore(e.end_time)

      const categoryTitles = {
        anomaly: 'Anomaly event',
        shard_skirmish: 'Shard Skirmish',
        beacon_skirmish: 'Beacon Skirmish',
        second_sunday: 'Second Sunday',
        first_saturday: 'First Saturday',
        mission_day: 'Mission Day',
        global_event: 'Global Event',
        global_challenge: 'Global Challenge',
        campaign: 'Dispatch Campaign',
        paid_campaign: 'Premium Dispatch Campaign',
        battle_pass: 'Reward Campaign',
        '2sday': '2x AP Tuesday',
        agent_enl: 'Agent organized Event (Enlightened)',
        agent_res: 'Agent organized Event (Resistance)',
        agent_xfac: 'Agent organized Event (Crossfaction)',
        nl1331: 'NL-1331 Meetup',
        special: 'Special Event',
        tko: 'Tactical Kinetic Operations/GORUCK',
        wayfarer: 'Wayfarer Challenge',
        canceled: 'Canceled Event',
        ifs2x: 'First Saturday 2X AP'
      }

      if (categoryTitles[e.category]) {
        e.categoryTitle = categoryTitles[e.category]
      } else {
        console.log('Unknown Event type:', e.category)
        e.categoryTitle = 'Unknown Event type'
        e.category = 'special'
      }

      return e
    })
  }
  const filteredList = $derived([
    ...eventsList
      .filter(e => e.is_active)
      .sort((a, b) => a.end_time.valueOf() - b.end_time.valueOf()),
    ...eventsList
      .filter(e => !e.is_active && dayjs().isBefore(e.start_time))
      .sort((a, b) => a.start_time.valueOf() - b.start_time.valueOf()),
    ...eventsList
      .filter(e => !e.is_active && dayjs().isAfter(e.start_time))
      .sort((a, b) => b.end_time.valueOf() - a.end_time.valueOf())
  ].filter(e => showAll || !e.homepage_hidden))

  const shownEvents = $derived(filteredList.slice((page - 1) * itemsPerPage, page * itemsPerPage))

  onMount(loadData)
</script>

<svelte:head>
  <title>Ingress Plus &middot; Events</title>
</svelte:head>

{#snippet eventRow(e)}
  <div class="event-container" class:active={e.is_active}>
    <div class="event-row">
      <div class="event-icon">
        <a href={resolve(`/events/${e.id}`)} aria-label="Event details">
          <img class="event-icon-image" src={e.image !== '' ? `${serverAddress}/api/files/ncmy64l5pb3p039/${e.id}/${e.image}` : `images/events/${e.category}.png`} alt={e.title} />
        </a>
      </div>
      <div class="event-description">
        <a href={resolve(`/events/${e.id}`)}><h2 id={`event${e.id}`}>{e.title}</h2></a>
        <div class="event-meta">
          <span>
            <img
              style="height:1em"
              src="images/events/{e.category}.png"
              alt={e.category}
            />
            {e.categoryTitle}
            {#if e.category === 'paid_campaign' && e.cmu_cost} |
              <img
                style="height:1em"
                src="images/cmu.png"
                alt="CMU Cost"
              /> {Intl.NumberFormat().format(e.cmu_cost)} CMU
            {/if}
            {#if e.category === 'battle_pass' && e.cmu_cost} | Upgrade Campaign for
              <img
                style="height:1em"
                src="images/cmu.png"
                alt="CMU Cost"
              /> {Intl.NumberFormat().format(e.cmu_cost)} CMU
            {/if}
          </span>
          {#if e.end_time.isAfter(dayjs())}
            <span>
              <AddToCalendarButton event={e} />
            </span>
          {/if}
        </div>
        <div class="event-time">
          <span>
            {#if e.start_time.isAfter(dayjs())}
              <strong>Starts <Time timestamp={e.start_time} relative live /></strong>
            {:else if e.start_time.isBefore(dayjs()) && e.end_time.isAfter(dayjs())}
              <strong>Ends <Time timestamp={e.end_time} relative live /></strong>
            {:else if e.end_time.isBefore(dayjs())}
              <strong>Ended <Time timestamp={e.end_time} relative live /></strong>
            {/if}
            <small>(
              from <Time timestamp={e.start_time} format="MMMM D, YYYY [at] h:mm A" live />
              to <Time timestamp={e.end_time} format="MMMM D, YYYY [at] h:mm A" live />
            )</small>
            {#if e.repeat_cron !== ''}
              &middot; <strong>Recurring</strong>
            {/if}
          </span>
          <span>
            {e.location}
            <img style="height:1em" src="images/location.svg" alt="Location" />
          </span>
        </div>
        {#if e.badges.length > 0}
          <div class="event-badges-row">
            <EventBadges badges={e.badges} size="2em" />
          </div>
        {/if}
      </div>
    </div>
  </div>
{/snippet}

<div class="container">
  {#each shownEvents as event (event.id)}
    {@render eventRow(event)}
  {/each}
  <div class="paginator">
    <img class:disabled={page <= 1} src="/images/left.svg" onclick={prevPage} alt="Previous Page" />
      Page {page} of {totalPages} (Total Events: {totalItems})
      <img class:disabled={page >= totalPages} src="/images/right.svg" onclick={nextPage} alt="Next Page" />
  </div>

  <div class="options">
    <button onclick={toggleShowAll} title={showAll ? 'Show less' : 'Show more'}>
      <img src="/images/{showAll ? 'checkbox_on' : 'checkbox_off'}.png" alt="Checkbox" />
      Show All Events
    </button>
    <p>
      <small>(including Events that might not be relevant to you like Mission Days)</small>
    </p>
  </div>
</div>

<style>
  @keyframes border-move {
    from {
        background-position: 200% 0;
    }
    to {
        background-position: 0 0;
    }
  }
  div.container {
    max-width: 1000px;
    margin: auto;
    padding: 0 1em;
  }
  div.event-container {
    background: rgba(0, 0, 0, 0.25);
    padding: 1em;
    margin: 1em 0;
    border-radius: 0.5em;
    box-shadow: black 0 0 0.25em;
    transition: all ease-in-out 0.2s;
    position: relative;
    z-index: 1;
  }
  div.event-container:hover {
    background: rgba(0, 0, 0, 0.5);
    box-shadow: black 0 0 1em;
  }
  /* Without its own stacking context, this container's z-index:3 event-row (below)
     would be compared against every other event-row in the list rather than just its
     own siblings, so later events (later in DOM order, same z-index) would always paint
     over an earlier event's open Add to Calendar dropdown. :focus-within raises the
     open one above the rest for as long as the dropdown holds focus. */
  div.event-container:focus-within {
    z-index: 5;
  }
  div.event-row {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    position: relative;
    z-index: 3;
  }
  div.active::before {
    content: "";
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(
      90deg,
      rgba(255, 32, 32, 0.75),
      rgba(0, 176, 86, 0.75),
      rgba(255, 206, 0, 0.75),
      rgba(0, 173, 239, 0.75),
      rgba(255, 32, 32, 0.75)
    );
    background-size: 500%;
    animation: border-move 20s linear infinite;
    border-radius: 0.5em;
    z-index: 1;
  }
  div.active::after {
      content: "";
      position: absolute;
      top: 2px;
      left: 2px;
      right: 2px;
      bottom: 2px;
      background: rgba(0, 0, 0, 0.9);
      z-index: 2;
      border-radius: 0.5em;
  }
  div.event-icon {
    margin-right: 1em;
    width: 8em;
    height: 6em;
    flex-shrink: 0;
  }
  div.event-icon a {
    /* The <a> is inline by default; giving it a definite size (rather than
       leaving it to shrink-wrap an auto-sized img) is what makes the img's
       own 100%/100% below resolve consistently instead of being ambiguous
       against an auto-sized containing block - the actual cause of images
       coming out squished (verified: happened identically in both Chromium
       and Firefox, not a browser quirk) when height and max-width were set
       independently without an explicit box to reconcile them against. */
    display: block;
    width: 100%;
    height: 100%;
  }
  img.event-icon-image {
    display: block;
    width: 100%;
    height: 100%;
    /* Fits the whole image inside the fixed box above without cropping or
       stretching it - any leftover space (for images that aren't 8:6)
       letterboxes instead of distorting the picture. */
    object-fit: contain;
    border-radius: 0.5em;
    box-shadow: black 0 0 0.25em;
  }
  div.event-meta, div.event-time {
    display: flex;
    justify-content: space-between;
    margin-top: .5em;
  }
  div.event-badges-row {
    margin-top: .5em;
  }
  div.event-description {
    flex-grow: 1;
  }
  div.event-description h2 {
    text-align: left;
    margin: 0;
    color: #fff;
  }
  div.options {
    text-align: right;
    margin-top: 1em;
  }
  div.options button {
    color: #fff;
    font-size: larger;
    img {
      margin-right: 0.5em;
      vertical-align: sub;
      height: 1.5em;
      width: 1.5em;
    }
  }

  @media (max-width: 700px) {
    /* event-meta and event-time each hold two independent pieces of info
       (category/add-to-calendar, date-range/location). Side by side with
       justify-content: space-between they get squeezed into two narrow
       columns and wrap heavily - stacking them gives each line the full
       width to breathe. */
    div.event-meta, div.event-time {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.35em;
    }
    div.event-icon {
      width: 6em;
      height: 4.5em;
      margin-right: 0.75em;
    }
    div.event-description h2 {
      font-size: 1.2em;
    }
  }
</style>
