import { error } from '@sveltejs/kit'
import { pb } from '$lib/pocketbase'
import {categories} from "$lib/stores/index.js";
import sortBy from "lodash.sortby";

export async function load() {
  try {
    const items = await pb.collection('categories').getFullList({
      sort: '-sorting',
      expand: 'badges(category)'
    })
    categories.set(items.map(i => {
      const r = {...i, badges: i.expand ? sortBy(i.expand['badges(category)'] || []).reverse() : []}
      delete r.expand
      return r
    }))
    return {}
  } catch (err) {
    console.error(err)
  }
  throw error(500, 'Internal server error')
}
