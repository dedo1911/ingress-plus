import { error } from '@sveltejs/kit'
import { pb } from '$lib/pocketbase'

export async function load ({ fetch, params }) {
  try {
    const publicUser = await pb.collection('public_users').getFirstListItem(`username="${params.username}"`, { fetch })
    const ownedBadges = await pb.collection('user_badges').getFullList({
      filter: `user="${publicUser.id}"`,
      expand: 'badge,badge.category',
      fetch
    })
    return {
      publicUser,
      ownedBadges
    }
  } catch (err) {
    console.error(err)
  }
  throw error(404, 'Agent not found')
}
