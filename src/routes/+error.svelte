<script>
  import { page } from '$app/stores'
  import { goto } from '$app/navigation'
  import { resolve } from '$app/paths'
  import { authData } from '$lib/stores'

  // A private profile is absent from the public_users view, so /agent/<name>
  // 404s even for its owner. The load runs without a session (SSR, and the
  // hydrated error is never re-run), so the owner is recognised here instead.
  $effect(() => {
    const own = $authData.baseModel?.username
    if ($page.status === 404 && own && $page.params.username?.toLowerCase() === own.toLowerCase()) {
      goto(resolve('/agent'), { replaceState: true })
    }
  })
</script>

<div>
  <h1>{$page.status}</h1>
  <p>{$page.error.message}</p>
</div>

<style>
  div {
    background: url('/images/onyx_error_badge.png') center no-repeat;
    background-size: contain;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    align-content: center;
    height: 192px;
    min-width: 192px;
    margin: 1em auto;
  }
  h1, p {
    margin: 0.25em;
  }
</style>
