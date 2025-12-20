<script>
  import { serverAddress } from '$lib/pocketbase'
  import Time, { dayjs } from 'svelte-time'
  import utc from 'dayjs/plugin/utc'
  import timezone from 'dayjs/plugin/timezone'
  import 'add-to-calendar-button'

  dayjs.extend(utc)
  dayjs.extend(timezone)

  let { data } = $props()

  const userTZ = dayjs.tz.guess() || 'UTC'
  const isLocal = data.event.time_type === 'local'
  const event = {
    ...data.event,
    image: `${serverAddress}/api/files/${data.event.collectionId}/${data.event.id}/${data.event.image}`,
    start_time: isLocal
      ? dayjs(data.event.start_time.substring(0, 19)).tz(userTZ)
      : dayjs(data.event.start_time),
    end_time: isLocal
      ? dayjs(data.event.end_time.substring(0, 19)).tz(userTZ)
      : dayjs(data.event.end_time)
  }

  // We can call .format() directly because event.start_time is now a DayJS object
  event.cal_start_date = event.start_time.format('YYYY-MM-DD')
  event.cal_start_time = event.start_time.format('HH:mm')
  event.cal_end_date   = event.end_time.format('YYYY-MM-DD')
  event.cal_end_time   = event.end_time.format('HH:mm')
  event.cal_timezone   = userTZ
  
  if (data.event.image == '') {
	event.image = `../images/events/${event.category}.png`}
</script>

<svelte:head>
  <title>Ingress Plus &middot; {event?.title || "Bug Report"}</title>

  <meta property="og:site_name" content="Ingress Plus">
  <meta property="og:type" content="website">
  <meta property="og:title" content={`Event: ${event?.title || 'Event'}`}>
  <meta property="og:url" content={event ? `https://ingress.plus/events/${event.id}` : ''}>
  <meta property="og:description" content={(event?.description || '').replace(/(<([^>]+)>)/gi, '')}>
  <meta property="og:image" content={event?.image?.replace('http://', 'https://') || ''}>

  <meta name="twitter:card" content="summary_large_image">
  <meta property="twitter:domain" content="ingress.plus">
  <meta property="twitter:url" content={event ? `https://ingress.plus/events/${event.id}` : ''}>
  <meta name="twitter:title" content={`Events: ${event?.title || 'Event'}`}>
  <meta name="twitter:description" content={(event?.description || '').replace(/(<([^>]+)>)/gi, '')}>
  <meta name="twitter:image" content={event?.image?.replace('http://', 'https://') || ''}>
</svelte:head>

<div class="container">
  <h1>{event.title}</h1>
  <p class="center">
    <img src="{event.image}" alt={event.title} /><br>
    <add-to-calendar-button
      name={event.title}
      description={event.description}
      location={event.location}
      startDate={event.cal_start_date}
      endDate={event.cal_end_date}
      startTime={event.cal_start_time}
      endTime={event.cal_end_time}
      timeZone={event.cal_timezone}
      options="'Apple','Google','iCal'"
      lightMode="dark"
      listStyle="modal"
      hideBranding=true
      label="Add {event.title} to Calendar"
      debug
    />
  </p>
  <p class="center">
      {#if event.start_time.isAfter(dayjs())}
             <strong>Starts <Time timestamp={event.start_time} relative live /></strong>
             <small>(
                 from <Time timestamp={event.start_time} format="MMMM D, YYYY [at] h:mm A" live />
                 to <Time timestamp={event.end_time} format="MMMM D, YYYY [at] h:mm A" live />
             )</small>
         {:else if event.start_time.isBefore(dayjs()) && event.end_time.isAfter(dayjs())}
             <strong>Ends <Time timestamp={event.end_time} relative live /></strong>
             <small>(
                 from <Time timestamp={event.start_time} format="MMMM D, YYYY [at] h:mm A" live />
                 to <Time timestamp={event.end_time} format="MMMM D, YYYY [at] h:mm A" live />
             )</small>
         {:else if event.end_time.isBefore(dayjs())}
             <strong>Ended <Time timestamp={event.end_time} relative live /></strong>
             <small>(
                 from <Time timestamp={event.start_time} format="MMMM D, YYYY [at] h:mm A" live />
                 to <Time timestamp={event.end_time} format="MMMM D, YYYY [at] h:mm A" live />
             )</small>
         {/if}
    </p>
		 <p class="center"><b><img style="height:1em;" src="../images/location.svg" alt="Location" /> {event.location}</b>
    {#if event.category == "paid_campaign" && event.cmu_cost} | 
      <img
        style="height:1em"
         src="../images/cmu.png"
         alt="CMU Cost"
        /> {Intl.NumberFormat().format(event.cmu_cost)} CMU
    {/if}
    {#if event.category == "battle_pass" && event.cmu_cost} | Upgrade Campaign for 
      <img
        style="height:1em"
        src="../images/cmu.png"
        alt="CMU Cost"
      /> {Intl.NumberFormat().format(event.cmu_cost)} CMU
    {/if}
  </p>
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
    display: flex;
    flex-direction: column; /* Stacks image and button vertically */
    align-items: center;    /* Centers them horizontally */
  }
</style>
