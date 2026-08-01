<script>
  import Time from 'svelte-time'
  import { formatNumber } from '$lib/utils'

  const { summary } = $props()

  // Eurozone members map to EUR; everything else falls back to a small region -> currency
  // lookup, defaulting to USD if the region is unrecognized. Only used when the CSV itself
  // didn't show a real-money currency code (see purchase-summary.js's `currency` field) -
  // this is strictly a locale-based guess, not derived from the export's own data.
  const EUROZONE_REGIONS = new Set([
    'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 'GR',
    'LU', 'SI', 'SK', 'EE', 'LV', 'LT', 'CY', 'MT', 'HR'
  ])
  const REGION_CURRENCY = {
    US: 'USD',
    GB: 'GBP',
    JP: 'JPY',
    CA: 'CAD',
    AU: 'AUD',
    NZ: 'NZD',
    CH: 'CHF',
    CN: 'CNY',
    IN: 'INR',
    BR: 'BRL',
    MX: 'MXN',
    KR: 'KRW',
    SE: 'SEK',
    NO: 'NOK',
    DK: 'DKK',
    PL: 'PLN',
    RU: 'RUB',
    ZA: 'ZAR',
    SG: 'SGD',
    HK: 'HKD'
  }

  function guessLocaleCurrency () {
    if (typeof navigator === 'undefined') return 'USD'
    try {
      const region = new Intl.Locale(navigator.language).maximize().region
      if (EUROZONE_REGIONS.has(region)) return 'EUR'
      return REGION_CURRENCY[region] ?? 'USD'
    } catch {
      return 'USD'
    }
  }

  // Real-money figures only (see purchase-summary.js) - CMU itself is Ingress's own virtual
  // currency, not a real-world one, so CMU amounts stay plain numbers (with the CMU icon, not a
  // currency symbol - see the cmuAmount snippet below) rather than getting a currency symbol
  // that would misrepresent them as money.
  const currency = $derived(summary.currency ?? guessLocaleCurrency())
  const formatMoney = amount => {
    try {
      return new Intl.NumberFormat(typeof navigator === 'undefined' ? undefined : navigator.language, {
        style: 'currency',
        currency
      }).format(amount)
    } catch {
      return `${amount.toFixed(2)} ${currency}`
    }
  }

  // `perItem` is already sorted by count descending (see purchase-summary.js), so the first
  // match in each subset is the highest-count one - free and paid are tracked separately since
  // mixing them into one "most purchased" figure hid whichever of the two wasn't on top.
  const mostClaimedFreeItem = $derived(summary.itemPurchases.perItem.find(row => row.cost === 0) ?? null)
  const mostPurchasedPaidItem = $derived(summary.itemPurchases.perItem.find(row => row.cost > 0) ?? null)
  const freePercentage = $derived(
    summary.itemPurchases.totalItems > 0
      ? Math.round((summary.itemPurchases.freeItems / summary.itemPurchases.totalItems) * 100)
      : null
  )
  const pricePer1000Cmu = $derived(
    summary.cmuPurchases.totalCurrencyAcquired > 0
      ? summary.cmuPurchases.totalSpent / summary.cmuPurchases.totalCurrencyAcquired * 1000
      : null
  )

  // One independent sort state per table - clicking a header toggles direction if it's already
  // the active column, otherwise switches to that column descending. The two admin event tables
  // default to newest-first; the aggregate tables default to highest-count-first.
  const cmuSort = $state({ key: 'count', dir: 'desc' })
  const itemSort = $state({ key: 'count', dir: 'desc' })
  const grantedSort = $state({ key: 'timestamp', dir: 'desc' })
  const adjustmentSort = $state({ key: 'timestamp', dir: 'desc' })

  function toggleSort (sort, key) {
    if (sort.key === key) {
      sort.dir = sort.dir === 'asc' ? 'desc' : 'asc'
    } else {
      sort.key = key
      sort.dir = 'desc'
    }
  }

  function sortIndicator (sort, key) {
    if (sort.key !== key) return ''
    return sort.dir === 'asc' ? ' ▲' : ' ▼'
  }

  // Never mutates the source arrays in place - they're also read for the headline stats above,
  // which need to stay based on the analyzer's own count-descending order regardless of
  // whatever a user has clicked a table header to sort by.
  function sortRows (rows, sort) {
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const av = a[sort.key]
      const bv = b[sort.key]
      if (av < bv) return -1 * dir
      if (av > bv) return 1 * dir
      return 0
    })
  }

  const sortedCmuPurchases = $derived(sortRows(summary.cmuPurchases.perSku, cmuSort))
  const sortedItemPurchases = $derived(sortRows(summary.itemPurchases.perItem, itemSort))
  const sortedGrantedItems = $derived(sortRows(summary.grantedItems.entries, grantedSort))
  const sortedAdjustments = $derived(sortRows(summary.adjustments.entries, adjustmentSort))
