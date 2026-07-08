<script>
  import Callout from '$lib/components/Callout.svelte'

  const ISSUE_URL = 'https://github.com/dedo1911/ingress-plus/issues/new?template=cmu-calculator---suggest-currency.md'

  const { data } = $props()
  const { currencies, packsByCurrency } = data

  const currencyByCode = $derived(new Map(currencies.map(c => [c.code, c])))

  let selectedCurrency = $state(currencies[0]?.code ?? '')
  let selectedPlatform = $state('ios')

  const hasAnyPacks = $derived(!!packsByCurrency[selectedCurrency])

  // If a currency only has one platform's data, or both platforms have identical
  // pricing, there's nothing meaningful to choose between - skip the picker.
  const iosPacks = $derived(packsByCurrency[selectedCurrency]?.ios)
  const androidPacks = $derived(packsByCurrency[selectedCurrency]?.android)
  const bothAvailable = $derived(!!iosPacks && !!androidPacks)
  const platformsIdentical = $derived(bothAvailable && JSON.stringify(iosPacks) === JSON.stringify(androidPacks))
  const showPlatformSelector = $derived(bothAvailable && !platformsIdentical)
  const onlyOnePlatform = $derived(hasAnyPacks && !bothAvailable)

  // Keep selectedPlatform valid whenever the available platforms change - e.g. after
  // switching to a currency that only has one platform's data, selectedPlatform might
  // point at a platform that no longer has anything to show.
  $effect(() => {
    const available = packsByCurrency[selectedCurrency] ?? {}
    if (!available[selectedPlatform]) {
      selectedPlatform = available.ios ? 'ios' : (available.android ? 'android' : selectedPlatform)
    }
  })

  const selectedPacks = $derived(packsByCurrency[selectedCurrency]?.[selectedPlatform] ?? [])
  const incompleteData = $derived(selectedPacks.some(p => p.price == null))

  const formatPrice = (price, code) => {
    const config = currencyByCode.get(code) ?? {}
    const { symbol, symbol_after: symbolAfter, locale } = config
    const options = { minimumFractionDigits: 2, maximumFractionDigits: 2 }

    let formatted
    try {
      formatted = price.toLocaleString(locale || undefined, options)
    } catch {
      // Missing or unresolvable locale (e.g. "en_US" instead of "en-US") - fall back
      // to the user's own locale instead of throwing.
      formatted = price.toLocaleString(undefined, options)
    }

    if (!symbol) return formatted
    return symbolAfter ? `${formatted} ${symbol}` : `${symbol}${formatted}`
  }

  // CMU amounts are formatted using the visitor's own locale, never the currency's -
  // it's a plain quantity, not a monetary value tied to a specific region.
  const formatCmu = cmu => cmu.toLocaleString()

  let inputCmu = $state('')
  const parsedCmu = $derived(Number(inputCmu))
  const hasValidCmu = $derived(inputCmu !== '' && Number.isFinite(parsedCmu) && parsedCmu > 0)

  const effectiveCostList = $derived(
    hasValidCmu
      ? selectedPacks
        .filter(pack => pack.price != null)
        .map(pack => ({
          ...pack,
          effectiveCost: Math.round((pack.price / pack.cmu) * parsedCmu * 100) / 100
        }))
      : []
  )
</script>

<svelte:head>
  <title>Ingress Plus &middot; CMU Calculator</title>
</svelte:head>

