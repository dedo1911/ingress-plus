import { throwLoadError } from '$lib/load'
import { pb } from '$lib/pocketbase'

// Only the fetch lives here: the times are re-read in the agent's own
// timezone, which is a browser-side decision the page makes from this data.
export async function load ({ fetch }) {
  try {
    const events = await pb.collection('game_events_list').getFullList({
      expand: 'linked_badge',
      fetch
    })
    return { events }
  } catch (err) {
    throwLoadError(err)
  }
}
