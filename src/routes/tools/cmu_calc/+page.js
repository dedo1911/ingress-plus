import { error } from '@sveltejs/kit'
import { pb } from '$lib/pocketbase'

const TIERS = [2500, 7000, 15000, 32000, 90000, 200000]

export async function load ({ fetch }) {
  try {
    const [currencies, packs] = await Promise.all([
      pb.collection('cmu_currencies').getFullList({ filter: 'enabled = true', sort: 'sorting', fetch }),
      pb.collection('cmu_packs').getFullList({ filter: 'enabled = true', expand: 'currency', fetch })
    ])

    const packsByCurrency = {}
    for (const row of packs) {
      const code = row.expand?.currency?.code
      if (!code) continue

      packsByCurrency[code] ??= {}
      packsByCurrency[code][row.platform] = TIERS.map(cmu => {
        const price = row[`cmu${cmu}_price`]
        return { cmu, price: price > 0 ? price : null }
      })
    }

    return { currencies, packsByCurrency }
  } catch (err) {
    console.error(err)
  }
  throw error(500, 'Internal server error')
}
