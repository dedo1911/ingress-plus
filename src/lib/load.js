import { error } from '@sveltejs/kit'

// Shared tail for the +page.js load functions. PocketBase's
// ClientResponseError carries the upstream status, so a genuine 404 stays a
// 404 with the page's own wording, and a rule mismatch (403) or an outage
// shows as what it is, instead of every failure collapsing into one fixed
// status. A network failure reports status 0 and becomes a 502: the page is
// fine, the data source isn't.
export function throwLoadError (err, notFound = 'Not found') {
  console.error(err)
  if (err?.status === 404) error(404, notFound)
  error(err?.status >= 400 ? err.status : 502, 'Something went wrong loading this page. Please try again later.')
}
