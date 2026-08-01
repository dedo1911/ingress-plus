<script>
  import { onDestroy } from 'svelte'
  import { navigating } from '$app/state'
  import { isLoading } from '$lib/stores'

  // Wait a moment before showing: most PocketBase calls finish quickly and a
  // bar that flashes for 80ms reads as a glitch rather than as feedback.
  const SHOW_DELAY = 150
  // Once it is up, keep it up long enough to be seen instead of blinking out.
  const MIN_VISIBLE = 400

  let visible = $state(false)

  // Plain (non-reactive) bookkeeping: reading these inside the $effect below
  // would make it depend on its own writes.
  let shown = false
  let shownAt = 0
  let showTimer = null
  let hideTimer = null

  const busy = $derived($isLoading || navigating.to !== null)

  const clearTimers = () => {
    clearTimeout(showTimer)
    clearTimeout(hideTimer)
    showTimer = null
    hideTimer = null
  }

  $effect(() => {
    if (busy) {
      clearTimeout(hideTimer)
      hideTimer = null
      if (shown || showTimer) return
      showTimer = setTimeout(() => {
        showTimer = null
        shownAt = performance.now()
        shown = true
        visible = true
      }, SHOW_DELAY)
      return
    }

    clearTimeout(showTimer)
    showTimer = null
    if (!shown || hideTimer) return
    const remaining = Math.max(0, MIN_VISIBLE - (performance.now() - shownAt))
    hideTimer = setTimeout(() => {
      hideTimer = null
      shown = false
      visible = false
    }, remaining)
  })

  onDestroy(clearTimers)
</script>

{#if visible}
  <div class="loading-bar" aria-hidden="true"></div>
{/if}

<style>
  .loading-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    z-index: 9999;
    pointer-events: none;
    overflow: hidden;
    background: rgba(183, 74, 131, 0.2);
  }

  .loading-bar::after {
    content: '';
    display: block;
    height: 100%;
    width: 33%;
    background: linear-gradient(90deg,
      rgba(183, 74, 131, 0) 0%,
      rgba(183, 74, 131, 1) 50%,
      rgba(183, 74, 131, 0) 100%);
    box-shadow: 0 0 8px rgba(183, 74, 131, 0.8);
    transform: translateX(-100%);
    animation: loading-bar-slide 1.1s ease-in-out infinite;
  }

  @keyframes loading-bar-slide {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(400%); }
  }

  @media (prefers-reduced-motion: reduce) {
    .loading-bar::after {
      width: 100%;
      transform: none;
      animation: loading-bar-pulse 1.4s ease-in-out infinite;
    }

    @keyframes loading-bar-pulse {
      0%, 100% { opacity: 0.35; }
      50% { opacity: 1; }
    }
  }
</style>
