// Privacy category flags used in each entry's `privacy: [...]` array below. A single
// file can carry more than one at once (e.g. a file with both the owner's email and
// other players' names would have `privacy: ['own-email', 'third-party-pii']`) - the
// UI in +page.svelte lists every flagged category for a file, not just the first one.
//
// - 'own-email'       - the account owner's own email address(es)
// - 'third-party-pii' - other players' names, codenames, or other identifying info
// - 'location'        - GPS/location coordinates
// - 'device-info'     - device fingerprint data (OS, manufacturer, model)
// - 'free-text'       - freeform text that could contain anything not otherwise listed

// One entry per file recognized from a real Niantic GDPR export. Some entries below
// (the first several, plus any others you've since edited) have been manually verified;
// the rest still carry a first-pass label/description based on the filename, its shape
// (history/event-log/snapshot), and general Ingress game knowledge - not individually
// checked against real file content. Treat unverified ones as a starting point pending
// manual review, not a final source of truth - several event/anomaly names (Kureze,
// Kythera, Superposition, OCF, Myriad, etc.) are educated guesses.
export const KNOWN_FILES = {
  'profile.txt': {
    shape: 'text-doc',
    label: 'Profile Information',
    description: 'Contains most of your profiles information, such as account creation date, registered Emails, Agent name and faction, last know location and more.',
    privacy: ['own-email', 'location']
  },
  'accountinformation.txt': {
    shape: 'text-doc',
    label: 'Login Providers',
    description: 'Linked login providers and the devices used to access the account.',
    privacy: ['own-email', 'device-info']
  },
  'socialprofile.txt': {
    shape: 'text-doc',
    label: 'Niantic Profile',
    description: 'Old invite code and notification settings used for the now removed Niantic Profile.'
  },
  'contactsimport.txt': {
    shape: 'text-doc',
    label: 'Niantic Profile - Contacts Import',
    description: 'Contacts-permission status and the invite name shown to others.',
    privacy: ['third-party-pii']
  },
  'gameplay.txt': {
    shape: 'text-doc',
    label: 'Privacy Policy and Daily Bounty status',
    description: 'Privacy policy acceptance date and the Daily Bounty list at the moment of the data export.'
  },
  'preprime_devices.txt': {
    shape: 'empty',
    label: 'Pre-Prime Devices',
    description: 'Unknown, likely a list of devices used with REDACTED. Let us know if you have a non-empty list!'
  },
  'game_log.tsv': {
    shape: 'tabular',
    label: 'Game Log',
    timeColumn: 'Event Time',
    description: 'The master event log (captures, hacks, links, comms, purchases, and more), listed one action at a time.',
    privacy: ['location']
  },
  'gameplaylocationhistory.tsv': {
    shape: 'tabular',
    label: 'Location History',
    timeColumn: 'Date and Time',
    description: 'GPS locations reported by the game over time.',
    privacy: ['location']
  },
  'portal_history.tsv': {
    shape: 'tabular',
    label: 'Portal History',
    description: 'Locations of Portals visited, captured, or scout-controlled.',
    privacy: ['location']
  },
  'fitnessdata.tsv': {
    shape: 'tabular',
    label: 'Fitness Data',
    timeColumn: 'Date and time of logging (UTC)',
    description: 'Hourly step count, distance, and calorie estimates logged from device fitness tracking while playing.'
  },
  'logins.tsv': {
    shape: 'tabular',
    label: 'Logins and Session lengths',
    timeColumn: 'Session date and time',
    description: 'Login session start times and session lengths.'
  },
  'missions.tsv': {
    shape: 'tabular',
    label: 'Missions',
    description: 'Details of your created Missions in the Mission Authoring Tool.'
  },
  'inapppurchases.tsv': {
    shape: 'tabular',
    label: 'C.O.R.E. subscription purchase and renewal times',
    timeColumn: 'Date and time',
    description: 'Date and time of C.O.R.E. either being purchased or being renewed.'
  },
  'store_purchases.tsv': {
    shape: 'tabular',
    label: 'In-app purchases',
    timeColumn: 'Time',
    description: 'Date and time of buying CMU or purchasing items in the in-app store, as well as details about each article and when the awarded items were used.'
  },
  'subscriptions_monthly.tsv': {
    shape: 'tabular',
    label: 'Months Subscribed',
    description: 'Represents the "Months Subscribed" statistic.'
  },
  'wayfarer_player_data.json': {
    shape: 'json-wayfarer',
    label: 'Wayfarer/Recon Player Data',
    description: 'Portal review activity: submissions rated, assignments received, and reviewer profile.',
    privacy: ['own-email']
  },
  'comm_mentions.tsv': {
    shape: 'tabular',
    label: 'Comm Mentions',
    description: 'In-game chat messages that mention you - written by other players, not by yourself.',
    privacy: ['third-party-pii']
  },
  'player_journey.zip': {
    shape: 'zip-redundant',
    label: 'Player Journey (zip)',
    description: 'Contains several files with times and locations of game actions. Unpack the archive and upload the files seperately to analyze them!'
  },
  'poi_submissions.tsv': {
    shape: 'tabular',
    label: 'POI Submission',
    timeColumn: 'Submission time (UTC)',
    description: 'Portal (POI) suggestions submitted for review - the location column packs latitude and longitude into a single field.'
  },
  'poi_location_update_submissions.tsv': {
    shape: 'tabular',
    label: 'POI Submission',
    timeColumn: 'Submission time (UTC)',
    description: 'Portal (POI) review submission activity.'
  },
  'poi_text_metadata_update_submission.tsv': {
    shape: 'tabular',
    label: 'POI Submission',
    timeColumn: 'Submission time (UTC)',
    description: 'Portal (POI) review submission activity.'
  },
  'poi_image_submissions.tsv': {
    shape: 'tabular',
    label: 'POI Submission',
    timeColumn: 'Submission time (UTC)',
    description: 'Portal (POI) review submission activity.'
  },
  'poi_video_submissions.tsv': {
    shape: 'tabular',
    label: 'POI Submission',
    timeColumn: 'Submission time (UTC)',
    description: 'Portal (POI) review submission activity.'
  },
  'poi_takedown_request_submissions.tsv': {
    shape: 'tabular',
    label: 'POI Submission',
    timeColumn: 'Submission time (UTC)',
    description: 'Portal (POI) review submission activity.'
  },
  'agent_ops_completed.tsv': {
    shape: 'tabular',
    label: 'Agent Ops Completed',
    description: 'Lifetime count of Agent Ops (guided in-app missions/challenges) completed, updated over time.'
  },
  'all_portals_approved.tsv': {
    shape: 'tabular',
    label: 'All Portals Approved',
    description: 'A log of portal candidate approvals recorded over time.'
  },
  'apex_mods_used.tsv': {
    shape: 'tabular',
    label: 'APEX Mods Used',
    description: 'Lifetime count of APEX-tier mods used, updated over time.'
  },
  'ar_videos_uploaded.tsv': {
    shape: 'tabular',
    label: 'AR Videos Uploaded',
    description: 'A log of AR video uploads, over time.'
  },
  'aurora_glyph_hacks.tsv': {
    shape: 'tabular',
    label: 'Aurora Glyph Hacks',
    description: "A log of glyph hacks performed during the 'Aurora' event, over time."
  },
  'beacon_battles.tsv': {
    shape: 'tabular',
    label: 'Beacon Battles',
    description: 'A log of Beacon (seasonal in-game battle feature) participation, over time.'
  },
  'buried_memories_anomaly_guids.tsv': {
    shape: 'tabular',
    label: 'Buried Memories Anomaly',
    description: "A log of anomaly-portal participation during the 'Buried Memories' live event, over time."
  },
  'buried_memories_event_points.tsv': {
    shape: 'tabular',
    label: 'Buried Memories Event Points',
    description: "Points earned during the 'Buried Memories' live event, updated over time."
  },
  'cargo_amounts_applied.tsv': {
    shape: 'tabular',
    label: 'Cargo Amounts Applied',
    description: 'Cumulative cargo bonus applied, updated over time.'
  },
  'comic_sans_links_created.tsv': {
    shape: 'tabular',
    label: 'Comic Sans Links Created',
    description: 'Links created as part of a specific link-shape challenge/medal, updated over time.'
  },
  'completed_all_daily_quests.tsv': {
    shape: 'tabular',
    label: 'All Daily Quests Completed',
    description: 'Lifetime count of days all daily quests were completed, updated over time.'
  },
  'courier_ap_gained.tsv': {
    shape: 'tabular',
    label: 'Courier AP Gained',
    description: 'AP earned via the Courier medal (carrying keys long distances), updated over time.'
  },
  'cryptic_memories_anomaly_guids.tsv': {
    shape: 'tabular',
    label: 'Cryptic Memories Anomaly',
    description: "A log of anomaly-portal participation during the 'Cryptic Memories' live event, over time."
  },
  'cryptic_memories_points.tsv': {
    shape: 'tabular',
    label: 'Cryptic Memories Points',
    description: "Points earned during the 'Cryptic Memories' live event, updated over time."
  },
  'deploys.tsv': {
    shape: 'tabular',
    label: 'Deploys',
    description: 'Lifetime count of resonators deployed on portals, updated over time.'
  },
  'didact_controller_fields_created.tsv': {
    shape: 'tabular',
    label: 'Didact Controller Fields Created',
    description: "Fields created while under the 'Didact' controller/effect, updated over time."
  },
  'discoverie_anomaly_guids_2023.tsv': {
    shape: 'tabular',
    label: 'Discoverie Anomaly (2023)',
    description: "A log of anomaly-portal participation during the 2023 'Discoverie' anomaly, over time."
  },
  'discoverie_kinetic_capsules.tsv': {
    shape: 'tabular',
    label: 'Discoverie Kinetic Capsules',
    description: "Kinetic Capsules obtained during the 'Discoverie' anomaly series, updated over time."
  },
  'discoverie_reclaimed_guids.tsv': {
    shape: 'tabular',
    label: 'Discoverie Reclaimed Portals',
    description: "A log of portals reclaimed during the 'Discoverie' anomaly, over time."
  },
  'drone_forced_recalls.tsv': {
    shape: 'tabular',
    label: 'Drone Forced Recalls',
    description: 'Lifetime count of drones forcibly recalled (e.g. running out of range/battery), updated over time.'
  },
  'drone_hack_portal_guids.tsv': {
    shape: 'tabular',
    label: 'Drone Hack Portals',
    description: 'A log of portals hacked remotely via drone, over time.'
  },
  'drone_range_km.tsv': {
    shape: 'tabular',
    label: 'Drone Range (Kilometers)',
    description: 'Cumulative distance traveled by drones, updated over time.'
  },
  'drone_visited_portal_guid.tsv': {
    shape: 'tabular',
    label: 'Drone Visited Portals',
    description: 'A log of portals visited by drone, over time.'
  },
  'drones_sent_home.tsv': {
    shape: 'tabular',
    label: 'Drones Sent Home',
    description: 'Lifetime count of drones returned home, updated over time.'
  },
  'echo_anomaly_guids_2023.tsv': {
    shape: 'tabular',
    label: 'Echo Anomaly (2023)',
    description: "A log of anomaly-portal participation during the 2023 'Echo' anomaly, over time."
  },
  'eos_imprint_points.tsv': {
    shape: 'tabular',
    label: 'EoS Imprint Points',
    description: "Points earned during the 'EoS Imprint' live event, updated over time."
  },
  'eos_imprint_points_enl.tsv': {
    shape: 'tabular',
    label: 'EoS Imprint Points (Enlightened)',
    description: "Enlightened faction-wide points earned during the 'EoS Imprint' live event, updated over time."
  },
  'eos_imprint_points_res.tsv': {
    shape: 'tabular',
    label: 'EoS Imprint Points (Resistance)',
    description: "Resistance faction-wide points earned during the 'EoS Imprint' live event, updated over time."
  },
  'epiphany_dawn_guids.tsv': {
    shape: 'tabular',
    label: 'Epiphany Dawn',
    description: "A log of participation during the 'Epiphany Dawn' live event, over time."
  },
  'erased_memories_anomaly_guids.tsv': {
    shape: 'tabular',
    label: 'Erased Memories Anomaly',
    description: "A log of anomaly-portal participation during the 'Erased Memories' live event, over time."
  },
  'erased_memories_global_op_points.tsv': {
    shape: 'tabular',
    label: 'Erased Memories Global Op Points',
    description: "Points earned during the 'Erased Memories' Global Operation, updated over time."
  },
  'event_alpha.tsv': {
    shape: 'tabular',
    label: 'Event Alpha',
    description: "Points/progress earned during the 'Alpha' live event, updated over time."
  },
  'event_bravo.tsv': {
    shape: 'tabular',
    label: 'Event Bravo',
    description: "Points/progress earned during the 'Bravo' live event, updated over time."
  },
  'event_charlie.tsv': {
    shape: 'tabular',
    label: 'Event Charlie',
    description: "Points/progress earned during the 'Charlie' live event, updated over time."
  },
  'event_delta.tsv': {
    shape: 'tabular',
    label: 'Event Delta',
    description: "Points/progress earned during the 'Delta' live event, updated over time."
  },
  'event_echo.tsv': {
    shape: 'tabular',
    label: 'Event Echo',
    description: "Points/progress earned during the 'Echo' live event, updated over time."
  },
  'event_foxtrot.tsv': {
    shape: 'tabular',
    label: 'Event Foxtrot',
    description: "Points/progress earned during the 'Foxtrot' live event, updated over time."
  },
  'event_golf.tsv': {
    shape: 'tabular',
    label: 'Event Golf',
    description: "Points/progress earned during the 'Golf' live event, updated over time."
  },
  'event_india.tsv': {
    shape: 'tabular',
    label: 'Event India',
    description: "Points/progress earned during the 'India' live event, updated over time."
  },
  'event_juliet.tsv': {
    shape: 'tabular',
    label: 'Event Juliet',
    description: "Points/progress earned during the 'Juliet' live event, updated over time."
  },
  'event_kilo.tsv': {
    shape: 'tabular',
    label: 'Event Kilo',
    description: "Points/progress earned during the 'Kilo' live event, updated over time."
  },
  'event_kinetic_capsules_completed.tsv': {
    shape: 'tabular',
    label: 'Event Kinetic Capsules Completed',
    description: 'Kinetic Capsule challenges completed during a specific live event, updated over time.'
  },
  'event_mike.tsv': {
    shape: 'tabular',
    label: 'Event Mike',
    description: "Points/progress earned during the 'Mike' live event, updated over time."
  },
  'event_november.tsv': {
    shape: 'tabular',
    label: 'Event November',
    description: "Points/progress earned during the 'November' live event, updated over time."
  },
  'event_oscar.tsv': {
    shape: 'tabular',
    label: 'Event Oscar',
    description: "Points/progress earned during the 'Oscar' live event, updated over time."
  },
  'event_papa.tsv': {
    shape: 'tabular',
    label: 'Event Papa',
    description: "Points/progress earned during the 'Papa' live event, updated over time."
  },
  'event_portal_guids_hacked.tsv': {
    shape: 'tabular',
    label: 'Event Portal Hacks',
    description: 'A log of portals hacked during a specific live event, over time.'
  },
  'field_test_dispatch_points.tsv': {
    shape: 'tabular',
    label: 'Field Test Dispatch Points',
    description: "Points earned from 'Field Test' dispatch-related activity, updated over time."
  },
  'first_saturday_events.tsv': {
    shape: 'tabular',
    label: 'First Saturday Events',
    description: "A log of participation in monthly 'First Saturday' community events, over time."
  },
  'flip_cards_used.tsv': {
    shape: 'tabular',
    label: 'Flip Cards Used',
    description: 'Lifetime count of Portal Flip Cards used, updated over time.'
  },
  'free_skus_purchased.tsv': {
    shape: 'tabular',
    label: 'Free Items Claimed',
    description: 'Lifetime count of free in-app items claimed, updated over time.'
  },
  'fully_deployed.tsv': {
    shape: 'tabular',
    label: 'Fully Deployed',
    description: 'Lifetime count of portals fully deployed (all resonator slots filled), updated over time.'
  },
  'glyph_hack_attempts.tsv': {
    shape: 'tabular',
    label: 'Glyph Hack Attempts',
    description: 'Lifetime count of glyph hack attempts, updated over time.'
  },
  'glyph_hack_points.tsv': {
    shape: 'tabular',
    label: 'Glyph Hack Points',
    description: 'Cumulative points earned from glyph hacking, updated over time.'
  },
  'glyph_the_planet.tsv': {
    shape: 'tabular',
    label: 'Glyph the Planet',
    description: "Progress toward the 'Glyph the Planet' medal, updated over time."
  },
  'hack_streaks_completed.tsv': {
    shape: 'tabular',
    label: 'Hack Streaks Completed',
    description: 'Lifetime count of hack streaks completed, updated over time.'
  },
  'hacks.tsv': {
    shape: 'tabular',
    label: 'Hacks',
    description: 'Lifetime count of portals hacked, updated over time.'
  },
  'inventory_item_recycled.tsv': {
    shape: 'tabular',
    label: 'Inventory Items Recycled',
    description: 'Lifetime count of inventory items recycled for XM, updated over time.'
  },
  'keys_hacked.tsv': {
    shape: 'tabular',
    label: 'Keys Hacked',
    description: 'Lifetime count of portal keys obtained via hacking, updated over time.'
  },
  'kilometers_walked.tsv': {
    shape: 'tabular',
    label: 'Kilometers Walked',
    description: 'Cumulative distance walked while playing, updated over time.'
  },
  'kilometers_walked_new.tsv': {
    shape: 'tabular',
    label: 'Kilometers Walked (New)',
    description: 'A newer/replacement tracker for cumulative distance walked, updated over time.'
  },
  'kinetic_capsules_completed.tsv': {
    shape: 'tabular',
    label: 'Kinetic Capsules Completed',
    description: 'Lifetime count of Kinetic Capsule challenges completed, updated over time.'
  },
  'kureze_effect_guids.tsv': {
    shape: 'tabular',
    label: 'Kureze Effect',
    description: "A log of participation during the 'Kureze' anomaly/storyline, over time."
  },
  'kythera_guids.tsv': {
    shape: 'tabular',
    label: 'Kythera',
    description: "A log of participation during the 'Kythera' anomaly/storyline, over time."
  },
  'link_held_days.tsv': {
    shape: 'tabular',
    label: 'Link Held Days',
    description: 'Cumulative link-days held, updated over time.'
  },
  'link_length_kilometers.tsv': {
    shape: 'tabular',
    label: 'Link Length (Kilometers)',
    description: 'Cumulative length of links created, in kilometers, updated over time.'
  },
  'link_length_kilometers_times_days_held.tsv': {
    shape: 'tabular',
    label: 'Link Length × Days Held',
    description: 'Cumulative link length multiplied by days held, updated over time.'
  },
  'links_active.tsv': {
    shape: 'tabular',
    label: 'Active Links',
    description: 'The current number of links you have active - a present-day snapshot.'
  },
  'links_created.tsv': {
    shape: 'tabular',
    label: 'Links Created',
    description: 'Lifetime count of links created, updated over time.'
  },
  'links_destroyed_corrected.tsv': {
    shape: 'tabular',
    label: 'Links Destroyed',
    description: 'Lifetime count of enemy links destroyed, updated over time.'
  },
  'machina_links_destroyed.tsv': {
    shape: 'tabular',
    label: 'Machina Links Destroyed',
    description: 'Lifetime count of Machina faction links destroyed, updated over time.'
  },
  'machina_portals_neutralized.tsv': {
    shape: 'tabular',
    label: 'Machina Portals Neutralized',
    description: 'Lifetime count of Machina faction portals neutralized, updated over time.'
  },
  'machina_portals_reclaimed_guids.tsv': {
    shape: 'tabular',
    label: 'Machina Portals Reclaimed',
    description: 'A log of portals reclaimed from the Machina faction, over time.'
  },
  'machina_resonators_destroyed.tsv': {
    shape: 'tabular',
    label: 'Machina Resonators Destroyed',
    description: 'Lifetime count of Machina faction resonators destroyed, updated over time.'
  },
  'matryoshka_links_created.tsv': {
    shape: 'tabular',
    label: 'Matryoshka Links Created',
    description: 'Links created as part of nested (Matryoshka) triangle fields, updated over time.'
  },
  'mind_units_controlled.tsv': {
    shape: 'tabular',
    label: 'Mind Units Controlled',
    description: 'Cumulative Mind Units (MU) controlled via fields, updated over time.'
  },
  'mind_units_controlled_active.tsv': {
    shape: 'tabular',
    label: 'Mind Units Controlled (Active)',
    description: 'The current number of Mind Units you control - a present-day snapshot.'
  },
  'mind_units_destroyed.tsv': {
    shape: 'tabular',
    label: 'Mind Units Destroyed',
    description: 'Cumulative enemy Mind Units destroyed, updated over time.'
  },
  'mind_units_times_days_held.tsv': {
    shape: 'tabular',
    label: 'Mind Units × Days Held',
    description: 'Cumulative Mind Units controlled multiplied by days held, updated over time.'
  },
  'mission_day_points.tsv': {
    shape: 'tabular',
    label: 'Mission Day Points',
    description: "Points earned during 'Mission Day' events, over time."
  },
  'missions_completed.tsv': {
    shape: 'tabular',
    label: 'Missions Completed',
    description: 'A log of missions completed, over time.'
  },
  'mods_deployed.tsv': {
    shape: 'tabular',
    label: 'Mods Deployed',
    description: 'Lifetime count of mods installed on portals, updated over time.'
  },
  'mods_destroyed.tsv': {
    shape: 'tabular',
    label: 'Mods Destroyed',
    description: 'Lifetime count of enemy mods destroyed, updated over time.'
  },
  'myriad_portal_hacks.tsv': {
    shape: 'tabular',
    label: 'Myriad Portal Hacks',
    description: "A log of hacks performed as part of the 'Myriad' feature/event, over time."
  },
  'nl1331_meetup_points.tsv': {
    shape: 'tabular',
    label: 'NL-1331 Meetup Points',
    description: "Points earned attending 'NL-1331' storyline meetup events, over time."
  },
  'ocf_events.tsv': {
    shape: 'tabular',
    label: 'OCF Events',
    description: "A log of participation in 'OCF' events, over time."
  },
  'operation_chronos_points.tsv': {
    shape: 'tabular',
    label: 'Operation Chronos Points',
    description: "Points earned during the 'Operation Chronos' event, updated over time."
  },
  'opr_agreements.tsv': {
    shape: 'tabular',
    label: 'OPR Agreements',
    description: 'A log of Wayfarer (OPR) review agreement outcomes, over time.'
  },
  'oprlive_events.tsv': {
    shape: 'tabular',
    label: 'OPR Live Events',
    description: 'A log of participation in live Wayfarer (OPR) review events, over time.'
  },
  'overclock_glyph_hack_points.tsv': {
    shape: 'tabular',
    label: 'Overclock Glyph Hack Points',
    description: "Points earned from glyph hacking during 'Overclock' bonus periods, updated over time."
  },
  'passcode_redeemed.tsv': {
    shape: 'tabular',
    label: 'Passcodes Redeemed',
    description: 'Lifetime count of passcodes (promo codes) redeemed, updated over time.'
  },
  'peace_week_points.tsv': {
    shape: 'tabular',
    label: 'Peace Week Points',
    description: "Points earned during the 'Peace Week' live event, updated over time."
  },
  'plus_alpha_anomaly_guids.tsv': {
    shape: 'tabular',
    label: 'Plus Alpha Anomaly',
    description: "A log of participation during the 'Plus Alpha' anomaly, over time."
  },
  'plus_alpha_global_op_pages.tsv': {
    shape: 'tabular',
    label: 'Plus Alpha Global Op Pages',
    description: "Story pages unlocked during the 'Plus Alpha' Global Operation, updated over time."
  },
  'plus_alpha_global_op_points.tsv': {
    shape: 'tabular',
    label: 'Plus Alpha Global Op Points',
    description: "Points earned during the 'Plus Alpha' Global Operation, updated over time."
  },
  'plus_beta_season_points.tsv': {
    shape: 'tabular',
    label: 'Plus Beta Season Points',
    description: "Points earned during the 'Plus Beta' seasonal storyline, updated over time."
  },
  'plus_delta_global_field_points.tsv': {
    shape: 'tabular',
    label: 'Plus Delta Global Field Points',
    description: "Field-creation points earned during the 'Plus Delta' Global Operation, updated over time."
  },
  'plus_delta_global_reso_points.tsv': {
    shape: 'tabular',
    label: 'Plus Delta Global Resonator Points',
    description: "Resonator-deployment points earned during the 'Plus Delta' Global Operation, updated over time."
  },
  'plus_delta_season_points.tsv': {
    shape: 'tabular',
    label: 'Plus Delta Season Points',
    description: "Points earned during the 'Plus Delta' seasonal storyline, updated over time."
  },
  'plus_gamma_season_points.tsv': {
    shape: 'tabular',
    label: 'Plus Gamma Season Points',
    description: "Points earned during the 'Plus Gamma' seasonal storyline, updated over time."
  },
  'plus_theta_season_points.tsv': {
    shape: 'tabular',
    label: 'Plus Theta Season Points',
    description: "Points earned during the 'Plus Theta' seasonal storyline, updated over time."
  },
  'portal_guids_captured.tsv': {
    shape: 'tabular',
    label: 'Portals Captured',
    description: 'A log of portals captured, over time (despite the filename, no real portal identifier is included - just a sequential count).'
  },
  'portal_guids_visited.tsv': {
    shape: 'tabular',
    label: 'Portals Visited',
    description: 'A log of portals visited, over time (despite the filename, no real portal identifier is included - just a sequential count).'
  },
  'portal_held_days.tsv': {
    shape: 'tabular',
    label: 'Portal Held Days',
    description: 'Cumulative portal-days held, updated over time.'
  },
  'portal_powerups_used.tsv': {
    shape: 'tabular',
    label: 'Portal Power-ups Used',
    description: 'A log of portal power-ups (e.g. Ultra Link, ADA/Jarvis) used, over time.'
  },
  'portals_approved.tsv': {
    shape: 'tabular',
    label: 'Portals Approved',
    description: 'A log of Wayfarer portal candidates approved, over time.'
  },
  'portals_approved_annex.tsv': {
    shape: 'tabular',
    label: 'Portals Approved (Annex)',
    description: 'A supplementary log of Wayfarer portal candidates approved, over time.'
  },
  'portals_neutralized.tsv': {
    shape: 'tabular',
    label: 'Portals Neutralized',
    description: 'A log of enemy portals neutralized, over time.'
  },
  'portals_owned.tsv': {
    shape: 'tabular',
    label: 'Portals Owned',
    description: 'The current number of portals you own - a present-day snapshot.'
  },
  'powercube_used.tsv': {
    shape: 'tabular',
    label: 'Power Cubes Used',
    description: 'Lifetime count of Power Cubes used to recharge, updated over time.'
  },
  'recursions.tsv': {
    shape: 'tabular',
    label: 'Recursions',
    description: 'Lifetime count of Recursions (agent rebirths after reaching max level), updated over time.'
  },
  'region_held_days.tsv': {
    shape: 'tabular',
    label: 'Region Held Days',
    description: 'Cumulative field-days held, updated over time.'
  },
  'regions_active.tsv': {
    shape: 'tabular',
    label: 'Active Regions',
    description: 'The current number of control fields (regions) you have active - a present-day snapshot.'
  },
  'regions_created.tsv': {
    shape: 'tabular',
    label: 'Regions Created',
    description: 'Lifetime count of control fields (regions) created, updated over time.'
  },
  'regions_destroyed_corrected.tsv': {
    shape: 'tabular',
    label: 'Regions Destroyed',
    description: 'Lifetime count of enemy control fields destroyed, updated over time.'
  },
  'resonators_destroyed.tsv': {
    shape: 'tabular',
    label: 'Resonators Destroyed',
    description: 'Lifetime count of enemy resonators destroyed, updated over time.'
  },
  'resonators_upgraded.tsv': {
    shape: 'tabular',
    label: 'Resonators Upgraded',
    description: 'Lifetime count of resonators upgraded, updated over time.'
  },
  'scout_controller_portal_guids.tsv': {
    shape: 'tabular',
    label: 'Scout Controller Portals',
    description: 'A log of portals interacted with via the Scout Controller drone feature, over time.'
  },
  'second_sunday_events.tsv': {
    shape: 'tabular',
    label: 'Second Sunday Events',
    description: "A log of participation in monthly 'Second Sunday' community events, over time."
  },
  'sentinel_portals_captured.tsv': {
    shape: 'tabular',
    label: 'Sentinel Portals Captured',
    description: "Portals captured and held toward the 'Sentinel' medal, updated over time."
  },
  'shared_memories_event_points.tsv': {
    shape: 'tabular',
    label: 'Shared Memories Event Points',
    description: "Points earned during the 'Shared Memories' live event, updated over time."
  },
  'summer_2022_xm_recharged.tsv': {
    shape: 'tabular',
    label: 'Summer 2022 XM Recharged',
    description: 'XM spent recharging resonators during the Summer 2022 seasonal event, updated over time.'
  },
  'superposition_guids.tsv': {
    shape: 'tabular',
    label: 'Superposition',
    description: "A log of participation during the 'Superposition' anomaly/storyline, over time."
  },
  'umbra_resonator_deployments.tsv': {
    shape: 'tabular',
    label: 'Umbra Resonator Deployments',
    description: "A log of resonator deployments during the 'Umbra' event, over time."
  },
  'xm_collected.tsv': {
    shape: 'tabular',
    label: 'XM Collected',
    description: 'Lifetime XM (Exotic Matter) collected from portals, updated over time.'
  },
  'xm_recharged.tsv': {
    shape: 'tabular',
    label: 'XM Recharged',
    description: 'Lifetime XM spent recharging resonators, updated over time.'
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

// The Player_Journey/ CSVs: one entry per in-game action type, each split into a
// variable number of numbered chunks (e.g. Add_Mod1.csv, Add_Mod2.csv - and possibly
// Add_Mod3.csv on a larger export than the one this catalog was built from). Matched by
// regex rather than exact filename so any chunk number is recognized, not just the ones
// that happened to exist in the sample export used to build this catalog.
export const PATTERN_MATCHES = [
  {
    pattern: /^add_mod\d+(_\d+)?\.csv$/,
    shape: 'tabular',
    label: 'Add Mod',
    description: 'GPS location recorded each time a mod was added to a deployed resonator.'
  },
  {
    pattern: /^add_powerup\d+(_\d+)?\.csv$/,
    shape: 'tabular',
    label: 'Add Power-up',
    description: 'GPS location recorded each time a power-up was applied to a resonator.'
  },
  {
    pattern: /^collect_items_or_glyphs_from_portal\d+(_\d+)?\.csv$/,
    shape: 'tabular',
    label: 'Collect Items or Glyphs from Portal',
    description: 'GPS location recorded each time items or glyph rewards were collected from a portal.'
  },
  {
    pattern: /^create_link\d+(_\d+)?\.csv$/,
    shape: 'tabular',
    label: 'Create Link',
    description: 'GPS location recorded each time a link was created.'
  },
  {
    pattern: /^deploy_resonator\d+(_\d+)?\.csv$/,
    shape: 'tabular',
    label: 'Deploy Resonator',
    description: 'GPS location recorded each time a resonator was deployed.'
  },
  {
    pattern: /^flip_portal\d+(_\d+)?\.csv$/,
    shape: 'tabular',
    label: 'Flip Portal',
    description: 'GPS location recorded each time a portal was flipped to the other faction.'
  },
  {
    pattern: /^player_logs_in\d+(_\d+)?\.csv$/,
    shape: 'tabular',
    label: 'Player Logs In',
    description: 'GPS location recorded each time you logged into the game.'
  },
  {
    pattern: /^query_nearby_vps_wayspots\d+(_\d+)?\.csv$/,
    shape: 'tabular',
    label: 'Query Nearby VPS Wayspots',
    description: 'GPS location and device info recorded each time the app queried nearby AR-enabled (VPS) Wayspots.'
  },
  {
    pattern: /^recharge_resonator\d+(_\d+)?\.csv$/,
    shape: 'tabular',
    label: 'Recharge Resonator',
    description: 'GPS location recorded each time a resonator was recharged.'
  },
  {
    pattern: /^record_ar_scan\d+(_\d+)?\.csv$/,
    shape: 'tabular',
    label: 'Record AR Scan',
    description: 'Device info recorded each time an AR scan was performed (no location included in this file).'
  },
  {
    pattern: /^start_or_end_ar_session\d+(_\d+)?\.csv$/,
    shape: 'tabular',
    label: 'Start or End AR Session',
    description: 'Device info recorded each time an AR session started or ended (no location included in this file).'
  },
  {
    pattern: /^upgrade_resonator\d+(_\d+)?\.csv$/,
    shape: 'tabular',
    label: 'Upgrade Resonator',
    description: 'GPS location recorded each time a resonator was upgraded.'
  },
  {
    pattern: /^use_vps\d+(_\d+)?\.csv$/,
    shape: 'tabular',
    label: 'Use VPS',
    description: 'GPS location and device info recorded each time AR/VPS positioning was used.'
  },
  {
    pattern: /^use_contextual_awareness\d+(_\d+)?\.csv$/,
    shape: 'tabular',
    label: 'Use Contextual Awareness',
    description: 'Device info recorded each time the contextual awareness AR feature was used (no location included in this file).'
  }
]

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
