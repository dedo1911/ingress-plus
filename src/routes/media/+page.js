import { error } from '@sveltejs/kit'
import { pb } from '$lib/pocketbase'

export async function load ({ fetch }) {
  try {
    const data = await Promise.all([
      pb.collection('media_categories').getFullList({
        sort: 'name',
        fetch
      }),
      pb.collection('media_destinations').getFullList({
        sort: 'name',
        fetch
      })
    ])
    return {
      topics: data[0],
      destinations: data[1]
    }
  } catch (err) {
    console.error(err)
  }
  throw error(500, 'Internal server error')
}
