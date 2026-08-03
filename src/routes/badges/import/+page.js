import { error } from '@sveltejs/kit'
import { pb } from '$lib/pocketbase'

export async function load ({ fetch }) {
  try {
    const badges = await pb.collection('badges').getFullList({
      filter: 'stat_line != ""',
      fields: [
        'id',
        'category',
        'collectionId',
        'image',
        'title',
        'stat_line',
        'tier_values',
        'unobtainable',
        'wings_possible',
        'locked_tier',
        'unlocks_at'
      ].join(','),
      fetch
    })
    return { badges }
  } catch (err) {
    console.error(err)
  }
  throw error(500, 'Internal server error')
}
