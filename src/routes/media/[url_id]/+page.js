import { throwLoadError } from '$lib/load'
import { pb } from '$lib/pocketbase'

export async function load ({ fetch, params }) {
  try {
    const media = await pb.collection('medias').getFirstListItem(pb.filter('url_id = {:id}', { id: params.url_id }), {
      expand: 'destination,topic',
      fetch
    })
    return {
      media
    }
  } catch (err) {
    throwLoadError(err, 'Media not found')
  }
}
