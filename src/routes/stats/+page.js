import { error } from '@sveltejs/kit'
import { pb } from '$lib/pocketbase'

export async function load() {
  try {
    const statistics = await Promise.all([
      pb.collection('statistics').getFullList(), // statistics
      pb.collection('owned_badges').getList(1, 10, {
        expand: 'badge',
        skipTotal: true,
      }), // topBadges
      pb.collection('public_users_owned_badges').getFullList({
        sort: '-count'
      }), // topUsers
      pb.collection('media_users').getFullList(), // topMediaUsers
      pb.collection('top_media_uploads').getFullList(), // topMediaUsers
    ])
    return {
      statistics
    }
  } catch (err) {
    console.error(err)
  }
  throw error(500, 'Internal server error')
}
