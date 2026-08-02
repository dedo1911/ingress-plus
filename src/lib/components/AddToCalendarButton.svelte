<script>
  // Self-registers the <add-to-calendar-button> custom element. The registration is
  // guarded internally (`typeof window === 'undefined'`), so this import is a harmless
  // no-op during SvelteKit's SSR pass and only takes effect once hydrated in the browser.
  import 'add-to-calendar-button'
  import { stripHtml } from '$lib/utils.js'

  const { event } = $props()
</script>

<add-to-calendar-button
  name={event.title}
  description={stripHtml(event.description)}
  startDate={event.start_time.format('YYYY-MM-DD')}
  startTime={event.start_time.format('HH:mm')}
  endDate={event.end_time.format('YYYY-MM-DD')}
  endTime={event.end_time.format('HH:mm')}
  timeZone="currentBrowser"
  location={event.location}
  options="['Google','Apple','iCal']"
  lightMode="dark"
  buttonStyle="text"
  trigger="click"
  hideBranding=true
  styleLight="--btn-padding-x: 0.4em; --btn-padding-y: 0.2em;"
  styleDark="--btn-padding-x: 0.4em; --btn-padding-y: 0.2em;"
></add-to-calendar-button>