</script>

{#snippet cmuAmount(cmu, showSign = false)}<img src="/images/tools/cmu_calc/cmu.png" alt="" class="cmu-icon" />{showSign && cmu > 0 ? '+' : ''}{formatNumber(cmu)}{/snippet}

<div class="purchase-summary">
  <div class="headline-grid">
    <div class="stat">
      <div class="stat-value">{formatMoney(summary.cmuPurchases.totalSpent)}</div>
      <div class="stat-label">Total spent on CMU</div>
    </div>
    <div class="stat">
      <div class="stat-value">{@render cmuAmount(summary.cmuPurchases.totalCurrencyAcquired)}</div>
      <div class="stat-label">Total CMU acquired</div>
    </div>
    {#if pricePer1000Cmu}
      <div class="stat">
        <div class="stat-value">{formatMoney(pricePer1000Cmu)}</div>
        <div class="stat-label">Avg. price per 1,000 CMU</div>
      </div>
    {/if}
    {#if mostClaimedFreeItem}
      <div class="stat">
        <div class="stat-value">{mostClaimedFreeItem.item}</div>
        <div class="stat-label">Free item most claimed ({formatNumber(mostClaimedFreeItem.count)}&times;)</div>
      </div>
    {/if}
    {#if mostPurchasedPaidItem}
      <div class="stat">
        <div class="stat-value">{mostPurchasedPaidItem.item}</div>
        <div class="stat-label">
          Most purchased item ({formatNumber(mostPurchasedPaidItem.count)}&times;,
          {@render cmuAmount(mostPurchasedPaidItem.cost)} total)
        </div>
      </div>
    {/if}
    {#if freePercentage !== null}
      <div class="stat">
        <div class="stat-value">{freePercentage}%</div>
        <div class="stat-label">Items received for free</div>
      </div>
    {/if}
    <div class="stat">
      <div class="stat-value">{formatNumber(summary.itemsConsumed)}</div>
      <div class="stat-label">Items consumed</div>
    </div>
    {#if summary.adjustments.count > 0}
      <div class="stat">
        <div class="stat-value">{@render cmuAmount(summary.adjustments.netCurrency, true)}</div>
        <div class="stat-label">Net CMU from admin adjustments</div>
      </div>
    {/if}
  </div>

  {#if summary.cmuPurchases.perSku.length > 0}
    <details class="section-details">
      <summary>CMU pack purchases by type ({summary.cmuPurchases.perSku.length})</summary>
      <div class="scroll-box">
        <table>
          <thead>
            <tr>
              <th class="sortable" onclick={() => toggleSort(cmuSort, 'sku')}>Pack{sortIndicator(cmuSort, 'sku')}</th>
              <th class="sortable" onclick={() => toggleSort(cmuSort, 'count')}>Count{sortIndicator(cmuSort, 'count')}</th>
              <th class="sortable" onclick={() => toggleSort(cmuSort, 'spent')}>Spent{sortIndicator(cmuSort, 'spent')}</th>
              <th class="sortable" onclick={() => toggleSort(cmuSort, 'currency')}>CMU{sortIndicator(cmuSort, 'currency')}</th>
            </tr>
          </thead>
          <tbody>
            {#each sortedCmuPurchases as row (row.sku)}
              <tr>
                <td>
                  {#if row.packCmu != null}
                    {@render cmuAmount(row.packCmu)}
                  {:else if row.packLabel}
                    {row.packLabel}
                  {:else}
                    {row.sku}
                  {/if}
                </td>
                <td>{row.count}</td>
                <td>{formatMoney(row.spent)}</td>
                <td>{@render cmuAmount(row.currency)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </details>
  {/if}

  {#if summary.itemPurchases.perItem.length > 0}
    <details class="section-details">
      <summary>In-game item purchases by item ({summary.itemPurchases.perItem.length})</summary>
      <div class="scroll-box">
        <table>
          <thead>
            <tr>
              <th class="sortable" onclick={() => toggleSort(itemSort, 'item')}>Item{sortIndicator(itemSort, 'item')}</th>
              <th class="sortable" onclick={() => toggleSort(itemSort, 'count')}>Count{sortIndicator(itemSort, 'count')}</th>
              <th class="sortable" onclick={() => toggleSort(itemSort, 'cost')}>Cost{sortIndicator(itemSort, 'cost')}</th>
            </tr>
          </thead>
          <tbody>
            {#each sortedItemPurchases as row (row.item)}
              <tr>
                <td>{row.item}</td>
                <td>{row.count}</td>
                <td>{@render cmuAmount(row.cost)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </details>
  {/if}

  {#if summary.grantedItems.totalItems > 0}
    <details class="section-details">
      <summary>Admin-granted items ({summary.grantedItems.totalItems})</summary>
      <div class="scroll-box">
        <table>
          <thead>
            <tr>
              <th class="sortable" onclick={() => toggleSort(grantedSort, 'timestamp')}>Date{sortIndicator(grantedSort, 'timestamp')}</th>
              <th class="sortable" onclick={() => toggleSort(grantedSort, 'item')}>Item{sortIndicator(grantedSort, 'item')}</th>
              <th class="sortable" onclick={() => toggleSort(grantedSort, 'value')}>Value{sortIndicator(grantedSort, 'value')}</th>
            </tr>
          </thead>
          <tbody>
            {#each sortedGrantedItems as row, i (i)}
              <tr>
                <td>
                  {#if row.timestamp}
                    <Time timestamp={row.timestamp} format="YYYY-MM-DD HH:mm" />
                  {:else}
                    &mdash;
                  {/if}
                </td>
                <td>
                  <div>{row.item}</div>
                  {#if row.description}
                    <div class="row-description">{row.description}</div>
                  {/if}
                </td>
                <td>{@render cmuAmount(row.value)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </details>
  {/if}

  {#if summary.adjustments.count > 0}
    <details class="section-details">
      <summary>Admin balance adjustments ({summary.adjustments.count})</summary>
      <div class="scroll-box">
        <table>
          <thead>
            <tr>
              <th class="sortable" onclick={() => toggleSort(adjustmentSort, 'timestamp')}>Date{sortIndicator(adjustmentSort, 'timestamp')}</th>
              <th class="sortable" onclick={() => toggleSort(adjustmentSort, 'delta')}>CMU{sortIndicator(adjustmentSort, 'delta')}</th>
              <th class="sortable" onclick={() => toggleSort(adjustmentSort, 'reason')}>Reason{sortIndicator(adjustmentSort, 'reason')}</th>
            </tr>
          </thead>
          <tbody>
            {#each sortedAdjustments as row, i (i)}
              <tr>
                <td>
                  {#if row.timestamp}
                    <Time timestamp={row.timestamp} format="YYYY-MM-DD HH:mm" />
                  {:else}
                    &mdash;
                  {/if}
                </td>
                <td>{@render cmuAmount(row.delta, true)}</td>
                <td>{row.reason}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </details>
  {/if}
</div>

<style>
  div.purchase-summary {
    text-align: left;
    background: rgba(14, 11, 28, 0.9);
    border: 3px double #5e5a75;
    border-radius: 8px;
    padding: 1em 1.25em;
  }
  div.headline-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 1em;
    margin-bottom: 0.5em;
  }
  div.stat-value {
    font-size: 1.3em;
    font-weight: bold;
    color: #FFF;
  }
  div.stat-label {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.85em;
  }
  details.section-details {
    margin-top: 1em;
  }
  details.section-details summary {
    cursor: pointer;
    font-weight: bold;
    color: #FFF;
  }
  details.section-details summary:hover {
    color: #9593c3;
  }
  div.scroll-box {
    max-height: 240px;
    overflow-y: auto;
    border: 1px solid #5e5a75;
    border-radius: 6px;
    padding: 0.5em 0.75em;
    margin-top: 0.5em;
  }
  div.scroll-box table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9em;
  }
  div.scroll-box th {
    position: sticky;
    top: 0;
    background: #1a1630;
    text-align: left;
    padding: 0.25em 0.5em;
  }
  div.scroll-box th.sortable {
    cursor: pointer;
    user-select: none;
  }
  div.scroll-box th.sortable:hover {
    color: #9593c3;
  }
  div.scroll-box td {
    padding: 0.25em 0.5em;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  div.row-description {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9em;
  }
  img.cmu-icon {
    height: 1em;
    vertical-align: sub;
    margin-right: 0.25em;
  }
</style>
