import { Carta } from 'carta-md'
import DOMPurify from 'isomorphic-dompurify'
import { pb } from '$lib/pocketbase'

// The sideloader userscript, served from static/.
export const SIDELOADER_URL = '/ingress-plus.user.js'

// Plugin descriptions are written by other agents, so the markdown viewer
// must sanitize: carta-md renders raw HTML otherwise.
export const pluginCarta = () => new Carta({ sanitizer: DOMPurify.sanitize })

// Store catalog and detail. Both need the agent signed in, and the backend
// only returns plugins they have access to (a 404 otherwise), so these are
// called from the browser after auth is known, never from a load function:
// SSR has no session to send.
export const listPlugins = async () => (await pb.send('/api/plugins', { method: 'GET' })).plugins

export const getPlugin = (slug) => pb.send(`/api/plugins/${encodeURIComponent(slug)}`, { method: 'GET' })

export const STATUS_LABELS = {
  draft: 'Draft',
  pending_review: 'Waiting for review',
  approved: 'Published',
  rejected: 'Rejected',
  disabled: 'Disabled by the Ingress Plus team'
}

export const VERSION_STATUS_LABELS = {
  pending: 'Waiting for review',
  approved: 'Approved',
  rejected: 'Rejected'
}

export const FACTION_OPTIONS = [
  { value: 'enlightened', label: 'Enlightened' },
  { value: 'resistance', label: 'Resistance' },
  { value: 'machina', label: 'Machina' }
]

export const ACCESS_RULE_TYPES = [
  { value: 'all', label: 'All signed-in agents' },
  { value: 'verified', label: 'Verified agents' },
  { value: 'faction', label: 'Verified agents of a faction' },
  { value: 'supporter', label: 'Supporters' },
  { value: 'user', label: 'Specific agents' }
]

// One sentence per rule, for the author's own view of their plugin.
export const describeAccess = (access) => {
  const rules = access?.rules || []
  if (rules.length === 0) return 'Only you'
  return rules.map(rule => {
    switch (rule.type) {
      case 'all': return 'every signed-in agent'
      case 'verified': return 'verified agents'
      case 'supporter': return 'supporters'
      case 'faction': return `verified ${rule.factions.map(f => FACTION_OPTIONS.find(o => o.value === f)?.label || f).join('/')} agents`
      case 'user': return `${rule.userIds.length} specific agent${rule.userIds.length === 1 ? '' : 's'}`
      default: return rule.type
    }
  }).join(', ')
}
