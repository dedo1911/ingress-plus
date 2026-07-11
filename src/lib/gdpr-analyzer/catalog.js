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

// Every file below has been given a first-pass label/description based on the filename,
// its shape (history/event-log/snapshot), and general Ingress game knowledge - NOT
// individually verified against real file content the way the richer entries earlier in
// this file were. Treat these as a starting point pending manual review, not a final
// source of truth - several event/anomaly names (Kureze, Kythera, Superposition, OCF,
// Myriad, etc.) are educated guesses.
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

// The remaining ~126 top-level "stat history" files, verified to all be one of three
// header shapes (Time+Value, Time+Unique ID, or Time+Current Value) against a real
// sample export - see summarize.js for how each shape is interpreted. Kept as a
// separate, compact { label, description } map (rather than repeating `shape: 'tabular'`
// 126 times) and merged into KNOWN_FILES below.
const GENERIC_STAT_FILES = {
  'agent_ops_completed.tsv': { label: 'Agent Ops Completed', description: 'Lifetime count of Agent Ops (guided in-app missions/challenges) completed, updated over time.' },
  'all_portals_approved.tsv': { label: 'All Portals Approved', description: 'A log of portal candidate approvals recorded over time.' },
  'apex_mods_used.tsv': { label: 'APEX Mods Used', description: 'Lifetime count of APEX-tier mods used, updated over time.' },
  'ar_videos_uploaded.tsv': { label: 'AR Videos Uploaded', description: 'A log of AR video uploads, over time.' },
  'aurora_glyph_hacks.tsv': { label: 'Aurora Glyph Hacks', description: "A log of glyph hacks performed during the 'Aurora' event, over time." },
  'beacon_battles.tsv': { label: 'Beacon Battles', description: 'A log of Beacon (seasonal in-game battle feature) participation, over time.' },
  'buried_memories_anomaly_guids.tsv': { label: 'Buried Memories Anomaly', description: "A log of anomaly-portal participation during the 'Buried Memories' live event, over time." },
  'buried_memories_event_points.tsv': { label: 'Buried Memories Event Points', description: "Points earned during the 'Buried Memories' live event, updated over time." },
  'cargo_amounts_applied.tsv': { label: 'Cargo Amounts Applied', description: 'Cumulative cargo bonus applied, updated over time.' },
  'comic_sans_links_created.tsv': { label: 'Comic Sans Links Created', description: 'Links created as part of a specific link-shape challenge/medal, updated over time.' },
  'completed_all_daily_quests.tsv': { label: 'All Daily Quests Completed', description: 'Lifetime count of days all daily quests were completed, updated over time.' },
  'courier_ap_gained.tsv': { label: 'Courier AP Gained', description: 'AP earned via the Courier medal (carrying keys long distances), updated over time.' },
  'cryptic_memories_anomaly_guids.tsv': { label: 'Cryptic Memories Anomaly', description: "A log of anomaly-portal participation during the 'Cryptic Memories' live event, over time." },
  'cryptic_memories_points.tsv': { label: 'Cryptic Memories Points', description: "Points earned during the 'Cryptic Memories' live event, updated over time." },
  'deploys.tsv': { label: 'Deploys', description: 'Lifetime count of resonators deployed on portals, updated over time.' },
  'didact_controller_fields_created.tsv': { label: 'Didact Controller Fields Created', description: "Fields created while under the 'Didact' controller/effect, updated over time." },
  'discoverie_anomaly_guids_2023.tsv': { label: 'Discoverie Anomaly (2023)', description: "A log of anomaly-portal participation during the 2023 'Discoverie' anomaly, over time." },
  'discoverie_kinetic_capsules.tsv': { label: 'Discoverie Kinetic Capsules', description: "Kinetic Capsules obtained during the 'Discoverie' anomaly series, updated over time." },
  'discoverie_reclaimed_guids.tsv': { label: 'Discoverie Reclaimed Portals', description: "A log of portals reclaimed during the 'Discoverie' anomaly, over time." },
  'drone_forced_recalls.tsv': { label: 'Drone Forced Recalls', description: 'Lifetime count of drones forcibly recalled (e.g. running out of range/battery), updated over time.' },
  'drone_hack_portal_guids.tsv': { label: 'Drone Hack Portals', description: 'A log of portals hacked remotely via drone, over time.' },
  'drone_range_km.tsv': { label: 'Drone Range (Kilometers)', description: 'Cumulative distance traveled by drones, updated over time.' },
  'drone_visited_portal_guid.tsv': { label: 'Drone Visited Portals', description: 'A log of portals visited by drone, over time.' },
  'drones_sent_home.tsv': { label: 'Drones Sent Home', description: 'Lifetime count of drones returned home, updated over time.' },
  'echo_anomaly_guids_2023.tsv': { label: 'Echo Anomaly (2023)', description: "A log of anomaly-portal participation during the 2023 'Echo' anomaly, over time." },
  'eos_imprint_points.tsv': { label: 'EoS Imprint Points', description: "Points earned during the 'EoS Imprint' live event, updated over time." },
  'eos_imprint_points_enl.tsv': { label: 'EoS Imprint Points (Enlightened)', description: "Enlightened faction-wide points earned during the 'EoS Imprint' live event, updated over time." },
  'eos_imprint_points_res.tsv': { label: 'EoS Imprint Points (Resistance)', description: "Resistance faction-wide points earned during the 'EoS Imprint' live event, updated over time." },
  'epiphany_dawn_guids.tsv': { label: 'Epiphany Dawn', description: "A log of participation during the 'Epiphany Dawn' live event, over time." },
  'erased_memories_anomaly_guids.tsv': { label: 'Erased Memories Anomaly', description: "A log of anomaly-portal participation during the 'Erased Memories' live event, over time." },
  'erased_memories_global_op_points.tsv': { label: 'Erased Memories Global Op Points', description: "Points earned during the 'Erased Memories' Global Operation, updated over time." },
  'event_alpha.tsv': { label: 'Event Alpha', description: "Points/progress earned during the 'Alpha' live event, updated over time." },
  'event_bravo.tsv': { label: 'Event Bravo', description: "Points/progress earned during the 'Bravo' live event, updated over time." },
  'event_charlie.tsv': { label: 'Event Charlie', description: "Points/progress earned during the 'Charlie' live event, updated over time." },
  'event_delta.tsv': { label: 'Event Delta', description: "Points/progress earned during the 'Delta' live event, updated over time." },
  'event_echo.tsv': { label: 'Event Echo', description: "Points/progress earned during the 'Echo' live event, updated over time." },
  'event_foxtrot.tsv': { label: 'Event Foxtrot', description: "Points/progress earned during the 'Foxtrot' live event, updated over time." },
  'event_golf.tsv': { label: 'Event Golf', description: "Points/progress earned during the 'Golf' live event, updated over time." },
  'event_india.tsv': { label: 'Event India', description: "Points/progress earned during the 'India' live event, updated over time." },
  'event_juliet.tsv': { label: 'Event Juliet', description: "Points/progress earned during the 'Juliet' live event, updated over time." },
  'event_kilo.tsv': { label: 'Event Kilo', description: "Points/progress earned during the 'Kilo' live event, updated over time." },
  'event_kinetic_capsules_completed.tsv': { label: 'Event Kinetic Capsules Completed', description: 'Kinetic Capsule challenges completed during a specific live event, updated over time.' },
  'event_mike.tsv': { label: 'Event Mike', description: "Points/progress earned during the 'Mike' live event, updated over time." },
  'event_november.tsv': { label: 'Event November', description: "Points/progress earned during the 'November' live event, updated over time." },
  'event_oscar.tsv': { label: 'Event Oscar', description: "Points/progress earned during the 'Oscar' live event, updated over time." },
  'event_papa.tsv': { label: 'Event Papa', description: "Points/progress earned during the 'Papa' live event, updated over time." },
  'event_portal_guids_hacked.tsv': { label: 'Event Portal Hacks', description: 'A log of portals hacked during a specific live event, over time.' },
  'field_test_dispatch_points.tsv': { label: 'Field Test Dispatch Points', description: "Points earned from 'Field Test' dispatch-related activity, updated over time." },
  'first_saturday_events.tsv': { label: 'First Saturday Events', description: "A log of participation in monthly 'First Saturday' community events, over time." },
  'flip_cards_used.tsv': { label: 'Flip Cards Used', description: 'Lifetime count of Portal Flip Cards used, updated over time.' },
  'free_skus_purchased.tsv': { label: 'Free Items Claimed', description: 'Lifetime count of free in-app items claimed, updated over time.' },
  'fully_deployed.tsv': { label: 'Fully Deployed', description: 'Lifetime count of portals fully deployed (all resonator slots filled), updated over time.' },
  'glyph_hack_attempts.tsv': { label: 'Glyph Hack Attempts', description: 'Lifetime count of glyph hack attempts, updated over time.' },
  'glyph_hack_points.tsv': { label: 'Glyph Hack Points', description: 'Cumulative points earned from glyph hacking, updated over time.' },
  'glyph_the_planet.tsv': { label: 'Glyph the Planet', description: "Progress toward the 'Glyph the Planet' medal, updated over time." },
  'hack_streaks_completed.tsv': { label: 'Hack Streaks Completed', description: 'Lifetime count of hack streaks completed, updated over time.' },
  'hacks.tsv': { label: 'Hacks', description: 'Lifetime count of portals hacked, updated over time.' },
  'inventory_item_recycled.tsv': { label: 'Inventory Items Recycled', description: 'Lifetime count of inventory items recycled for XM, updated over time.' },
  'keys_hacked.tsv': { label: 'Keys Hacked', description: 'Lifetime count of portal keys obtained via hacking, updated over time.' },
  'kilometers_walked.tsv': { label: 'Kilometers Walked', description: 'Cumulative distance walked while playing, updated over time.' },
  'kilometers_walked_new.tsv': { label: 'Kilometers Walked (New)', description: 'A newer/replacement tracker for cumulative distance walked, updated over time.' },
  'kinetic_capsules_completed.tsv': { label: 'Kinetic Capsules Completed', description: 'Lifetime count of Kinetic Capsule challenges completed, updated over time.' },
  'kureze_effect_guids.tsv': { label: 'Kureze Effect', description: "A log of participation during the 'Kureze' anomaly/storyline, over time." },
  'kythera_guids.tsv': { label: 'Kythera', description: "A log of participation during the 'Kythera' anomaly/storyline, over time." },
  'link_held_days.tsv': { label: 'Link Held Days', description: 'Cumulative link-days held, updated over time.' },
  'link_length_kilometers.tsv': { label: 'Link Length (Kilometers)', description: 'Cumulative length of links created, in kilometers, updated over time.' },
  'link_length_kilometers_times_days_held.tsv': { label: 'Link Length × Days Held', description: 'Cumulative link length multiplied by days held, updated over time.' },
  'links_active.tsv': { label: 'Active Links', description: 'The current number of links you have active - a present-day snapshot.' },
  'links_created.tsv': { label: 'Links Created', description: 'Lifetime count of links created, updated over time.' },
  'links_destroyed_corrected.tsv': { label: 'Links Destroyed', description: 'Lifetime count of enemy links destroyed, updated over time.' },
  'machina_links_destroyed.tsv': { label: 'Machina Links Destroyed', description: 'Lifetime count of Machina faction links destroyed, updated over time.' },
  'machina_portals_neutralized.tsv': { label: 'Machina Portals Neutralized', description: 'Lifetime count of Machina faction portals neutralized, updated over time.' },
  'machina_portals_reclaimed_guids.tsv': { label: 'Machina Portals Reclaimed', description: 'A log of portals reclaimed from the Machina faction, over time.' },
  'machina_resonators_destroyed.tsv': { label: 'Machina Resonators Destroyed', description: 'Lifetime count of Machina faction resonators destroyed, updated over time.' },
  'matryoshka_links_created.tsv': { label: 'Matryoshka Links Created', description: 'Links created as part of nested (Matryoshka) triangle fields, updated over time.' },
  'mind_units_controlled.tsv': { label: 'Mind Units Controlled', description: 'Cumulative Mind Units (MU) controlled via fields, updated over time.' },
  'mind_units_controlled_active.tsv': { label: 'Mind Units Controlled (Active)', description: 'The current number of Mind Units you control - a present-day snapshot.' },
  'mind_units_destroyed.tsv': { label: 'Mind Units Destroyed', description: 'Cumulative enemy Mind Units destroyed, updated over time.' },
  'mind_units_times_days_held.tsv': { label: 'Mind Units × Days Held', description: 'Cumulative Mind Units controlled multiplied by days held, updated over time.' },
  'mission_day_points.tsv': { label: 'Mission Day Points', description: "Points earned during 'Mission Day' events, over time." },
  'missions_completed.tsv': { label: 'Missions Completed', description: 'A log of missions completed, over time.' },
  'mods_deployed.tsv': { label: 'Mods Deployed', description: 'Lifetime count of mods installed on portals, updated over time.' },
  'mods_destroyed.tsv': { label: 'Mods Destroyed', description: 'Lifetime count of enemy mods destroyed, updated over time.' },
  'myriad_portal_hacks.tsv': { label: 'Myriad Portal Hacks', description: "A log of hacks performed as part of the 'Myriad' feature/event, over time." },
  'nl1331_meetup_points.tsv': { label: 'NL-1331 Meetup Points', description: "Points earned attending 'NL-1331' storyline meetup events, over time." },
  'ocf_events.tsv': { label: 'OCF Events', description: "A log of participation in 'OCF' events, over time." },
  'operation_chronos_points.tsv': { label: 'Operation Chronos Points', description: "Points earned during the 'Operation Chronos' event, updated over time." },
  'opr_agreements.tsv': { label: 'OPR Agreements', description: 'A log of Wayfarer (OPR) review agreement outcomes, over time.' },
  'oprlive_events.tsv': { label: 'OPR Live Events', description: 'A log of participation in live Wayfarer (OPR) review events, over time.' },
  'overclock_glyph_hack_points.tsv': { label: 'Overclock Glyph Hack Points', description: "Points earned from glyph hacking during 'Overclock' bonus periods, updated over time." },
  'passcode_redeemed.tsv': { label: 'Passcodes Redeemed', description: 'Lifetime count of passcodes (promo codes) redeemed, updated over time.' },
  'peace_week_points.tsv': { label: 'Peace Week Points', description: "Points earned during the 'Peace Week' live event, updated over time." },
  'plus_alpha_anomaly_guids.tsv': { label: 'Plus Alpha Anomaly', description: "A log of participation during the 'Plus Alpha' anomaly, over time." },
  'plus_alpha_global_op_pages.tsv': { label: 'Plus Alpha Global Op Pages', description: "Story pages unlocked during the 'Plus Alpha' Global Operation, updated over time." },
  'plus_alpha_global_op_points.tsv': { label: 'Plus Alpha Global Op Points', description: "Points earned during the 'Plus Alpha' Global Operation, updated over time." },
  'plus_beta_season_points.tsv': { label: 'Plus Beta Season Points', description: "Points earned during the 'Plus Beta' seasonal storyline, updated over time." },
  'plus_delta_global_field_points.tsv': { label: 'Plus Delta Global Field Points', description: "Field-creation points earned during the 'Plus Delta' Global Operation, updated over time." },
  'plus_delta_global_reso_points.tsv': { label: 'Plus Delta Global Resonator Points', description: "Resonator-deployment points earned during the 'Plus Delta' Global Operation, updated over time." },
  'plus_delta_season_points.tsv': { label: 'Plus Delta Season Points', description: "Points earned during the 'Plus Delta' seasonal storyline, updated over time." },
  'plus_gamma_season_points.tsv': { label: 'Plus Gamma Season Points', description: "Points earned during the 'Plus Gamma' seasonal storyline, updated over time." },
  'plus_theta_season_points.tsv': { label: 'Plus Theta Season Points', description: "Points earned during the 'Plus Theta' seasonal storyline, updated over time." },
  'portal_guids_captured.tsv': { label: 'Portals Captured', description: 'A log of portals captured, over time (despite the filename, no real portal identifier is included - just a sequential count).' },
  'portal_guids_visited.tsv': { label: 'Portals Visited', description: 'A log of portals visited, over time (despite the filename, no real portal identifier is included - just a sequential count).' },
  'portal_held_days.tsv': { label: 'Portal Held Days', description: 'Cumulative portal-days held, updated over time.' },
  'portal_powerups_used.tsv': { label: 'Portal Power-ups Used', description: 'A log of portal power-ups (e.g. Ultra Link, ADA/Jarvis) used, over time.' },
  'portals_approved.tsv': { label: 'Portals Approved', description: 'A log of Wayfarer portal candidates approved, over time.' },
  'portals_approved_annex.tsv': { label: 'Portals Approved (Annex)', description: 'A supplementary log of Wayfarer portal candidates approved, over time.' },
  'portals_neutralized.tsv': { label: 'Portals Neutralized', description: 'A log of enemy portals neutralized, over time.' },
  'portals_owned.tsv': { label: 'Portals Owned', description: 'The current number of portals you own - a present-day snapshot.' },
  'powercube_used.tsv': { label: 'Power Cubes Used', description: 'Lifetime count of Power Cubes used to recharge, updated over time.' },
  'recursions.tsv': { label: 'Recursions', description: 'Lifetime count of Recursions (agent rebirths after reaching max level), updated over time.' },
  'region_held_days.tsv': { label: 'Region Held Days', description: 'Cumulative field-days held, updated over time.' },
  'regions_active.tsv': { label: 'Active Regions', description: 'The current number of control fields (regions) you have active - a present-day snapshot.' },
  'regions_created.tsv': { label: 'Regions Created', description: 'Lifetime count of control fields (regions) created, updated over time.' },
  'regions_destroyed_corrected.tsv': { label: 'Regions Destroyed', description: 'Lifetime count of enemy control fields destroyed, updated over time.' },
  'resonators_destroyed.tsv': { label: 'Resonators Destroyed', description: 'Lifetime count of enemy resonators destroyed, updated over time.' },
  'resonators_upgraded.tsv': { label: 'Resonators Upgraded', description: 'Lifetime count of resonators upgraded, updated over time.' },
  'scout_controller_portal_guids.tsv': { label: 'Scout Controller Portals', description: 'A log of portals interacted with via the Scout Controller drone feature, over time.' },
  'second_sunday_events.tsv': { label: 'Second Sunday Events', description: "A log of participation in monthly 'Second Sunday' community events, over time." },
  'sentinel_portals_captured.tsv': { label: 'Sentinel Portals Captured', description: "Portals captured and held toward the 'Sentinel' medal, updated over time." },
  'shared_memories_event_points.tsv': { label: 'Shared Memories Event Points', description: "Points earned during the 'Shared Memories' live event, updated over time." },
  'summer_2022_xm_recharged.tsv': { label: 'Summer 2022 XM Recharged', description: 'XM spent recharging resonators during the Summer 2022 seasonal event, updated over time.' },
  'superposition_guids.tsv': { label: 'Superposition', description: "A log of participation during the 'Superposition' anomaly/storyline, over time." },
  'umbra_resonator_deployments.tsv': { label: 'Umbra Resonator Deployments', description: "A log of resonator deployments during the 'Umbra' event, over time." },
  'xm_collected.tsv': { label: 'XM Collected', description: 'Lifetime XM (Exotic Matter) collected from portals, updated over time.' },
  'xm_recharged.tsv': { label: 'XM Recharged', description: 'Lifetime XM spent recharging resonators, updated over time.' }
}

