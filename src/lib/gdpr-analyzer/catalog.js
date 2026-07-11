// Privacy category flags used in each entry's `privacy: [...]` array below. A single
// file can carry more than one at once (e.g. a file with both the owner's email and
// other players' names would have `privacy: ['own-email', 'third-party-pii']`) - the
// UI in +page.svelte lists every flagged category for a file, not just the first one.
//
// Currently applied below: 'own-email', 'third-party-pii', 'free-text'.
// Reserved for future use (not yet attached to any entry): 'location', 'device-info'.
//
// - 'own-email'       - the account owner's own email address(es)
// - 'third-party-pii' - other players' names, codenames, or other identifying info
// - 'location'        - GPS/location coordinates
// - 'device-info'     - device fingerprint data (OS, manufacturer, model)
// - 'free-text'       - freeform text that could contain anything not otherwise listed

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
  'portal_history.tsv': {
    shape: 'tabular',
    label: 'Portal History',
    description: 'Portals visited, captured, or scout-controlled - each row is just a type and a coordinate, with no timestamp.'
  },
  'fitnessdata.tsv': {
    shape: 'tabular',
    label: 'Fitness Data',
    timeColumn: 'Date and time of logging (UTC)',
    description: 'Hourly step count, distance, and calorie estimates logged from device fitness tracking while playing.'
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

// The remaining ~151 filenames from a real Niantic GDPR export that aren't rich/unusual
// enough to need their own KNOWN_FILES entry - mostly the "stat history" family
// (xm_collected.tsv, hacks.tsv, event_*.tsv, plus_*.tsv, etc.) plus the Player_Journey
// CSVs. Anything NOT on this list (and not in KNOWN_FILES/PREFIX_MATCHES above) is
// treated as not coming from a GDPR export at all and is rejected outright, rather than
// guessed at from its shape - see isRecognizedFilename() below. Generated from a real
// sample export's actual file listing, not hand-typed.
const GENERIC_RECOGNIZED_FILENAMES = new Set([
  'add_mod1.csv', 'add_mod2.csv', 'add_powerup1.csv', 'add_powerup2.csv',
  'agent_ops_completed.tsv', 'all_portals_approved.tsv', 'apex_mods_used.tsv',
  'ar_videos_uploaded.tsv', 'aurora_glyph_hacks.tsv', 'beacon_battles.tsv',
  'buried_memories_anomaly_guids.tsv', 'buried_memories_event_points.tsv',
  'cargo_amounts_applied.tsv', 'collect_items_or_glyphs_from_portal1.csv',
  'collect_items_or_glyphs_from_portal2.csv', 'comic_sans_links_created.tsv',
  'completed_all_daily_quests.tsv', 'courier_ap_gained.tsv', 'create_link1.csv',
  'create_link2.csv', 'cryptic_memories_anomaly_guids.tsv', 'cryptic_memories_points.tsv',
  'deploy_resonator1.csv', 'deploy_resonator2.csv', 'deploys.tsv',
  'didact_controller_fields_created.tsv', 'discoverie_anomaly_guids_2023.tsv',
  'discoverie_kinetic_capsules.tsv', 'discoverie_reclaimed_guids.tsv',
  'drone_forced_recalls.tsv', 'drone_hack_portal_guids.tsv', 'drone_range_km.tsv',
  'drone_visited_portal_guid.tsv', 'drones_sent_home.tsv', 'echo_anomaly_guids_2023.tsv',
  'eos_imprint_points.tsv', 'eos_imprint_points_enl.tsv', 'eos_imprint_points_res.tsv',
  'epiphany_dawn_guids.tsv', 'erased_memories_anomaly_guids.tsv',
  'erased_memories_global_op_points.tsv', 'event_alpha.tsv', 'event_bravo.tsv',
  'event_charlie.tsv', 'event_delta.tsv', 'event_echo.tsv', 'event_foxtrot.tsv',
  'event_golf.tsv', 'event_india.tsv', 'event_juliet.tsv', 'event_kilo.tsv',
  'event_kinetic_capsules_completed.tsv', 'event_mike.tsv', 'event_november.tsv',
  'event_oscar.tsv', 'event_papa.tsv', 'event_portal_guids_hacked.tsv',
  'field_test_dispatch_points.tsv', 'first_saturday_events.tsv', 'flip_cards_used.tsv',
  'flip_portal1.csv', 'flip_portal2.csv', 'free_skus_purchased.tsv', 'fully_deployed.tsv',
  'glyph_hack_attempts.tsv', 'glyph_hack_points.tsv', 'glyph_the_planet.tsv',
  'hack_streaks_completed.tsv', 'hacks.tsv', 'inventory_item_recycled.tsv',
  'keys_hacked.tsv', 'kilometers_walked.tsv', 'kilometers_walked_new.tsv',
  'kinetic_capsules_completed.tsv', 'kureze_effect_guids.tsv', 'kythera_guids.tsv',
  'link_held_days.tsv', 'link_length_kilometers.tsv',
  'link_length_kilometers_times_days_held.tsv', 'links_active.tsv', 'links_created.tsv',
  'links_destroyed_corrected.tsv', 'machina_links_destroyed.tsv',
  'machina_portals_neutralized.tsv', 'machina_portals_reclaimed_guids.tsv',
  'machina_resonators_destroyed.tsv', 'matryoshka_links_created.tsv',
  'mind_units_controlled.tsv', 'mind_units_controlled_active.tsv',
  'mind_units_destroyed.tsv', 'mind_units_times_days_held.tsv', 'mission_day_points.tsv',
  'missions_completed.tsv', 'mods_deployed.tsv', 'mods_destroyed.tsv',
  'myriad_portal_hacks.tsv', 'nl1331_meetup_points.tsv', 'ocf_events.tsv',
  'operation_chronos_points.tsv', 'opr_agreements.tsv', 'oprlive_events.tsv',
  'overclock_glyph_hack_points.tsv', 'passcode_redeemed.tsv', 'peace_week_points.tsv',
  'player_logs_in1.csv', 'player_logs_in2.csv', 'plus_alpha_anomaly_guids.tsv',
  'plus_alpha_global_op_pages.tsv', 'plus_alpha_global_op_points.tsv',
  'plus_beta_season_points.tsv', 'plus_delta_global_field_points.tsv',
  'plus_delta_global_reso_points.tsv', 'plus_delta_season_points.tsv',
  'plus_gamma_season_points.tsv', 'plus_theta_season_points.tsv',
  'portal_guids_captured.tsv', 'portal_guids_visited.tsv', 'portal_held_days.tsv',
  'portal_powerups_used.tsv', 'portals_approved.tsv', 'portals_approved_annex.tsv',
  'portals_neutralized.tsv', 'portals_owned.tsv', 'powercube_used.tsv',
  'query_nearby_vps_wayspots1_3.csv', 'query_nearby_vps_wayspots2_3.csv',
  'recharge_resonator1.csv', 'recharge_resonator2.csv', 'record_ar_scan1_3.csv',
  'recursions.tsv', 'region_held_days.tsv', 'regions_active.tsv', 'regions_created.tsv',
  'regions_destroyed_corrected.tsv', 'resonators_destroyed.tsv',
  'resonators_upgraded.tsv', 'scout_controller_portal_guids.tsv',
  'second_sunday_events.tsv', 'sentinel_portals_captured.tsv',
  'shared_memories_event_points.tsv', 'start_or_end_ar_session1_3.csv',
  'summer_2022_xm_recharged.tsv', 'superposition_guids.tsv',
  'umbra_resonator_deployments.tsv', 'upgrade_resonator1.csv', 'upgrade_resonator2.csv',
  'use_contextual_awareness1_3.csv', 'use_vps1_3.csv', 'use_vps2_3.csv',
  'xm_collected.tsv', 'xm_recharged.tsv'
])

// The single gate all detection goes through: is this filename something we've actually
// seen come out of a real Niantic GDPR export, either as a KNOWN_FILES/PREFIX_MATCHES
// entry or in the generic list above? If not, the file is rejected outright rather than
// guessed at from its extension/content.
export function isRecognizedFilename (filename) {
  const normalized = normalizeFilename(filename)
  return !!lookupKnownFile(filename) || GENERIC_RECOGNIZED_FILENAMES.has(normalized)
}
