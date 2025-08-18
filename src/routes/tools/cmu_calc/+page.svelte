<script>

	export let data;
	const { packsByCurrency, currencyConfig } = data;

    // Selected currency store (default EUR)
    let selectedCurrency = 'EUR';

    // Reactive selected packs based on selected currency
    $: selectedPacks = packsByCurrency[selectedCurrency];

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

    let inputCmu = '';

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
  <option value="JPY">🇯🇵 Japanese Yen (YPN)</option>
  <option value="NZD">🇳🇿 New Zealand Dollar (NZD)</option>
  <option value="TRY">🇹🇷 Turkish lira (TRY)</option>
  <option value="MXN">🇲🇽 Mexican Peso (MXN)</option>
  <option value="SEK">🇸🇪 Swedish Krona (SEK)</option>
  <option value="INR">🇮🇳 Indian Rupee (INR)</option>
  <option value="NOK">🇳🇴 Norwegian Krone (NOK)</option>
  <option value="SGD">🇸🇬 Singapore Dollar (SGD)</option>
  <option value="BRL">🇧🇷 Brazilian real (BRL)</option>
  <!--<option value="DZD">🇩🇿 Algerian Dinar (DZD)</option>  | Algeria uses USD apparently-->
  <option value="NTD">🇹🇼 New Taiwan dollar (NTD)</option>
  <option value="PEN">🇵🇪 Peruvian Sol (PEN)</option>
  <option value="CNY">🇨🇳 Chinese Yuan (CNY)</option>
</select>

<ul>
  {#each selectedPacks as pack}
    <li>
      {pack.cmu} CMU cost {formatPrice(pack.price, selectedCurrency)}, thats {pack.cmuPerCurrency} CMU / {currencyConfig[selectedCurrency].symbol}
    </li>
  {/each}
</ul>

<hr>
<label>
  Enter required CMU: <input type="number" bind:value={inputCmu} min="0" placeholder="e.g. 2500" />
</label>

  <h2>Effective cost of {inputCmu} CMU using each pack:</h2>
  <ul>
    {#each effectiveCostList as pack}
      <li>
        Using {pack.cmu} CMU pack for {formatPrice(pack.price, selectedCurrency)} → 
        effective cost = {formatPrice(pack.effectiveCost, selectedCurrency)} for {inputCmu} CMU
      </li>
    {/each}
  </ul>