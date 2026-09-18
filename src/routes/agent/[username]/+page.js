import { throwLoadError } from '$lib/load'
import { pb } from '$lib/pocketbase'

export async function load ({ fetch, params }) {
  try {
    const publicUser = await pb.collection('public_users').getFirstListItem(pb.filter('username = {:username}', { username: params.username }), { fetch })
    const ownedBadges = await pb.collection('user_badges').getFullList({
      filter: pb.filter('user = {:id}', { id: publicUser.id }),
      expand: 'badge,badge.category',
      fetch
    })
    return {
      publicUser,
      ownedBadges
    }
  } catch (err) {
    throwLoadError(err, 'Agent not found')
  }
}
