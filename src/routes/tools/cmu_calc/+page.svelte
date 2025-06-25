<script>

    // CMU cost in EUR (Euro, 1€)
    const cmuEUR = [
        { cmu: 2500, price: 2.49 },
        { cmu: 7000, price: 5.99 },
        { cmu: 15000, price: 11.99 },
        { cmu: 32000, price: 23.99 },
        { cmu: 90000, price: 59.99 },
        { cmu: 200000, price: 119.99 }
    ]
    .map(pack => ({
    ...pack,
    cmuPerCurrency: Math.round((pack.cmu / pack.price) * 100) / 100
    }));

    // CMU cost in USD (US Dollar, $1)
    const cmuUSD = [
        { cmu: 2500, price: 1.99 },
        { cmu: 7000, price: 4.99 },
        { cmu: 15000, price: 9.99 },
        { cmu: 32000, price: 19.99 },
        { cmu: 90000, price: 49.99 },
        { cmu: 200000, price: 99.99 }
    ]
    .map(pack => ({
    ...pack,
    cmuPerCurrency: Math.round((pack.cmu / pack.price) * 100) / 100
    }));

    // CMU cost in CAD (Canadian Dollar, $1)
    const cmuCAD = [
        { cmu: 2500, price: 2.79 },
        { cmu: 7000, price: 6.99 },
        { cmu: 15000, price: 13.99 },
        { cmu: 32000, price: 27.99 },
        { cmu: 90000, price: 69.99 },
        { cmu: 200000, price: 139.99 }
    ]
    .map(pack => ({
    ...pack,
    cmuPerCurrency: Math.round((pack.cmu / pack.price) * 100) / 100
    }));

    // CMU cost in AUD (Australian Dollar, $1)
    const cmuAUD = [
        { cmu: 2500, price: 2.99 },
        { cmu: 7000, price: 7.99 },
        { cmu: 15000, price: 14.99 },
        { cmu: 32000, price: 30.99 },
        { cmu: 90000, price: 79.99 },
        { cmu: 200000, price: 159.99 }
    ]
    .map(pack => ({
    ...pack,
    cmuPerCurrency: Math.round((pack.cmu / pack.price) * 100) / 100
    }));

    // CMU cost in GBP (British pound, £1)
    const cmuGBP = [
        { cmu: 2500, price: 1.99 },
        { cmu: 7000, price: 4.99 },
        { cmu: 15000, price: 9.99 },
        { cmu: 32000, price: 19.99 },
        { cmu: 90000, price: 49.99 },
        { cmu: 200000, price: 99.99 }
    ]
    .map(pack => ({
    ...pack,
    cmuPerCurrency: Math.round((pack.cmu / pack.price) * 100) / 100
    }));

    // CMU cost in YPN (Japanese Yen, ¥1)
    const cmuYPN = [
        { cmu: 2500, price: 320 },
        { cmu: 7000, price: 800 },
        { cmu: 15000, price: 1600 },
        { cmu: 32000, price: 3200 },
        { cmu: 90000, price: 8000 },
        { cmu: 200000, price: 15800 }
    ]
    .map(pack => ({
    ...pack,
    cmuPerCurrency: Math.round((pack.cmu / pack.price) * 100) / 100
    }));

    // CMU cost in NZD (New Zealand Dollar, $1)
    const cmuNZD = [
        { cmu: 2500, price: 3.49 },
        { cmu: 7000, price: 8.99 },
        { cmu: 15000, price: 16.99 },
        { cmu: 32000, price: 34.99 },
        { cmu: 90000, price: 89.99 },
        { cmu: 200000, price: 169.99 }
    ]
    .map(pack => ({
    ...pack,
    cmuPerCurrency: Math.round((pack.cmu / pack.price) * 100) / 100
    }));

    // CMU cost in TRY (Turkish lira, ₺1)
    const cmuTRY = [
        { cmu: 2500, price: 44.99 },
        { cmu: 7000, price: 109.99 },
        { cmu: 15000, price: 219.99 },
        { cmu: 32000, price: 449.99 },
        { cmu: 90000, price: 1099.99 },
        { cmu: 200000, price: 2199.99 }
    ]
    .map(pack => ({
    ...pack,
    cmuPerCurrency: Math.round((pack.cmu / pack.price) * 100) / 100
    }));

    // CMU cost in MXN (Mexican Peso, $1)
    const cmuMXN = [
        { cmu: 2500, price: 49.00 },
        { cmu: 7000, price: 129.00 },
        { cmu: 15000, price: 249.00 },
        { cmu: 32000, price: 499.00 },
        { cmu: 90000, price: 1299.00 },
        { cmu: 200000, price: 2499.00 }
    ]
    .map(pack => ({
    ...pack,
    cmuPerCurrency: Math.round((pack.cmu / pack.price) * 100) / 100
    }));

    // CMU cost in SEK (Swedish Krona, 1 kr)
    const cmuSEK = [
        { cmu: 2500, price: 27.00 },
        { cmu: 7000, price: 65.00 },
        { cmu: 15000, price: 129.00 },
        { cmu: 32000, price: 269.00 },
        { cmu: 90000, price: 695.00 },
        { cmu: 200000, price: 1359.00 }
    ]
    .map(pack => ({
    ...pack,
    cmuPerCurrency: Math.round((pack.cmu / pack.price) * 100) / 100
    }));

    // CMU cost in INR (Indian Rupee, ₹ 1)
    const cmuINR = [
        { cmu: 2500, price: 149 },
        { cmu: 7000, price: 449 },
        { cmu: 15000, price: 899 },
        { cmu: 32000, price: 1799 },
        { cmu: 90000, price: 4499 },
        { cmu: 200000, price: 8900 }
    ]
    .map(pack => ({
    ...pack,
    cmuPerCurrency: Math.round((pack.cmu / pack.price) * 100) / 100
    }));

    // Packs by currency:
    const packsByCurrency = {
        EUR: cmuEUR,
        USD: cmuUSD,
        CAD: cmuCAD,
        AUD: cmuAUD,
        GBP: cmuGBP,
        YPN: cmuYPN,
        NZD: cmuNZD,
        TRY: cmuTRY,
        MXN: cmuMXN,
        SEK: cmuSEK,
        INR: cmuINR
    };

    // Selected currency store (default EUR)
    let selectedCurrency = 'EUR';

    // Reactive selected packs based on selected currency
    $: selectedPacks = packsByCurrency[selectedCurrency];

    // Configure currency symbol, whether it should be before or after the number ($5 or 5€ for example) and locale (for correct seperators)
    const currencyConfig = {
        EUR: { symbol: '€', symbolAfter: true, locale: "de-DE" },
        USD: { symbol: '$', symbolAfter: false, locale: "en-US" },
        CAD: { symbol: '$', symbolAfter: false, locale: "en-CA" },
        AUD: { symbol: '$', symbolAfter: false, locale: "en-AU" },
        GBP: { symbol: '£', symbolAfter: false, locale: "en-GB" },
        YPN: { symbol: '¥', symbolAfter: false, locale: "ja-JP" },
        NZD: { symbol: '$', symbolAfter: false, locale: "en-NZ" },
        TRY: { symbol: '₺', symbolAfter: false, locale: "tr-TR" },
        MXN: { symbol: '$', symbolAfter: false, locale: "es-MX" },
        SEK: { symbol: ' kr', symbolAfter: true, locale: "sv-SE" },
        INR: { symbol: '₹ ', symbolAfter: true, locale: "en-IN" }
    };

    function formatPrice(price, currency) {
        const config = currencyConfig[currency] || {};
        const { symbol, symbolAfter, locale } = config;

        const formatted = price.toLocaleString(locale || undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        if (!symbol) return formatted;
        return symbolAfter ? `${formatted} ${symbol}` : `${symbol}${formatted}`;
    }

    let inputCmu = 0;

    $: effectiveCostList = selectedPacks.map(pack => {
        const effectiveUnitCost = pack.price / pack.cmu;
        const effectiveCost = Math.round(effectiveUnitCost * inputCmu * 100) / 100;
        return {
            ...pack,
            effectiveCost
        };
    });
</script>

<svelte:head>
    <title>Ingress Plus &middot; CMU Calculator</title>
</svelte:head>

<select bind:value={selectedCurrency}>
  <option value="EUR">🇪🇺 Euro (EUR)</option>
  <option value="USD">🇺🇸 US Dollar (USD)</option>
  <option value="CAD">🇨🇦 Canadian Dollar (CAD)</option>
  <option value="AUD">🇦🇺 Australian Dollar (AUD)</option>
  <option value="GBP">🇬🇧 British Pound (GBP)</option>
  <option value="YPN">🇯🇵 Japanese Yen (YPN)</option>
  <option value="NZD">🇳🇿 New Zealand Dollar (NZD)</option>
  <option value="TRY">🇹🇷 Turkish lira (TRY)</option>
  <option value="MXN">🇲🇽 Mexican Peso (MXN)</option>
  <option value="SEK">🇸🇪 Swedish Krona (SEK)</option>
  <option value="INR">🇮🇳 Indian Rupee (INR)</option>
</select>

<ul>
  {#each selectedPacks as pack}
    <li>
      {pack.cmu} CMU cost {formatPrice(pack.price, selectedCurrency)}, thats {pack.cmuPerCurrency} CMU/{currencyConfig[selectedCurrency].symbol}
    </li>
  {/each}
</ul>

<hr>
<label>
  Enter required CMU: <input type="number" bind:value={inputCmu} min="0" placeholder="e.g. 2500" />
</label>

{#if inputCmu > 0}
  <h2>Effective cost of {inputCmu} CMU using each pack:</h2>
  <ul>
    {#each effectiveCostList as pack}
      <li>
        Using {pack.cmu} CMU pack for {formatPrice(pack.price, selectedCurrency)} → 
        effective cost = {formatPrice(pack.effectiveCost, selectedCurrency)} for {inputCmu} CMU
      </li>
    {/each}
  </ul>
{/if}