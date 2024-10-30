<script>
  import { serverAddress } from '$lib/pocketbase'
  import Time, { dayjs } from 'svelte-time'
  import utc from 'dayjs/plugin/utc'
  import timezone from 'dayjs/plugin/timezone'
  import * as cronjsMatcher from '@datasert/cronjs-matcher'

  dayjs.extend(utc)
  dayjs.extend(timezone)

  let { data } = $props()

  const userTZ = dayjs.tz.guess() || 'UTC'
  const isLocal = data.event.time_type === 'local'
  const event = {
    ...data.event,
    start_time: isLocal
      ? dayjs(data.event.start_time.substring(0, 19)).tz(userTZ)
      : dayjs(data.event.start_time),
    end_time: isLocal
      ? dayjs(data.event.end_time.substring(0, 19)).tz(userTZ)
      : dayjs(data.event.end_time),
    repeat_cron: data.event.repeat_cron
      ? dayjs(cronjsMatcher.getFutureMatches(data.event.repeat_cron, {
        timezone: isLocal ? userTZ : 'UTC',
        formatInTimezone: true,
        matchCount: 1,
      })[0])
      : null
  }
  if (event.repeat_cron) {
    event.start_time = event.start_time.year(event.repeat_cron.year()).month(event.repeat_cron.month()).date(event.repeat_cron.date())
    event.end_time = event.end_time.year(event.repeat_cron.year()).month(event.repeat_cron.month()).date(event.repeat_cron.date())
  }
</script>

<div class="container">
  <h1>{event.title}</h1>
  <p class="center">
    <img src="{serverAddress}/api/files/{event.collectionId}/{event.id}/{event.image}" alt={event.title} />
  </p>
  <p class="center">
    <strong><Time timestamp={event.start_time} relative live /></strong>
    <small>(
      from <Time timestamp={event.start_time} format="MMMM D, YYYY [at] h:mm A" live />
      to <Time timestamp={event.end_time} format="MMMM D, YYYY [at] h:mm A" live />
    )</small>
  <p class="center">
    {@html event.description}
  </p>
  {#if event.active_boni}
    <hr />
    <h2>Active Bonus</h2>
    <p>{@html event.active_boni}</p>
  {/if}
  {#if event.rewards}
    <hr />
    <h2>Rewards</h2>
    <p>{@html event.rewards}</p>
  {/if}
</div>

<style>
  div.container {
    max-width: 1000px;
    margin: auto;
    padding: 0 1em;
  }
  img {
    max-height: 40vh;
    max-width: 100%;
    height: auto;
  }
  p.center {
    text-align: center;
  }
</style>
