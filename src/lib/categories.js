// Folds flat category groups into top-level nodes with their subcategories.
// A group is a category record plus its badges; `parentOf(group)` returns the
// parent category record (or nothing). Only two levels are supported: a
// parent's own parent is ignored. A parent can have no badges of its own
// (`own` is null) or both its own and its children's.
export function nestCategories (groups, parentOf) {
  const nodes = new Map()
  const nodeFor = c => {
    if (!nodes.has(c.id)) nodes.set(c.id, { key: c.id, title: c.title, sorting: c.sorting, own: null, children: [] })
    return nodes.get(c.id)
  }
  for (const group of groups) {
    const parent = parentOf(group)
    if (parent) nodeFor(parent).children.push(group)
    else nodeFor(group).own = group
  }
  // Children keep the order `groups` came in; only the top level is re-sorted,
  // by the parent's own `sorting`, so a parent sits where it was ranked.
  return [...nodes.values()].sort((a, b) => (b.sorting ?? 0) - (a.sorting ?? 0))
}
