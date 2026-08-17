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

    // Maps The Grid's stat keys to our stat_line labels - kept in
    // PocketBase rather than hardcoded so a new key (Niantic adds stat
    // lines periodically) can be mapped without a code deployment. Not
    // essential to the rest of the page, so a missing/misconfigured
    // record shouldn't take down the whole import tool.
    let theGridStatMatches = {}
    try {
      const theGridMatching = await pb.collection('statMatching').getFirstListItem('serviceName = "the-grid"', { fetch })
      theGridStatMatches = theGridMatching.statMatches ?? {}
    } catch (err) {
      console.error(err)
    }

    let statsTrackerProStatMatches = {}
    try {
      const statsTrackerProMatching = await pb.collection('statMatching').getFirstListItem('serviceName = "stats-tracker-pro"', { fetch })
      statsTrackerProStatMatches = statsTrackerProMatching.statMatches ?? {}
    } catch (err) {
      console.error(err)
    }

    return { badges, theGridStatMatches, statsTrackerProStatMatches }
  } catch (err) {
    console.error(err)
  }
  throw error(500, 'Internal server error')
}
