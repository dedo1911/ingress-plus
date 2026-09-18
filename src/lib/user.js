import { pb } from '$lib/pocketbase'
import { authData } from '$lib/stores'

// Update the signed-in Agent's own users record.
//
// Always sends the full current record with the patch overlaid: the users
// collection's updateRule compares @request.body.<field> against the
// record's own value (e.g. "@request.body.supporter = false ||
// (@request.body.supporter = true && supporter = true)"), and PocketBase
// resolves a field missing from the body as empty rather than "unchanged" -
// so a partial body fails the rule and the request 404s.
//
// Nothing is changed locally until the server confirms: the SDK swaps
// authStore.record for the response, and re-publishing authData is what makes
// every $authData.baseModel reader pick it up. Callers therefore need no
// rollback on failure.
export const updateOwnUser = async (patch) => {
  const record = pb.authStore.record
  const updated = await pb.collection('users').update(record.id, { ...record, ...patch })
  authData.set(pb.authStore)
  return updated
}

// PocketBase's own validation messages mean little to an Agent, so the
// username rules get the site's wording. Shared by /agent/settings and
// /onboarding, keyed on the validation code PocketBase returns.
const USERNAME_ERRORS = {
  validation_not_unique: 'The username is already taken. Please choose a different username.',
  validation_required: 'Username cannot be blank.',
  validation_min_text_constraint: 'The username is too short. It needs to be at least 3 characters long.',
  validation_max_text_constraint: 'The username is too long. It needs to be 15 characters or less.',
  validation_invalid_format: 'The username contains characters that are not allowed. You can only use letters or numbers.'
}

export const usernameErrorMessage = (err, fallback) =>
  USERNAME_ERRORS[err?.response?.data?.username?.code] || fallback
