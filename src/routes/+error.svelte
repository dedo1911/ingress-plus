<script>
  import { page } from '$app/stores';
</script>

<div>
  <h1>{$page.status}</h1>
  <p>{$page.error.message}</p>
</div>

<style>
  div {
    background: url('/onyx_error_badge.png') center no-repeat;
    background-size: contain;
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    align-content: center;
    height: 192px;
    margin: 1em auto;
  }
  h1, p {
    margin: 0.25em;
  }
</style>