for (const [filename, entry] of Object.entries(GENERIC_STAT_FILES)) {
  KNOWN_FILES[filename] = { shape: 'tabular', ...entry }
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

// The Player_Journey/ CSVs: one file per in-game action type, each split into a
// variable number of numbered chunks (e.g. Add_Mod1.csv, Add_Mod2.csv - and possibly
// Add_Mod3.csv on a larger export than the one this catalog was built from). Matched by
// regex rather than exact filename so any chunk number is recognized, not just the ones
// that happened to exist in the sample export used to build this catalog.
export const PATTERN_MATCHES = [
  { pattern: /^add_mod\d+(_\d+)?\.csv$/, label: 'Add Mod', description: 'GPS location recorded each time a mod was added to a deployed resonator.' },
  { pattern: /^add_powerup\d+(_\d+)?\.csv$/, label: 'Add Power-up', description: 'GPS location recorded each time a power-up was applied to a resonator.' },
  { pattern: /^collect_items_or_glyphs_from_portal\d+(_\d+)?\.csv$/, label: 'Collect Items or Glyphs from Portal', description: 'GPS location recorded each time items or glyph rewards were collected from a portal.' },
  { pattern: /^create_link\d+(_\d+)?\.csv$/, label: 'Create Link', description: 'GPS location recorded each time a link was created.' },
  { pattern: /^deploy_resonator\d+(_\d+)?\.csv$/, label: 'Deploy Resonator', description: 'GPS location recorded each time a resonator was deployed.' },
  { pattern: /^flip_portal\d+(_\d+)?\.csv$/, label: 'Flip Portal', description: 'GPS location recorded each time a portal was flipped to the other faction.' },
  { pattern: /^player_logs_in\d+(_\d+)?\.csv$/, label: 'Player Logs In', description: 'GPS location recorded each time you logged into the game.' },
  { pattern: /^query_nearby_vps_wayspots\d+(_\d+)?\.csv$/, label: 'Query Nearby VPS Wayspots', description: 'GPS location and device info recorded each time the app queried nearby AR-enabled (VPS) Wayspots.' },
  { pattern: /^recharge_resonator\d+(_\d+)?\.csv$/, label: 'Recharge Resonator', description: 'GPS location recorded each time a resonator was recharged.' },
  { pattern: /^record_ar_scan\d+(_\d+)?\.csv$/, label: 'Record AR Scan', description: 'Device info recorded each time an AR scan was performed (no location included in this file).' },
  { pattern: /^start_or_end_ar_session\d+(_\d+)?\.csv$/, label: 'Start or End AR Session', description: 'Device info recorded each time an AR session started or ended (no location included in this file).' },
  { pattern: /^upgrade_resonator\d+(_\d+)?\.csv$/, label: 'Upgrade Resonator', description: 'GPS location recorded each time a resonator was upgraded.' },
  { pattern: /^use_vps\d+(_\d+)?\.csv$/, label: 'Use VPS', description: 'GPS location and device info recorded each time AR/VPS positioning was used.' },
  { pattern: /^use_contextual_awareness\d+(_\d+)?\.csv$/, label: 'Use Contextual Awareness', description: 'Device info recorded each time the contextual awareness AR feature was used (no location included in this file).' }
].map(entry => ({ shape: 'tabular', ...entry }))

// Strips Chrome/Windows duplicate-download suffixes like " (1)" before matching, e.g.
// "GameplayLocationHistory (1).tsv" still matches "gameplaylocationhistory.tsv".
export function normalizeFilename (filename) {
  return filename.toLowerCase().replace(/ \(\d+\)(?=\.[^.]+$)/, '')
}

// Returns the catalog entry (plus how it was matched) for a known file, or null if this
// filename isn't recognized at all - callers treat that as "not a GDPR export file" and
// reject it, rather than guessing at its shape.
export function lookupKnownFile (filename) {
  const normalized = normalizeFilename(filename)

  if (KNOWN_FILES[normalized]) {
    return { ...KNOWN_FILES[normalized], matchedBy: 'filename' }
  }

  const prefixMatch = PREFIX_MATCHES.find(entry => normalized.startsWith(entry.prefix))
  if (prefixMatch) {
    return { ...prefixMatch, matchedBy: 'filename-prefix' }
  }

  const patternMatch = PATTERN_MATCHES.find(entry => entry.pattern.test(normalized))
  if (patternMatch) {
    const { pattern: _pattern, ...rest } = patternMatch
    return { ...rest, matchedBy: 'filename-pattern' }
  }

  return null
}
