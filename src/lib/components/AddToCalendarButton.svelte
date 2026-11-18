<script>
  // Self-registers the <add-to-calendar-button> custom element. The registration is
  // guarded internally (`typeof window === 'undefined'`), so this import is a harmless
  // no-op during SvelteKit's SSR pass and only takes effect once hydrated in the browser.
  import 'add-to-calendar-button'
  // Since v3 only the default style ships with the main entry: npm users have
  // to import any other button style they use.
  import 'add-to-calendar-button/styles/text'
  import { stripHtml } from '$lib/utils.js'

  const { event } = $props()
</script>

<add-to-calendar-button
  name={event.title}
  description={stripHtml(event.description)}
  start-date={event.start_time.format('YYYY-MM-DD')}
  start-time={event.start_time.format('HH:mm')}
  end-date={event.end_time.format('YYYY-MM-DD')}
  end-time={event.end_time.format('HH:mm')}
  time-zone="currentBrowser"
  location={event.location}
  options="['google','apple','ical']"
  light-mode="dark"
  button-style="text"
  trigger="click"
  hide-branding="true"
  style-light="--btn-padding-x: 0.4em; --btn-padding-y: 0.2em;"
  style-dark="--btn-padding-x: 0.4em; --btn-padding-y: 0.2em;"
></add-to-calendar-button>
