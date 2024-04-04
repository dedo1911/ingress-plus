import { error } from '@sveltejs/kit'
import { pb } from '$lib/pocketbase'

export async function load ({ fetch }) {
  try {
    const statistics = await Promise.all([
      pb.collection('statistics').getFullList({ fetch }), // statistics
      pb.collection('owned_badges').getList(1, 10, {
        expand: 'badge',
        skipTotal: true,
        fetch
      }), // topBadges
      pb.collection('public_users_owned_badges').getFullList({
        sort: '-count',
        fetch
      }), // topUsers
      pb.collection('media_users').getFullList({ fetch }), // topMediaUsers
      pb.collection('top_media_uploads').getFullList({ fetch }) // topMediaUsers
    ])
    return {
      statistics
    }
  } catch (err) {
    console.error(err)
  }
  throw error(500, 'Internal server error')
}
