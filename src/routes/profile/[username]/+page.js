import { error } from '@sveltejs/kit'
import { pb } from '$lib/pocketbase'

export async function load({ params }) {
  try {
    const publicUser = await pb.collection('public_users').getFirstListItem(`username="${params.username}"`)
    const ownedBadges = await pb.collection('user_badges').getFullList({
      filter: `user="${publicUser.id}"`,
      expand: 'badge,badge.category'
    })
    return {
      publicUser,
      ownedBadges
    }
  } catch (err) {
    console.error(err)
  }
  throw error(404, 'Profile not found')
}
