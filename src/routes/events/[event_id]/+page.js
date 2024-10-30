import { error } from '@sveltejs/kit'
import { pb } from '$lib/pocketbase'

export async function load ({ fetch, params }) {
  try {
    const event = await pb.collection('game_events').getFirstListItem(`id="${params.event_id}"`, {
      fetch
    })
    return {
      event
    }
  } catch (err) {
    console.error(err)
  }
  throw error(404, 'Report not found')
}
