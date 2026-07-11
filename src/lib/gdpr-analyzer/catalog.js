// Explicit catalog entries for the ~15-20 export files with a richer or unusual shape,
// verified against a real Niantic GDPR export. Everything else (the ~120 generic
// "stat history" files, plus anything not in this list at all) falls back to
// shape-based generic handling in detect.js/summarize.js - not hand-authoring an
// entry per file.
export const KNOWN_FILES = {
  'profile.txt': {
    shape: 'text-doc',
    label: 'Profile',
    description: 'A large key/value document: account info, agent stats, settings, capsule nicknames, badges earned, and inventory.',
    privacy: ['own-email']
  },
  'accountinformation.txt': {
    shape: 'text-doc',
    label: 'Account Information',
    description: 'Linked login providers (Apple/Google/Nintendo) and the device OS used to access the account.',
    privacy: ['own-email']
  },
  'socialprofile.txt': {
    shape: 'text-doc',
    label: 'Social Profile',
    description: 'Invite code and notification settings.'
  },
  'contactsimport.txt': {
    shape: 'text-doc',
    label: 'Contacts Import',
    description: 'Contacts-permission status and the invite name shown to others.',
    privacy: ['third-party-pii']
  },
  'gameplay.txt': {
    shape: 'text-doc',
    label: 'Gameplay Settings',
    description: 'Privacy policy acceptance date and the current daily quest list.'
  },
  'preprime_devices.txt': {
    shape: 'empty',
    label: 'Preprime Devices',
    description: 'Empty in this export - a placeholder for a device list.'
  },
  'game_log.tsv': {
    shape: 'tabular',
    label: 'Game Log',
    timeColumn: 'Event Time',
    description: 'The master event log - one row per in-game action (captures, hacks, links, comms, purchases, and more), usually by far the largest file in the export.'
  },
  'gameplaylocationhistory.tsv': {
    shape: 'tabular',
    label: 'Gameplay Location History',
    timeColumn: 'Date and Time',
    description: 'GPS location reported by the game over time.'
  },
  'logins.tsv': {
    shape: 'tabular',
    label: 'Logins',
    timeColumn: 'Session date and time',
    description: 'Login session start times and session lengths.'
  },
  'missions.tsv': {
    shape: 'tabular',
    label: 'Missions',
    description: 'One metadata row per mission followed by one near-empty row per waypoint - the row count is not the number of missions.'
  },
  'inapppurchases.tsv': {
    shape: 'tabular',
    label: 'In-App Purchases',
    timeColumn: 'Date and time',
    description: 'Real-money subscription purchase/renewal activity.'
  },
  'store_purchases.tsv': {
    shape: 'tabular',
    label: 'Store Purchases',
    timeColumn: 'Time',
    description: 'In-game store transactions (items and CMU), with the resulting CMU balance after each one.'
  },
  'subscriptions_monthly.tsv': {
    shape: 'tabular',
    label: 'Monthly Subscriptions',
    description: 'A history of monthly subscription renewals.'
  },
  'wayfarer_player_data.json': {
    shape: 'json-wayfarer',
    label: 'Wayfarer Player Data',
    description: 'Portal review (Wayfarer) activity: submissions rated, assignments received, and reviewer profile.',
    privacy: ['own-email']
  },
  'comm_mentions.tsv': {
    shape: 'tabular',
    label: 'Comm Mentions',
    description: 'In-game chat messages that mention this agent - written by other players.',
    privacy: ['third-party-pii']
  },
  'player_journey.zip': {
    shape: 'zip-redundant',
    label: 'Player Journey (zip)',
    description: "A zip archive that duplicates the already-unzipped Player_Journey folder byte-for-byte - you can skip this file, it's not analyzed here."
  }
}

// The 6 poi_*_submissions.tsv files all share the same "Submission time (UTC)" column.
for (const filename of [
  'poi_submissions.tsv',
  'poi_location_update_submissions.tsv',
  'poi_text_metadata_update_submission.tsv',
  'poi_image_submissions.tsv',
  'poi_video_submissions.tsv',
  'poi_takedown_request_submissions.tsv'
]) {
  KNOWN_FILES[filename] = {
    shape: 'tabular',
    label: 'POI Submission',
    timeColumn: 'Submission time (UTC)',
    description: filename === 'poi_submissions.tsv'
      ? 'Portal (POI) suggestions submitted for review - the location column packs latitude and longitude into a single field.'
      : 'Portal (POI) review submission activity.'
  }
}

// Matched by filename prefix rather than an exact key, since the trailing number may
// vary across export vintages (e.g. a future "SupportInteractions2.tsv") - and this is
// exactly the file where losing the privacy flag due to a naming mismatch matters most.
export const PREFIX_MATCHES = [
  {
    prefix: 'supportinteractions',
    shape: 'tabular',
    label: 'Support Interactions',
    description: 'Customer support ticket transcripts, including free-text messages from both the player and support staff.',
    privacy: ['third-party-pii', 'free-text']
  }
]

// Strips Chrome/Windows duplicate-download suffixes like " (1)" before matching, e.g.
// "GameplayLocationHistory (1).tsv" still matches "gameplaylocationhistory.tsv".
export function normalizeFilename (filename) {
  return filename.toLowerCase().replace(/ \(\d+\)(?=\.[^.]+$)/, '')
}

// Returns the catalog entry (plus how it was matched) for a known file, or null if this
// filename isn't in the catalog at all - callers fall back to generic handling in that case.
export function lookupKnownFile (filename) {
  const normalized = normalizeFilename(filename)

  if (KNOWN_FILES[normalized]) {
    return { ...KNOWN_FILES[normalized], matchedBy: 'filename' }
  }

  const prefixMatch = PREFIX_MATCHES.find(entry => normalized.startsWith(entry.prefix))
  if (prefixMatch) {
    return { ...prefixMatch, matchedBy: 'filename-prefix' }
  }

  return null
}
