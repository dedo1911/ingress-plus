<script>
  import { onMount } from 'svelte'
  import { slide } from 'svelte/transition'
  import { pb } from '$lib/pocketbase'
  import sortBy from 'lodash.sortby'
  import Time, { dayjs } from 'svelte-time'
  import utc from 'dayjs/plugin/utc'
  import timezone from 'dayjs/plugin/timezone'
  import * as cronjsMatcher from '@datasert/cronjs-matcher'
  import Pagination from '../../lib/components/Pagination.svelte';

  dayjs.extend(utc)
  dayjs.extend(timezone)

  let activeEvents = $state([])
  let futureEvents = $state([])
  let pastEvents = $state([])
  let showAll = $state(true)

  const toggleShowAll = () => {
    showAll = !showAll
    loadData()
  }

  let activeEventsPage = $state([])
  let futureEventsPage = $state([])
  let pastEventsPage = $state([])

  let activeSection = $state('active')

  const setActiveSection = (section) =>
    activeSection = section === activeSection
      ? ''
      : section

  const loadData = async () => {
    const userTZ = dayjs.tz.guess() || 'UTC'
    const events = (await pb.collection('game_events').getFullList({
      sort: 'start_time',
      order: 'desc',
      filter: showAll ? '' : 'homepage_hidden=false'
    }))
      .map(e => {
        const isLocal = e.time_type === 'local'
        e = {
          ...e,
          start_time: isLocal
            ? dayjs(e.start_time.substring(0, 19)).tz(userTZ)
            : dayjs(e.start_time),
          end_time: isLocal
            ? dayjs(e.end_time.substring(0, 19)).tz(userTZ)
            : dayjs(e.end_time),
          repeat_cron: e.repeat_cron
            ? dayjs(cronjsMatcher.getFutureMatches(e.repeat_cron, {
              timezone: isLocal ? userTZ : 'UTC',
              formatInTimezone: true,
              matchCount: 1,
            })[0])
            : null
        }
        if (e.repeat_cron) {
          e.start_time = e.start_time.year(e.repeat_cron.year()).month(e.repeat_cron.month()).date(e.repeat_cron.date())
          e.end_time = e.end_time.year(e.repeat_cron.year()).month(e.repeat_cron.month()).date(e.repeat_cron.date())
        }
        return e
      })

    activeEvents = events.filter(e => e.start_time.isBefore(dayjs()) && e.end_time.isAfter(dayjs()))
    futureEvents = sortBy(events.filter(e => e.start_time.isAfter(dayjs())), 'start_time')
    pastEvents = sortBy(events.filter(e => e.end_time.isBefore(dayjs())), 'start_time')

    if (activeEvents.length === 0) activeSection = 'future'
  }

  onMount(loadData)
</script>

<svelte:head>
    <title>Ingress Plus &middot; Events</title>
</svelte:head>

{#snippet eventRow(e)}
  <div class="event-row">
    <div class="event-icon">
      <img src="images/events/{e.category}.png" alt={e.category} />
    </div>
    <div class="event-description">
      <a href="/events/{e.id}"><h2>{e.title}</h2></a>
      <p>
        <strong><Time timestamp={e.start_time} relative live /></strong>
        <small>(
          from <Time timestamp={e.start_time} format="MMMM D, YYYY [at] h:mm A" live />
          to <Time timestamp={e.end_time} format="MMMM D, YYYY [at] h:mm A" live />
        )</small>
      </p>
    </div>
  </div>
{/snippet}

<div class="container">
    {#if activeEvents.length > 0}
      <h1 onclick={() => setActiveSection('active')}>Active Events</h1>
      <div transition:slide>
      {#each activeEventsPage as event}
        {@render eventRow(event)}
      {/each}
      <Pagination rows={activeEvents} perPage={5} bind:trimmedRows={activeEventsPage} />
      </div>
      <hr />
    {/if}

  <h1 onclick={() => setActiveSection('future')}>Future Events</h1>
  {#if activeSection === 'future'}
  <div transition:slide>
    {#each futureEventsPage as event}
      {@render eventRow(event)}
    {/each}
    <Pagination rows={futureEvents} perPage={5} bind:trimmedRows={futureEventsPage} />
  </div>
  {/if}

  <hr />

  <h1 onclick={() => setActiveSection('past')}>Past Events</h1>
  {#if activeSection === 'past'}
  <div transition:slide>
    {#each pastEventsPage as event}
      {@render eventRow(event)}
    {/each}
    <Pagination rows={pastEvents} perPage={5} bind:trimmedRows={pastEventsPage} />
  </div>
  {/if}

  <div class="options">
    <button onclick={toggleShowAll} title={showAll ? 'Show less' : 'Show more'}>
      <img src="/images/{showAll ? 'checkbox_on' : 'checkbox_off'}.png" alt="Checkbox"/> Show All Events</button>
  </div>
</div>

<style>
  h1 {
    cursor: pointer;
  }
  div.container {
        max-width: 1000px;
        margin: auto;
        padding: 0 1em;
  }
  div.event-row {
    display: flex;
    margin: 1em 0;
    flex-direction: row;
    justify-content: center;
  }
  div.event-icon {
    margin-right: 1em;
    width: 100px;
    text-align: center;
  }
  div.event-icon img {
    max-height: 64px;
  }
  div.event-description {
    flex-grow: 1;
  }
  div.event-description h2 {
    text-align: left;
    margin: 0;
    color: #FFF;
  }
  div.options {
    text-align: right;
    margin-top: 1em;
  }
  div.options button {
    color: #FFF;
    font-size: larger;
    img {
      margin-right: 0.5em;
      vertical-align: sub;
      height: 1.5em;
      width: 1.5em;
    }
  }
</style>
