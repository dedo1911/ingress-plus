import { error } from '@sveltejs/kit'
import { pb } from '$lib/pocketbase'
import { categories } from '$lib/stores/index.js'
import sortBy from 'lodash.sortby'

export async function load ({ fetch }) {
  try {
    const items = await pb.collection('categories').getFullList({
      sort: '-sorting',
      expand: 'badges_via_category',
      fields: [
        'title',
        'tiers',
        'expand.badges_via_category.collectionId',
        'expand.badges_via_category.id',
        'expand.badges_via_category.image',
        'expand.badges_via_category.title',
        'expand.badges_via_category.description',
        'expand.badges_via_category.unobtainable',
        'expand.badges_via_category.hasPlaceholderData',
        'expand.badges_via_category.wings_possible',
      ].join(','),
      fetch
    })
    categories.set(items.map(i => {
      const r = { ...i, badges: i.expand ? sortBy(i.expand.badges_via_category || []).reverse() : [] }
      delete r.expand
      return r
    }))
    return {}
  } catch (err) {
    console.error(err)
  }
  throw error(500, 'Internal server error')
}
