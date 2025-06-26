export function load() {

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

    // CMU cost in NOK (Norwegian Krone, 1 kr)
    const cmuNOK = [
        { cmu: 2500, price: 25.00 },
        { cmu: 7000, price: 59.00 },
        { cmu: 15000, price: 119.00 },
        { cmu: 32000, price: 249.00 },
        { cmu: 90000, price: 599.00 },
        { cmu: 200000, price: 1290.00 }
    ]
    .map(pack => ({
    ...pack,
    cmuPerCurrency: Math.round((pack.cmu / pack.price) * 100) / 100
    }));

    // CMU cost in SGD (Singapore Dollar, $1)
    const cmuSGD = [
        { cmu: 2500, price: 2.98 },
        { cmu: 7000, price: 6.98 },
        { cmu: 15000, price: 14.98 },
        { cmu: 32000, price: 28.98 },
        { cmu: 90000, price: 68.98 },
        { cmu: 200000, price: 148.98 }
    ]
    .map(pack => ({
    ...pack,
    cmuPerCurrency: Math.round((pack.cmu / pack.price) * 100) / 100
    }));

    // CMU cost in BRL (Brazilian Real, $1)
    const cmuBRL = [
        { cmu: 2500, price: 10.90 },
        { cmu: 7000, price: 27.90 },
        { cmu: 15000, price: 54.90 },
        { cmu: 32000, price: 109.90 },
        { cmu: 90000, price: 279.90 },
        { cmu: 200000, price: 549.90 }
    ]
    .map(pack => ({
    ...pack,
    cmuPerCurrency: Math.round((pack.cmu / pack.price) * 100) / 100
    }));

    // CMU cost in DZD (Algerian dinar, $1)
    const cmuDZD = [
        { cmu: 2500, price: 10.90 },
        { cmu: 7000, price: 27.90 },
        { cmu: 15000, price: 54.90 },
        { cmu: 32000, price: 109.90 },
        { cmu: 90000, price: 279.90 },
        { cmu: 200000, price: 549.90 }
    ]
    .map(pack => ({
    ...pack,
    cmuPerCurrency: Math.round((pack.cmu / pack.price) * 100) / 100
    }));

    // CMU cost in NTD (New Taiwan dollar, NT$1)
    const cmuNTD = [
        { cmu: 2500, price: 70.00 },
        { cmu: 7000, price: 170.00 },
        { cmu: 15000, price: 330.00 },
        { cmu: 32000, price: 670.00 },
        { cmu: 90000, price: 1690.00 },
        { cmu: 200000, price: 3290.00 }
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
        INR: cmuINR,
        NOK: cmuNOK,
        SGD: cmuSGD,
        BRL: cmuBRL,
        DZD: cmuDZD,
        NTD: cmuNTD
    };

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
        INR: { symbol: '₹ ', symbolAfter: false, locale: "en-IN" },
        NOK: { symbol: ' kr', symbolAfter: true, locale: "nb-NO" },
        SGD: { symbol: '$', symbolAfter: false, locale: "en-SG" },
        BRL: { symbol: 'R$', symbolAfter: false, locale: "pt-BR" },
        DZD: { symbol: ' DA', symbolAfter: true, locale: "pt-BR" },
        NTD: { symbol: 'NT$', symbolAfter: false, locale: "zh-TW" }
    };

	return {
		packsByCurrency,
		currencyConfig
	};
}