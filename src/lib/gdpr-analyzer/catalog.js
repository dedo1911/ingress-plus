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
    description: 'Represents the "Months Subscribed" statistic and counts the amount of months you have been subscribed to C.O.R.E.'
  },
  'wayfarer_player_data.json': {
    shape: 'json-wayfarer',
    label: 'Wayfarer/Recon Player Data',
    description: 'Portal review activity: submissions rated, assignments received, and reviewer profile.',
    privacy: ['own-email', 'location']
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
    description: 'Contains several files with times and locations of game actions. Unpack the archive and upload the files seperately to analyze them!',
    privacy: ['location']
  },
  'poi_submissions.tsv': {
    shape: 'tabular',
    label: 'Portal Submissions',
    timeColumn: 'Submission time (UTC)',
    description: 'Details of new Portal suggestions submitted for review.',
    privacy: ['location']
  },
  'poi_location_update_submissions.tsv': {
    shape: 'tabular',
    label: 'Portal Edit - Location',
    timeColumn: 'Submission time (UTC)',
    description: 'Date of Location edit, coordinates of new location as well as game used to submit.',
    privacy: ['location']
  },
  'poi_text_metadata_update_submission.tsv': {
    shape: 'tabular',
    label: 'Portal Edit - Title/Description',
    timeColumn: 'Submission time (UTC)',
    description: 'Date of new text edit, the new suggestion as well as game used to submit.'
  },
  'poi_image_submissions.tsv': {
    shape: 'tabular',
    label: 'Portal Edit - New Photo',
    timeColumn: 'Submission time (UTC)',
    description: 'Date of new photo submission as well as game used to submit.'
  },
  'poi_video_submissions.tsv': {
    shape: 'tabular',
    label: 'Portal Scans',
    timeColumn: 'Submission time (UTC)',
    description: 'Date of new Portal Scans as well as game used to submit and player level at time of submission.'
  },
  'poi_takedown_request_submissions.tsv': {
    shape: 'tabular',
    label: 'Reported Portals',
    timeColumn: 'Submission time (UTC)',
    description: 'Date of takedown requests as well as game used to submit.'
  },
  'agent_ops_completed.tsv': {
    shape: 'tabular',
    label: 'Daily Bounties Completed',
    description: 'Represents the "Research Days Completed" statistic and counts the amount of Daily Bounties you have completed.'
  },
  'all_portals_approved.tsv': {
    shape: 'tabular',
    label: 'Portals Approved',
    description: 'Represents the "Seer Points" statistic and counts the amount of your Portals that have been approved and went live in Ingress.'
  },
  'apex_mods_used.tsv': {
    shape: 'tabular',
    label: 'APEX used',
    description: 'Amount of APEX used.'
  },
  'ar_videos_uploaded.tsv': {
    shape: 'tabular',
    label: 'Portal Scans Uploaded',
    description: 'Represents the "Portal Scans Uploaded" statistic and counts the amount of Portal Scans uploaded.'
  },
  'aurora_glyph_hacks.tsv': {
    shape: 'tabular',
    label: 'Aurora Glyph Hack Challenge',
    description: 'A log of points gained during the original Aurora Glyph Hack Challenge.'
  },
  'beacon_battles.tsv': {
    shape: 'tabular',
    label: 'Battle Beacon Battles',
    description: 'Represents the "Battle Beacon Combatent" statistic and counts participation in Battle Beacon Battles.'
  },
  'buried_memories_anomaly_guids.tsv': {
    shape: 'tabular',
    label: 'Buried Memories Anomaly',
    description: '[UNCONFIRMED] Lists each Portal you have interacted with during an on-site Buried Memories Anomaly by incrementaly assigning them a number starting at 1. A Portal will be assigned the same number if it is visited again.'
  },
  'buried_memories_event_points.tsv': {
    shape: 'tabular',
    label: 'Buried Memories: Global Link and Field Op',
    description: "Points earned during the 'Buried Memories: Global Link and Field Op' event."
  },
  'cargo_amounts_applied.tsv': {
    shape: 'tabular',
    label: 'C.A.R.G.O. amounts purchased',
    description: 'Lists when you bought C.A.R.G.O. as well as the amount of extra Inventory space that was granted.'
  },
  'comic_sans_links_created.tsv': {
    shape: 'tabular',
    label: 'Comic Sans Link Challenge Links Created',
    description: 'Lists the amount of Links created as part of the Comic Sans Link Challenge Event.'
  },
  'completed_all_daily_quests.tsv': {
    shape: 'tabular',
    label: 'Daily Bounty Milestones Claimed',
    description: 'Represents the "Research Days Completed" statistic and counts all days in which you claimed the two Daily Bounty milestones.'
  },
  'courier_ap_gained.tsv': {
    shape: 'tabular',
    label: 'Courier Meet You Out There Challenge',
    description: 'AP earned during the "Courier Meet You Out There Challenge" event.'
  },
  'cryptic_memories_anomaly_guids.tsv': {
    shape: 'tabular',
    label: 'Cryptic Memories Anomaly',
    description: '[UNCONFIRMED] Lists each Portal you have interacted with during an on-site Cryptic Memories Anomaly by incrementaly assigning them a number starting at 1. A Portal will be assigned the same number if it is visited again.'
  },
  'cryptic_memories_points.tsv': {
    shape: 'tabular',
    label: 'Cryptic Memories Global Op',
    description: "Points earned during the 'Cryptic Memories Global Op' event."
  },
  'deploys.tsv': {
    shape: 'tabular',
    label: 'Resonators Deployed',
    description: 'Livetime count of Resonators deployed.'
  },
  'didact_controller_fields_created.tsv': {
    shape: 'tabular',
    label: 'Didact Field Challenge',
    description: "Points earned during the 'Didact Field Challenge' event."
  },
  'discoverie_anomaly_guids_2023.tsv': {
    shape: 'tabular',
    label: 'Discoverie Anomaly',
    description: '[UNCONFIRMED] Lists each Portal you have interacted with during an on-site Discoverie Anomaly by incrementaly assigning them a number starting at 1. A Portal will be assigned the same number if it is visited again..'
  },
  'discoverie_kinetic_capsules.tsv': {
    shape: 'tabular',
    label: 'Discoverie Kinetic Challenge',
    description: "Points earned during the 'Discoverie Kinetic Challenge' event."
  },
  'discoverie_reclaimed_guids.tsv': {
    shape: 'tabular',
    label: 'Discoverie Reclaimer Challenge',
    description: "Points earned during the 'Discoverie Reclaimer Challenge' event."
  },
  'drone_forced_recalls.tsv': {
    shape: 'tabular',
    label: 'Forced Drone Recalls',
    description: 'Represents the "Forced Drone Recalls" statistic and counts the amount of times your drone was returned to you by a Portal Allignment change.'
  },
  'drone_hack_portal_guids.tsv': {
    shape: 'tabular',
    label: 'Unique Portals Drone Hacked',
    description: 'Lists the Portals your Drone has hacked (not just visited) by incrementaly assigning them a number starting at 1. A Portal will be assigned the same number if hacked again.'
  },
  'drone_range_km.tsv': {
    shape: 'tabular',
    label: 'Drone Distance',
    description: 'Each entry lists the current linear distance from the first Portal the Drone was deployed on to the one it has just been sent to.'
  },
  'drone_visited_portal_guid.tsv': {
    shape: 'tabular',
    label: 'nique Portals Drone Visited',
    description: 'Represents the "Unique Portals Drone Visited" statistic and lists the Portals your Drone has visited by incrementaly assigning them a number starting at 1. A Portal will be assigned the same number if it is visited again.'
  },
  'drones_sent_home.tsv': {
    shape: 'tabular',
    label: 'Drones Returned',
    description: 'Represents the "Drones Returned" statistic and lists the count of Drones that got recalled due to a Portal Allignment change caused by you (Capture, Destroy, Flip).'
  },
  'echo_anomaly_guids_2023.tsv': {
    shape: 'tabular',
    label: 'Echo Anomaly',
    description: '[UNCONFIRMED] Lists each Portal you have interacted with during an on-site Echo Anomaly by incrementaly assigning them a number starting at 1. A Portal will be assigned the same number if it is visited again.'
  },
  'eos_imprint_points.tsv': {
    shape: 'tabular',
    label: 'EOS Imprint Points',
    description: "'Pure' points earned during the 'EOS Imprint' event, without counting the retroactive 25% bonus to RES Agents for winning the Kythera Anomaly."
  },
  'eos_imprint_points_enl.tsv': {
    shape: 'tabular',
    label: 'EOS Imprint Points (Enlightened)',
    description: "Final point count taken into account during the 'EOS Imprint' event if you were an ENL Agent."
  },
  'eos_imprint_points_res.tsv': {
    shape: 'tabular',
    label: 'EOS Imprint Points (Resistance)',
    description: "Final point count taken into account during the 'EOS Imprint' event if you were a RES Agent."
  },
  'epiphany_dawn_guids.tsv': {
    shape: 'tabular',
    label: 'Epiphany Dawn Anomaly',
    description: '[UNCONFIRMED] Lists each Portal you have interacted with during an on-site Epiphany Dawn Anomaly by incrementaly assigning them a number starting at 1. A Portal will be assigned the same number if it is visited again'
  },
  'erased_memories_anomaly_guids.tsv': {
    shape: 'tabular',
    label: 'Erased Memories Anomaly',
    description: '[UNCONFIRMED] Lists each Portal you have interacted with during an on-site Erased Memories Anomaly by incrementaly assigning them a number starting at 1. A Portal will be assigned the same number if it is visited again'
  },
  'erased_memories_global_op_points.tsv': {
    shape: 'tabular',
    label: 'Erased Memories Global Op Points',
    description: "Points earned during the 'Erased Memories' Global Operation, updated over time."
  },
  'event_alpha.tsv': {
    shape: 'tabular',
    label: 'Event Alpha',
    description: '[UNKNOWN]'
  },
  'event_bravo.tsv': {
    shape: 'tabular',
    label: 'Event Bravo',
    description: '[UNKNOWN]'
  },
  'event_charlie.tsv': {
    shape: 'tabular',
    label: 'Event Charlie',
    description: '[UNKNOWN]'
  },
  'event_delta.tsv': {
    shape: 'tabular',
    label: 'Event Delta',
    description: '[UNKNOWN]'
  },
  'event_echo.tsv': {
    shape: 'tabular',
    label: 'Event Echo',
    description: '[UNKNOWN]'
  },
  'event_foxtrot.tsv': {
    shape: 'tabular',
    label: 'Event Foxtrot',
    description: '[UNKNOWN]'
  },
  'event_golf.tsv': {
    shape: 'tabular',
    label: 'Event Golf',
    description: '[UNKNOWN]'
  },
  'event_india.tsv': {
    shape: 'tabular',
    label: 'Event India',
    description: '[UNKNOWN]'
  },
  'event_juliet.tsv': {
    shape: 'tabular',
    label: 'Event Juliet',
    description: '[UNKNOWN]'
  },
  'event_kilo.tsv': {
    shape: 'tabular',
    label: 'Event Kilo',
    description: '[UNKNOWN]'
  },
  'event_kinetic_capsules_completed.tsv': {
    shape: 'tabular',
    label: 'Optima Kinetic Challenge',
    description: 'Points earned during the "Optima Kinetic Challenge" event.'
  },
  'event_mike.tsv': {
    shape: 'tabular',
    label: 'Event Mike',
    description: '[UNKNOWN]'
  },
  'event_november.tsv': {
    shape: 'tabular',
    label: 'Event November',
    description: '[UNKNOWN]'
  },
  'event_oscar.tsv': {
    shape: 'tabular',
    label: 'Event Oscar',
    description: '[UNKNOWN]'
  },
  'event_papa.tsv': {
    shape: 'tabular',
    label: 'Event Papa',
    description: '[UNKNOWN]'
  },
  'event_portal_guids_hacked.tsv': {
    shape: 'tabular',
    label: 'Event Portal Hacks',
    description: '[UNKNOWN]'
  },
  'field_test_dispatch_points.tsv': {
    shape: 'tabular',
    label: 'Field Test: Dispatch',
    description: "Assignments completed during the 'Field Test: Dispatch' Campaign."
  },
  'first_saturday_events.tsv': {
    shape: 'tabular',
    label: 'First Saturday Events',
    description: "Represents the 'First Saturday Events' statistic and counts the amount of First Saturday Events you have intended."
  },
  'flip_cards_used.tsv': {
    shape: 'tabular',
    label: 'Flip Cards Used',
    description: 'Lifetime count of Portal Flip Cards used.'
  },
  'free_skus_purchased.tsv': {
    shape: 'tabular',
    label: 'Free Items Claimed',
    description: 'Lifetime count of free in-app items claimed.'
  },
  'fully_deployed.tsv': {
    shape: 'tabular',
    label: 'Fully Deployed',
    description: 'Lifetime count of Portals fully deployed (last resonator slots filled).'
  },
  'glyph_hack_attempts.tsv': {
    shape: 'tabular',
    label: 'Glyph Hack Attempts',
    description: 'Lifetime count of glyph hack attempts.'
  },
  'glyph_hack_points.tsv': {
    shape: 'tabular',
    label: 'Glyph Hack Points',
    description: 'Represents the "Glyph Hack Points" statistic and counts points earned from Glyph Hacking.'
  },
  'glyph_the_planet.tsv': {
    shape: 'tabular',
    label: 'Glyph the Planet',
    description: "Amount of Glyph Hack Points earned during the 'Glyph the Planet' Event."
  },
  'hack_streaks_completed.tsv': {
    shape: 'tabular',
    label: 'Completed Hackstreaks',
    description: 'Represents the "Completed Hackstreaks" statistic and counts the amount of 7-Day Hackstreaks you have completed.'
  },
  'hacks.tsv': {
    shape: 'tabular',
    label: 'Hacks',
    description: 'Represents the "Hacks" statistic and counts the amount of Portals hacked.'
  },
  'inventory_item_recycled.tsv': {
    shape: 'tabular',
    label: 'Inventory Items Recycled',
    description: 'Lifetime count of inventory items recycled.'
  },
  'keys_hacked.tsv': {
    shape: 'tabular',
    label: 'Keys Hacked',
    description: 'Lifetime count of Portal Keys obtained via hacking.'
  },
  'kilometers_walked.tsv': {
    shape: 'tabular',
    label: 'Distance Walked',
    description: 'Represents the "Distance Walked" statistic and counts the amount of distance walked.'
  },
  'kilometers_walked_new.tsv': {
    shape: 'tabular',
    label: 'Distance Walked (New)',
    description: 'Counts the Distance Walked from around 2020 when the Distance calculation was updated to more closely match the one from Pokemon GO.'
  },
  'kinetic_capsules_completed.tsv': {
    shape: 'tabular',
    label: 'Kinetic Capsules Completed',
    description: 'Represents the "Kinetic Capsules Completed" statistic and counts the amount of Kinetic Capsules that have been claimed.'
  },
  'kureze_effect_guids.tsv': {
    shape: 'tabular',
    label: 'Kureze Effect',
    description: '[UNCONFIRMED] Lists each Portal you have interacted with during an on-site Kureze Effect Anomaly by incrementaly assigning them a number starting at 1. A Portal will be assigned the same number if it is visited again'
  },
  'kythera_guids.tsv': {
    shape: 'tabular',
    label: 'Kythera',
    description: '[UNCONFIRMED] Lists each Portal you have interacted with during an on-site Kythera Anomaly by incrementaly assigning them a number starting at 1. A Portal will be assigned the same number if it is visited again'
  },
  'link_held_days.tsv': {
    shape: 'tabular',
    label: 'Time of Link Maintained',
    description: '[SPECULATIVE] Each Entry lists the final age of a Link as it was destroyed. The highest number in the list is used for the "Max Time Link Maintained" statistic.'
  },
  'link_length_kilometers.tsv': {
    shape: 'tabular',
    label: 'Link Lengths',
    description: '[SPECULATIVE] Each Entry lists the length of a Link as it was created. The highest number in the list is used for the "Longest Link Ever Created" statistic.'
  },
  'link_length_kilometers_times_days_held.tsv': {
    shape: 'tabular',
    label: 'Link Length × Days Held',
    description: '[SPECULATIVE] Each Entry lists the length of a Link as it was created multiplied by the final age of a Link as it was destroyed. The highest number in the list is used for the "Max Link Kength x Days" statistic.'
  },
  'links_active.tsv': {
    shape: 'tabular',
    label: 'Active Links',
    description: 'The current number of links you had active during the point your GDPR export was created.'
  },
  'links_created.tsv': {
    shape: 'tabular',
    label: 'Links Created',
    description: 'Represents the "Links Created" statistic and counts the amount of Links you have created.'
  },
  'links_destroyed_corrected.tsv': {
    shape: 'tabular',
    label: 'Links Destroyed',
    description: 'Represents the "Enemy Links Destroyed" statistic and counts the amount of Links you have destroyed.'
  },
  'machina_links_destroyed.tsv': {
    shape: 'tabular',
    label: 'Machina Links Destroyed',
    description: 'Represents the "Machina Links Destroyed" statistic and counts the amount of Machina Links you have destroyed.'
  },
  'machina_portals_neutralized.tsv': {
    shape: 'tabular',
    label: 'Machina Portals Neutralized',
    description: 'Represents the "Machina Portals Neutralized" statistic and counts the amount of Machina Portals you have destroyed.'
  },
  'machina_portals_reclaimed_guids.tsv': {
    shape: 'tabular',
    label: 'Machina Portals Reclaimed',
    description: 'Represents the "Machina Portals Reclaimed" statistic and lists each Portal you have reclaimed from Machina by incrementaly assigning them a number starting at 1. A Portal will be assigned the same number if it is reclaimed again.'
  },
  'machina_resonators_destroyed.tsv': {
    shape: 'tabular',
    label: 'Machina Resonators Destroyed',
    description: 'Represents the "Machina Resonators Destroyed" statistic and counts the amount of Machina Resonators you have destroyed.'
  },
  'matryoshka_links_created.tsv': {
    shape: 'tabular',
    label: 'Matryoshka Links Created',
    description: 'Links created as part of the Matryoshka Event.'
  },
  'mind_units_controlled.tsv': {
    shape: 'tabular',
    label: 'Mind Units Captured',
    description: 'Lists the amount of MU captured per field when created.'
  },
  'mind_units_controlled_active.tsv': {
    shape: 'tabular',
    label: 'Mind Units Controlled (Active)',
    description: 'The current number of MU you had active during the point your GDPR export was created.'
  },
  'mind_units_destroyed.tsv': {
    shape: 'tabular',
    label: 'Mind Units Destroyed',
    description: 'Counts the amount of MU that you have liberated by destroying Enemy Fields.'
  },
  'mind_units_times_days_held.tsv': {
    shape: 'tabular',
    label: 'Mind Units × Days Held',
    description: '[SPECULATIVE] Each Entry lists the MU of a Field as it was created multiplied by the final age of a Field as it was destroyed. The highest number in the list is used for the "Largest Field MUs x Days" statistic.'
  },
  'mission_day_points.tsv': {
    shape: 'tabular',
    label: 'Mission Days Attended',
    description: "Represents the 'Mission Day(s) Attended' statistic and counts the amount of Mission Days you have attended and completed."
  },
  'missions_completed.tsv': {
    shape: 'tabular',
    label: 'Unique Missions Completed',
    description: 'Lists each Mission you have completed by incrementaly assigning them a number starting at 1. A Mission will be assigned the same number if it is completed again.'
  },
  'mods_deployed.tsv': {
    shape: 'tabular',
    label: 'Mods Deployed',
    description: 'Represents the "Mods Deployed" statistic and counts the amount of Mods you have deployed.'
  },
  'mods_destroyed.tsv': {
    shape: 'tabular',
    label: 'Mods Destroyed',
    description: 'Counts the amount of Mods you have destroyed.'
  },
  'myriad_portal_hacks.tsv': {
    shape: 'tabular',
    label: 'Myriad Hack Challenge',
    description: 'Lists each Portal you have hacked during the Myriad Hack Challenge by incrementaly assigning them a number starting at 1. A Portal will be assigned the same number if it is hacked again.'
  },
  'nl1331_meetup_points.tsv': {
    shape: 'tabular',
    label: 'NL-1331 Meetups Attended',
    description: "Represents the 'NL-1331 Meetups Attended' statistic and counts the amount of NL-1331 Events you have attended."
  },
  'ocf_events.tsv': {
    shape: 'tabular',
    label: 'Operation Clear Field Events',
    description: "Represents the 'Clear Fields Events' statistic and counts the amount of OCF Events you have attended."
  },
  'operation_chronos_points.tsv': {
    shape: 'tabular',
    label: 'Operation Chronos',
    description: "Points earned during the 'Operation Chronos' event."
  },
  'opr_agreements.tsv': {
    shape: 'tabular',
    label: 'OPR Agreements',
    description: 'Represents the "OPR Agreements" statistic and counts the amount of Agreements you gained during OPR/Wayfarer.'
  },
  'oprlive_events.tsv': {
    shape: 'tabular',
    label: 'OPR Live Events',
    description: "Represents the 'OPR Live Events' statistic and counts the amount of OPR Live Events you have attended."
  },
  'overclock_glyph_hack_points.tsv': {
    shape: 'tabular',
    label: 'Overclock Hack Points',
    description: "Represents the 'Overclock Hack Points' statistic and counts the amount of Overclock Glyph Hack points you have gained through completed Overclock hacks."
  },
  'passcode_redeemed.tsv': {
    shape: 'tabular',
    label: 'Passcodes Redeemed',
    description: 'Lifetime count of passcodes redeemed.'
  },
  'peace_week_points.tsv': {
    shape: 'tabular',
    label: 'Peace Week',
    description: "Points earned during the 'Peace Week' live event. ENL Agents gained 1 Point per Links, RES Agents gained 1.25 Points per Link."
  },
  'plus_alpha_anomaly_guids.tsv': {
    shape: 'tabular',
    label: '+Alpha',
    description: '[UNCONFIRMED] Lists each Portal you have interacted with during an on-site +Alpha Anomaly by incrementaly assigning them a number starting at 1. A Portal will be assigned the same number if it is visited again'
  },
  'plus_alpha_global_op_pages.tsv': {
    shape: 'tabular',
    label: '+Alpha Global Op',
    description: "Assignments completed during the '+Alpha Global Op' Campaign."
  },
  'plus_alpha_global_op_points.tsv': {
    shape: 'tabular',
    label: '+Alpha Global Op Points',
    description: "Poins earned during the '+Alpha Global Op' event."
  },
  'plus_beta_season_points.tsv': {
    shape: 'tabular',
    label: '+Beta Tokens',
    description: 'Counts the +Beta Tokens earned during the +Beta Anomaly Season.'
  },
  'plus_delta_global_field_points.tsv': {
    shape: 'tabular',
    label: '+Delta Field Points',
    description: 'Counts the +Delta Field Points earned during the +Delta Field Campaign.'
  },
  'plus_delta_global_reso_points.tsv': {
    shape: 'tabular',
    label: '+Delta Reso Points',
    description: 'Counts the +Delta Reso Points earned during the +Delta Reso Campaign.'
  },
  'plus_delta_season_points.tsv': {
    shape: 'tabular',
    label: '+Delta Tokens',
    description: 'Counts the +Delta Tokens earned during the +Delta Anomaly Season.'
  },
  'plus_gamma_season_points.tsv': {
    shape: 'tabular',
    label: '+Gamma Tokens',
    description: '[UNCONFIRMED] Counts the +Gamma Tokens earned during the +Delta Anomaly Season.'
  },
  'plus_theta_season_points.tsv': {
    shape: 'tabular',
    label: '+Theta Tokens',
    description: 'Counts the +Theta Tokens earned during the +Delta Anomaly Season.'
  },
  'portal_guids_captured.tsv': {
    shape: 'tabular',
    label: 'Portals Captured',
    description: 'Logs each Portal captured and assigns it an ID incrementing by 1 for each unique Portal. If you capture a Portal that you have already captured the same ID will be logged again.'
  },
  'portal_guids_visited.tsv': {
    shape: 'tabular',
    label: 'Portals Visited',
    description: 'Logs each Portal Visited and assigns it an ID incrementing by 1 for each unique Portal. If you visit a Portal that you have already visited the same ID will be logged again.'
  },
  'portal_held_days.tsv': {
    shape: 'tabular',
    label: 'Portal Held Days',
    description: '[UNCONFIRMED] Logs how long ago a Portal you have captured is at the moment it is destroyed.'
  },
  'portal_powerups_used.tsv': {
    shape: 'tabular',
    label: 'Portal Power-Ups Used',
    description: 'Logs each Portal you have used a Power Up on and assigns it an ID incrementing by 1 for each unique Portal. If you deploy a Power Up on a Portal on which you have already deployed one the same ID will be logged again.'
  },
  'portals_approved.tsv': {
    shape: 'tabular',
    label: 'Portals Approved',
    description: 'Counts the amount of Portals that have been approved and gone live in Ingress during a short time frame in March 2022. Small chunk of data that is missing from the main list in portals_approved_annex.tsv.'
  },
  'portals_approved_annex.tsv': {
    shape: 'tabular',
    label: 'Portals Approved',
    description: 'Counts the amount of Portals that have been approved and gone live in Ingress. Is missing a small chunk of data of March 2022 which can be found in portals_approved.tsv.'
  },
  'portals_neutralized.tsv': {
    shape: 'tabular',
    label: 'Portals Neutralized',
    description: 'Logs each Portal you have neutralized and assigns it an ID incrementing by 1 for each unique Portal. If you neutralize a Portal which has already been neutralized by you before the same ID will be logged again.'
  },
  'portals_owned.tsv': {
    shape: 'tabular',
    label: 'Portals Owned',
    description: 'The current number of Portals you owned during the point your GDPR export was created.'
  },
  'powercube_used.tsv': {
    shape: 'tabular',
    label: 'Power Cubes Used',
    description: 'Lists when a Power Cube has been used. [UNCONFIRMED: Excluding Hypercubes?]'
  },
  'recursions.tsv': {
    shape: 'tabular',
    label: 'Recursions',
    description: 'Lists the date and time of each of your Recursions.'
  },
  'region_held_days.tsv': {
    shape: 'tabular',
    label: 'Field Held Days',
    description: '[UNCONFIRMED] Lists the age of each of your Fields at the moment it was destroyed.'
  },
  'regions_active.tsv': {
    shape: 'tabular',
    label: 'Active Fields',
    description: 'The current number of Fields you owned during the point your GDPR export was created.'
  },
  'regions_created.tsv': {
    shape: 'tabular',
    label: 'Fields Created',
    description: 'Lifetime count of Fields created.'
  },
  'regions_destroyed_corrected.tsv': {
    shape: 'tabular',
    label: 'Fields Destroyed',
    description: 'Lifetime count of enemy Fields destroyed.'
  },
  'resonators_destroyed.tsv': {
    shape: 'tabular',
    label: 'Resonators Destroyed',
    description: 'Lifetime count of enemy Resonators destroyed.'
  },
  'resonators_upgraded.tsv': {
    shape: 'tabular',
    label: 'Resonators Upgraded',
    description: 'Lifetime count of resonators Upgraded, updated over time.'
  },
  'scout_controller_portal_guids.tsv': {
    shape: 'tabular',
    label: 'Scout Controlled Portals',
    description: 'Logs each Portal you have Scout Controlled and assigns it an ID incrementing by 1 for each unique Portal. If you regain Scout Controller on a Portal on which you had already gained it once before the same ID will be logged again.'
  },
  'second_sunday_events.tsv': {
    shape: 'tabular',
    label: 'Second Sunday Events',
    description: 'Counts the amount of Second Sunday Events you have completed.'
  },
  'sentinel_portals_captured.tsv': {
    shape: 'tabular',
    label: 'Operation Sentinel Captures',
    description: 'Counts Portals captured during the Operation Sentinel event.'
  },
  'shared_memories_event_points.tsv': {
    shape: 'tabular',
    label: 'Shared Memories Global Shared Link Challenge',
    description: 'Counts the amount of Points gained during the Shared Memories Global Shared Link Challenge.'
  },
  'summer_2022_xm_recharged.tsv': {
    shape: 'tabular',
    label: 'Summer Solstice Event',
    description: 'Counts the XM spent recharging resonators during the Summer Solstice 2022 event.'
  },
  'superposition_guids.tsv': {
    shape: 'tabular',
    label: 'Superposition',
    description: '[UNCONFIRMED] Lists each Portal you have interacted with during an on-site Superposition Anomaly by incrementaly assigning them a number starting at 1. A Portal will be assigned the same number if it is visited again'
  },
  'umbra_resonator_deployments.tsv': {
    shape: 'tabular',
    label: 'Umbra Global Challenge',
    description: 'Logs each Resonator Slot you have deployed to during the Umbra Global Challenge and assigns it an ID incrementing by 1 for each unique Slot. If you deploy in a Resonator Slot on which you had already deployed the same ID will be logged again.'
  },
  'xm_collected.tsv': {
    shape: 'tabular',
    label: 'XM Collected',
    description: 'Logs each instance of XM collected, together with its amount.'
  },
  'xm_recharged.tsv': {
    shape: 'tabular',
    label: 'XM Recharged',
    description: 'Logs each instance of XM recharged, together with its amount.'
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
    label: 'Mods Deployed',
    description: 'GPS location of Portals you have deployed a Mod on.',
    privacy: ['location']
  },
  {
    pattern: /^add_powerup\d+(_\d+)?\.csv$/,
    shape: 'tabular',
    label: 'Add Power-up',
    description: 'GPS location of Portals you have deployed a Portal Powerup on.',
    privacy: ['location']
  },
  {
    pattern: /^collect_items_or_glyphs_from_portal\d+(_\d+)?\.csv$/,
    shape: 'tabular',
    label: 'Collect Items or Glyphs from Portal',
    description: 'GPS location of Portals you have hacked.',
    privacy: ['location']
  },
  {
    pattern: /^create_link\d+(_\d+)?\.csv$/,
    shape: 'tabular',
    label: 'Create Link',
    description: 'GPS location of Portals you have created a link from.',
    privacy: ['location']
  },
  {
    pattern: /^deploy_resonator\d+(_\d+)?\.csv$/,
    shape: 'tabular',
    label: 'Deploy Resonator',
    description: 'GPS location of Portals you have deployed a Resonator on.',
    privacy: ['location']
  },
  {
    pattern: /^flip_portal\d+(_\d+)?\.csv$/,
    shape: 'tabular',
    label: 'Flip Portal',
    description: 'GPS location of Portals you have deployed a Flipcard on.',
    privacy: ['location']
  },
  {
    pattern: /^player_logs_in\d+(_\d+)?\.csv$/,
    shape: 'tabular',
    label: 'Player Logs In',
    description: 'GPS location recorded each time you logged into the game.',
    privacy: ['location']
  },
  {
    pattern: /^query_nearby_vps_wayspots\d+(_\d+)?\.csv$/,
    shape: 'tabular',
    label: 'Query Nearby VPS Wayspots',
    description: 'GPS location and device info recorded each time the app queried nearby VPS Wayspots. [UNCONFIRMED: Location is location of Portals you activate Overclock from?]',
    privacy: ['location', 'device-info']
  },
  {
    pattern: /^recharge_resonator\d+(_\d+)?\.csv$/,
    shape: 'tabular',
    label: 'Recharge Resonator',
    description: 'GPS location of Portals you have recharged.',
    privacy: ['location']
  },
  {
    pattern: /^record_ar_scan\d+(_\d+)?\.csv$/,
    shape: 'tabular',
    label: 'Record AR Scan',
    description: 'Device info recorded each time a Portal Scan was started/uploaded.',
    privacy: ['device-info']
  },
  {
    pattern: /^start_or_end_ar_session\d+(_\d+)?\.csv$/,
    shape: 'tabular',
    label: 'Start or End AR Session',
    description: '[UNKNOWN, likely when Overclock hacks were started or stopped?]',
    privacy: ['device-info']
  },
  {
    pattern: /^upgrade_resonator\d+(_\d+)?\.csv$/,
    shape: 'tabular',
    label: 'Upgrade Resonator',
    description: 'GPS location of Portals you have upgraded Resonators on.',
    privacy: ['location']
  },
  {
    pattern: /^use_vps\d+(_\d+)?\.csv$/,
    shape: 'tabular',
    label: 'Use VPS',
    description: 'GPS location of Portals and device info recorded each time VPS positioning was used for Overclock.',
    privacy: ['location', 'device-info']
  },
  {
    pattern: /^use_contextual_awareness\d+(_\d+)?\.csv$/,
    shape: 'tabular',
    label: 'Use Contextual Awareness',
    description: 'Device info recorded each time the "contextual awareness" AR feature was used [UNCONFORMED, likey means when Portal Scans used Portal Meshing]..',
    privacy: ['device-info']
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
