export const formatNumber = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')

export const stripHtml = html => (html || '').replace(/(<([^>]+)>)/gi, '')

// Thumb preset for badge images at the current badge grid size - shared by
// the badge grid and both agent profile pages.
export const thumbSize = (badgeSize) => {
  if (badgeSize <= 64) return '96x96'
  if (badgeSize <= 128) return '128x128'
  return '256x256'
}
