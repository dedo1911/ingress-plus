import { pb } from '$lib/pocketbase'
import { ownedBadges } from '$lib/stores'

// Shared by anything that can change the signed-in Agent's owned badges
// (Header's login/mount, onboarding's badge award) so ownedBadges - and
// anything reading from it, like /agent - reflects the change without
// needing a full page reload.
export const refreshOwnedBadges = async () => ownedBadges.set(
  await pb.collection('user_badges').getFullList({
    expand: 'badge,badge.category',
    filter: `user="${pb.authStore.model.id}"`
  }))
