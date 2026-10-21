import { throwLoadError } from '$lib/load'
import { pb } from '$lib/pocketbase'

const DEFAULT_SORT = '-released_at'
const DEFAULT_PER_PAGE = 20

// The whole catalogue state lives in the URL (s, q, t, d, n, p) so a share
// link reproduces the view, and it's read here rather than in onMount so the
// rows are server-rendered like every other list page.
export async function load ({ fetch, url }) {
  const q = url.searchParams
  const sort = q.get('s') || DEFAULT_SORT
  const search = q.get('q') || ''
  const perPage = Number(q.get('n')) || DEFAULT_PER_PAGE
  const page = Number(q.get('p')) || 1

  try {
    const [topics, destinations] = await Promise.all([
      pb.collection('media_categories').getFullList({ sort: 'name', fetch }),
      pb.collection('media_destinations').getFullList({ sort: 'name', fetch })
    ])

    // Ids in a shared link may have been deleted since - drop them instead
    // of letting an undefined facet throw and leave the page blank.
    const pick = (list, ids) => (ids || '').split(',').map(id => list.find(x => x.id === id)).filter(Boolean)
    const selectedTopics = pick(topics, q.get('t'))
    const selectedDestinations = pick(destinations, q.get('d'))

    // Values are bound with pb.filter(), never concatenated - a quote in the
    // search box would otherwise break (or rewrite) the expression.
    const filter = []
    if (search) filter.push(pb.filter('(short_description ~ {:q} || description ~ {:q})', { q: search }))
    const anyOf = (field, records) => `(${records.map(r => pb.filter(`${field} ~ {:id}`, { id: r.id })).join(' || ')})`
    if (selectedTopics.length > 0) filter.push(anyOf('topic', selectedTopics))
    if (selectedDestinations.length > 0) filter.push(anyOf('destination', selectedDestinations))

    const result = await pb.collection('medias').getList(page, perPage, {
      sort,
      filter: filter.join(' && '),
      fetch
    })

    return {
      topics,
      destinations,
      sort,
      search,
      perPage,
      selectedTopics,
      selectedDestinations,
      page: result.page,
      totalPages: result.totalPages,
      totalItems: result.totalItems,
      items: result.items
    }
  } catch (err) {
    throwLoadError(err)
  }
}
