<script>
  import { onMount } from "svelte"
  import { pb, serverAddress } from "$lib/pocketbase"
  import { addToCalendar } from "$lib/utils.js"
  import Time, { dayjs } from "svelte-time"
  import utc from "dayjs/plugin/utc"
  import timezone from "dayjs/plugin/timezone"

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
    loadData()
  }

  const prevPage = () => {
    if (page <= 1) return
    page--
    loadData()
  }

  const nextPage = () => {
    if (page >= totalPages) return
    page++
    loadData()
  }

  const loadData = async () => {
    const userTZ = dayjs.tz.guess() || "UTC"
    const options = {
      filter: showAll ? "" : "homepage_hidden=false",
    }
    const r = await pb.collection("game_events_list").getList(page, 1 * itemsPerPage, options)
    totalPages = r.totalPages
    totalItems = r.totalItems
    eventsList = r.items.map((e) => {
      const isLocal = e.time_type === "local"
      e = {
        ...e,
        start_time: isLocal
          ? dayjs(e.start_time.substring(0, 19)).tz(userTZ)
          : dayjs(e.start_time),
        end_time: isLocal
          ? dayjs(e.end_time.substring(0, 19)).tz(userTZ)
          : dayjs(e.end_time),
      }

      e.is_active = dayjs().isAfter(e.start_time) && dayjs().isBefore(e.end_time)

      switch (e.category) {
        case "anomaly":
          e.categoryTitle = "Anomaly event"
          break
        case "shard_skirmish":
          e.categoryTitle = "Shard Skirmish"
          break
        case "beacon_skirmish":
          e.categoryTitle = "Beacon Skirmish"
          break
        case "second_sunday":
          e.categoryTitle = "Second Sunday"
          break
        case "first_saturday":
          e.categoryTitle = "First Saturday"
          break
        case "mission_day":
          e.categoryTitle = "Mission Day"
          break
        case "global_event":
          e.categoryTitle = "Global Event"
          break
        case "global_challenge":
          e.categoryTitle = "Global Challenge"
          break
        case "campaign":
        e.categoryTitle = "Dispatch Campaign"
          break
        case "paid_campaign":
          e.categoryTitle = "Premium Dispatch Campaign"
          break
        case "battle_pass":
          e.categoryTitle = "Reward Campaign"
          break
        case "2sday":
          e.categoryTitle = "2x AP Tuesday"
          break
        case "agent_enl":
          e.categoryTitle = "Agent organized Event (Enlightened)"
          break
        case "agent_res":
          e.categoryTitle = "Agent organized Event (Resistance)"
          break
        case "agent_xfac":
          e.categoryTitle = "Agent organized Event (Crossfaction)"
          break
        case "nl1331":
          e.categoryTitle = "NL-1331 Meetup"
          break
        case "special":
          e.categoryTitle = "Special Event"
          break
        case "tko":
          e.categoryTitle = "Tactical Kinetic Operations/GORUCK"
          break
        case "wayfarer":
          e.categoryTitle = "Wayfarer Challenge"
          break
        case "canceled":
          e.categoryTitle = "Canceled Event"
          break
        default:
          console.log("Unknown Event type: " + e.category)
          e.categoryTitle = "Unknown Event type"
          e.category = "special"
          break
      }

      return e
    })
  }

  onMount(loadData)
</script>

<svelte:head>
  <title>Ingress Plus &middot; Events</title>
</svelte:head>

{#snippet eventRow(e)}
  <div class="event-container" class:active={e.is_active}>
    <div class="event-row">
      <div class="event-icon">
        <a href="/events/{e.id}" aria-label="Event details">
          <span class="event-icon-image" style="background-image: url('{e.image != "" ? `${serverAddress}/api/files/ncmy64l5pb3p039/${e.id}/${e.image}` : `images/events/${e.category}.png`}');" ></span>
        </a>
      </div>
      <div class="event-description">
        <a href="/events/{e.id}"><h2 id={`event${e.id}`}>{e.title}</h2></a>
        <div class="event-meta">
          <span>
            <img
              style="height:1em"
              src="images/events/{e.category}.png"
              alt={e.category}
            />
            {e.categoryTitle}
          </span>
          {#if e.end_time.isAfter(dayjs())}
            <span>
              <a href={`#event${e.id}`}
                onclick={addToCalendar({
                  title: e.title,
                  description: e.description,
                  startTime: e.start_time,
                  endTime: e.end_time,
                  location: e.location,
                })} >
                Add to Calendar
                <img
                  style="height:1em"
                  src="images/add_to_calendar.svg"
                  alt="Add to Calendar"
                />
              </a>
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
              <strong>Ended <Time timestamp={e.start_time} relative live /></strong>
            {/if}
            <small>(
              from <Time timestamp={e.start_time} format="MMMM D, YYYY [at] h:mm A" live />
              to <Time timestamp={e.end_time} format="MMMM D, YYYY [at] h:mm A" live />
            )</small>
            {#if e.repeat_cron != ""}
              &middot; <strong>Recurring</strong>
            {/if}
          </span>
          <span>
            {e.location}
            <img style="height:1em" src="images/location.svg" alt="Location" />
          </span>
        </div>
      </div>
    </div>
  </div>
{/snippet}

<div class="container">
  {#each eventsList as event}
    {@render eventRow(event)}
  {/each}
  <div class="paginator">
    <img class:disabled={page <= 1} src="/images/left.svg" onclick={prevPage} alt="Previous Page" />
      Page {page} of {totalPages} (Total Events: {totalItems})
      <img class:disabled={page >= totalPages} src="/images/right.svg" onclick={nextPage} alt="Next Page" />
  </div>

  <div class="options">
    <button onclick={toggleShowAll} title={showAll ? "Show less" : "Show more"}>
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
  }
  div.event-container:hover {
    background: rgba(0, 0, 0, 0.5);
    box-shadow: black 0 0 1em;
  }
  div.event-row {
    display: flex;
    flex-direction: row;
    justify-content: center;
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
    width: 100px;
    text-align: center;
  }
  span.event-icon-image {
    width: 6em;
    height: 6em;
    display: inline-block;
    background-position: center;
    background-size: cover;
    border-radius: 0.5em;
    box-shadow: black 0 0 0.25em;
  }
  div.event-meta, div.event-time {
    display: flex;
    justify-content: space-between;
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
</style>
