import { throwLoadError } from '$lib/load'
import { pb } from '$lib/pocketbase'

export async function load ({ fetch, params }) {
  try {
    // Needs game_events' view rule to match its list rule (set in the
    // PocketBase admin UI, 2026-09) - before that, single-record reads were
    // locked and this had to go through a list query.
    const event = await pb.collection('game_events').getOne(params.event_id, {
      expand: 'linked_badge',
      fetch
    })
    return {
      event
    }
  } catch (err) {
    throwLoadError(err, 'Event not found')
  }
}
