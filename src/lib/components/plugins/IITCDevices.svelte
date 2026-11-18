<script>
  import { onMount } from 'svelte'
  import Time from 'svelte-time'
  import { toast } from '@zerodevx/svelte-toast'
  import { resolve } from '$app/paths'
  import { pb } from '#lib/pocketbase/index.js'

  // The IITC sideloaders connected to this account. Revoking deletes the
  // token record; the device has to go through /iitc/connect again.
  let devices = $state([])
  let loading = $state(true)
  let revoking = $state(null)

  const load = async () => {
    loading = true
    try {
      devices = await pb.collection('iitc_tokens').getFullList({ sort: '-last_used_at', requestKey: null })
    } catch (err) {
      console.error('Could not load IITC devices:', err)
    } finally {
      loading = false
    }
  }

  const revoke = async (device) => {
    revoking = device.id
    try {
      await pb.collection('iitc_tokens').delete(device.id)
      devices = devices.filter(d => d.id !== device.id)
      toast.push(`Disconnected ${device.label}.`, { classes: ['successToast'] })
    } catch (err) {
      console.error(err)
      toast.push('Could not disconnect that device. Please try again later.', { classes: ['errorToast'] })
    } finally {
      revoking = null
    }
  }

  onMount(load)
</script>

<div class="card">
  <h3>IITC devices</h3>
  <p class="explanation">
    Browsers where the Ingress Plus sideloader is connected to your account.
    Disconnect any you don't recognise or no longer use.
  </p>
  {#if loading}
    <p class="explanation">Loading…</p>
  {:else if devices.length === 0}
    <p class="explanation">No devices connected. Install the sideloader from the <a href={resolve('/plugins')}>plugin store</a>.</p>
  {:else}
    <ul>
      {#each devices as device (device.id)}
        <li>
          <div>
            <b>{device.label}</b>
            <span>
              {#if device.last_used_at}Last used <Time relative timestamp={device.last_used_at} />{:else}Never used{/if}
            </span>
          </div>
          <button type="button" class="cta" disabled={revoking === device.id} onclick={() => revoke(device)}>
            {revoking === device.id ? 'Disconnecting…' : 'Disconnect'}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  div.card {
    display: flex;
    flex-direction: column;
    gap: 1em;
    text-align: left;
    padding: 1em;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
  }
  h3 {
    margin: 0;
    text-align: center;
    text-shadow: 0 0 10px black;
  }
  p.explanation {
    margin: 0;
    font-size: 0.85em;
    color: rgba(255, 255, 255, 0.6);
  }
  p.explanation a {
    text-decoration: underline;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5em;
  }
  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75em;
    padding: 0.5em;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
  }
  li div {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  li span {
    font-size: 0.85em;
    color: rgba(255, 255, 255, 0.6);
  }
  button.cta {
    white-space: nowrap;
  }
  button.cta:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