{#snippet cmuAmount(cmu)}
  <img src="/images/tools/cmu_calc/cmu.png" alt="" class="cmu-icon" />{formatCmu(cmu)}
{/snippet}

<div class="container">
  <h1>CMU Calculator</h1>

  <p>
    Compare the price of each CMU pack in your currency, and work out the cheapest way to
    reach a target amount of CMU using the pack prices below.
  </p>

  {#if currencies.length === 0}
    <p>No currencies configured yet.</p>
  {:else}
    <div class="controls">
      <select bind:value={selectedCurrency}>
        {#each currencies as c (c.code)}
          <option value={c.code}>{c.name} ({c.code})</option>
        {/each}
      </select>

      {#if hasAnyPacks}
        {#if showPlatformSelector}
          <select bind:value={selectedPlatform}>
            <option value="ios">iOS</option>
            <option value="android">Android</option>
          </select>
        {:else if platformsIdentical}
          <p class="platform-note">Prices are the same for iOS and Android.</p>
        {/if}
      {/if}
    </div>

    {#if !hasAnyPacks}
      <Callout variant="warning">
        We currently do not have any data for this currency. You can help us by
        <a href={ISSUE_URL} target="_blank" rel="noopener noreferrer">opening an issue on GitHub</a>
        with the required information.
      </Callout>
    {:else}
      {#if onlyOnePlatform}
        <p class="cta">
          Only available on {iosPacks ? 'iOS' : 'Android'}. You can help us by
          <a href={ISSUE_URL} target="_blank" rel="noopener noreferrer">opening an issue on GitHub</a>
          with the missing platform's pricing.
        </p>
      {/if}

      <table>
        <thead>
          <tr>
            <th>CMU Amount</th>
            <th>Cost</th>
            <th>CMU per {currencyByCode.get(selectedCurrency)?.symbol}</th>
          </tr>
        </thead>
        <tbody>
          {#each selectedPacks as pack (pack.cmu)}
            <tr class:unavailable={pack.price == null}>
              <td>{@render cmuAmount(pack.cmu)}</td>
              {#if pack.price == null}
                <td colspan="2">No price data available</td>
              {:else}
                <td>{formatPrice(pack.price, selectedCurrency)}</td>
                <td>{@render cmuAmount(Math.round((pack.cmu / pack.price) * 100) / 100)}</td>
              {/if}
            </tr>
          {/each}
        </tbody>
      </table>

      {#if incompleteData}
        <p class="cta">
          Some pack prices are missing for this currency. You can help us by
          <a href={ISSUE_URL} target="_blank" rel="noopener noreferrer">opening an issue on GitHub</a>
          with the required information.
        </p>
      {/if}

      <hr>
      <label>
        Enter required CMU: <input type="number" bind:value={inputCmu} min="0" placeholder="e.g. 2500" />
      </label>

      {#if hasValidCmu}
        <h2>Effective cost of {formatCmu(parsedCmu)} CMU using each pack:</h2>
        {#if effectiveCostList.length === 0}
          <p>No pack prices are available yet to calculate an effective cost from.</p>
        {:else}
          <table>
            <thead>
              <tr>
                <th>CMU Amount</th>
                <th>Cost</th>
                <th>Effective Cost</th>
              </tr>
            </thead>
            <tbody>
              {#each effectiveCostList as pack (pack.cmu)}
                <tr>
                  <td>{@render cmuAmount(pack.cmu)}</td>
                  <td>{formatPrice(pack.price, selectedCurrency)}</td>
                  <td>{formatPrice(pack.effectiveCost, selectedCurrency)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      {:else}
        <p>Enter a CMU amount above to see effective cost per pack.</p>
      {/if}
    {/if}
  {/if}
</div>

<style>
  h1 {
    text-shadow: 0 0 10px black;
    text-align: center;
    margin: 1em auto;
    max-width: 800px;
  }
  div.container {
    text-align: center;
    max-width: 1000px;
    margin: auto;
    padding: 0 1em;
    line-height: 1.2em;
    margin-top: 2em;
  }
  div.controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1em;
    flex-wrap: wrap;
    margin: 1em 0;
  }
  p.platform-note {
    margin: 0;
    color: rgba(255, 255, 255, 0.6);
  }
  p.cta {
    color: rgba(255, 255, 255, 0.6);
  }
  table {
    width: 100%;
    margin: 1em 0;
    border-collapse: collapse;
    background: rgba(14, 11, 28, 0.9);
    border: 3px double #5e5a75;
    border-radius: 8px;
  }
  th, td {
    padding: 0.5em 1em;
  }
  thead tr {
    border-bottom: 1px solid #5e5a75;
  }
  tbody tr:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  tr.unavailable {
    opacity: 0.5;
  }
  img.cmu-icon {
    height: 1em;
    vertical-align: sub;
    margin-right: 0.25em;
  }
</style>
