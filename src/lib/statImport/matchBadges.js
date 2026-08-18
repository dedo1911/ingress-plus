import { dayjs } from 'svelte-time/dayjs'

// A badge can't be manually toggled at all on the main badges page if it's
// unobtainable, or if it has an unlocks_at date that hasn't passed yet -
// import shouldn't be able to grant it either in that case.
function isBadgeAvailable (badge) {
  if (badge.unobtainable) return false
  if (badge.unlocks_at && dayjs(badge.unlocks_at).isAfter(dayjs())) return false
  return true
}

// Given a badge's ascending tier_values and a stat's numeric value, works out
// which tier's image best represents that value: the highest tier whose
// threshold has been met. When the value falls short of even the first
// tier, tier 0's image is still returned so the caller can show it dimmed
// to indicate a match exists but hasn't been earned yet. Recursion wings are
// earned once the value reaches double the highest tier's requirement, same
// as on the main badges page - but only if the agent has actually recursed
// at least once, since that's the only way to earn wings in the game at
// all; doubling a stat alone doesn't imply that.
function resolveTier (badge, value, recursions) {
  if (!isBadgeAvailable(badge)) return { tierIndex: 0, reached: false, wingsEarned: false }

  const thresholds = (badge.tier_values || '')
    .split(',')
    .map(Number)
    .filter(n => !Number.isNaN(n))

  if (thresholds.length === 0) return { tierIndex: 0, reached: false, wingsEarned: false }

  let tierIndex = -1
  for (let i = 0; i < thresholds.length; i++) {
    if (value >= thresholds[i]) tierIndex = i
  }

  if (tierIndex === -1) return { tierIndex: 0, reached: false, wingsEarned: false }

  const highestTierValue = thresholds[thresholds.length - 1]
  let wingsEarned = badge.wings_possible === true && recursions >= 1 && value >= highestTierValue * 2

  // Cap at the highest tier the game has actually unlocked for this badge -
  // mirrors the disabled-checkbox restriction on the main badges page, so
  // import can't grant a tier a user couldn't manually check themselves.
  if (badge.locked_tier > 0 && tierIndex >= badge.locked_tier) {
    tierIndex = badge.locked_tier - 1
  }

  // Wings only ever display on a badge's true highest tier - if a lock
  // capped us below that, they can't be shown either.
  if (tierIndex !== thresholds.length - 1) wingsEarned = false

  return { tierIndex, reached: true, wingsEarned }
}

// The Guardian badge ("Max Time Portal Held") was retired by the
// developers - it can no longer be earned, but the stat line itself is
// still reported and still updates for agents who already have it from
// before the retirement. Since most agents importing stats won't have it,
// it's deliberately left out of matching entirely rather than shown
// dimmed like a normal unearned badge; the import page shows a callout
// telling agents with the stat to mark it manually instead.
const RETIRED_BADGE_TITLES = new Set(['Guardian'])

// Matches parsed stat-line entries to the badges that track them, by exact
// name against each badge's stat_line field, and resolves which tier each
// matched badge's value reaches. All three import sources (text export,
// Agent Stats, The Grid) report a "Recursions" stat alongside the rest, so
// it's read once here rather than passed in separately.
export function matchBadgesToStats (stats, badges) {
  const badgesByStatLine = new Map()
  for (const badge of badges) {
    if (!badge.stat_line || RETIRED_BADGE_TITLES.has(badge.title)) continue
    if (!badgesByStatLine.has(badge.stat_line)) badgesByStatLine.set(badge.stat_line, [])
    badgesByStatLine.get(badge.stat_line).push(badge)
  }

  const recursions = Number(stats.find(s => s.stat === 'Recursions')?.value)

  return stats.map(entry => {
    const matchedBadges = badgesByStatLine.get(entry.stat) ?? []
    const value = Number(entry.value)
    return {
      ...entry,
      badges: matchedBadges.map(badge => ({ badge, ...resolveTier(badge, value, recursions) }))
    }
  })
}
