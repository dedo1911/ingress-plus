import { error } from '@sveltejs/kit'
import { pb } from '$lib/pocketbase'

export async function load ({ fetch, params }) {
  try {
    const event = await pb.collection('game_events').getFirstListItem(`id="${params.event_id}"`, {
      expand: 'linked_badge',
      fetch
    })
    return {
      event
    }
  } catch (err) {
    console.error(err)
  }
  throw error(404, 'Event not found')
}
