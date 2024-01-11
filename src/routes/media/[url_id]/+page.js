import { error } from '@sveltejs/kit'
import { pb } from '$lib/pocketbase'

export async function load({ params }) {
  try {
    const media = await pb.collection('medias').getFirstListItem(`url_id="${params.url_id}"`, {
      expand: 'destination,topic'
    })
    return {
      media
    }
  } catch (err) {
    console.error(err)
  }
  throw error(404, 'Media not found')
}
