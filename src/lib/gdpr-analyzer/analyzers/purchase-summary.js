import { parseTimestamp } from '../dates.js'

// Ports the CMU/store spending breakdown from a Python script (cmuAmount.py) that was written
// and run separately against a real store_purchases.tsv export, verified against that script's
// own stats.txt output before porting. `SUBSCRIPTION ITEM` rows are skipped like the script
// implicitly does - they're a redundant paired record for the same event `SUBSCRIPTION CMU`
// already captures, with no cost info of their own. Unlike the script, `OPS ADJUST CMU` reason
// text is kept in full (not further redacted beyond replacing hashed IDs with a visible
// "[GUID hidden]" placeholder) - a deliberate call, see catalog.js's `store_purchases.tsv`
// entry for the privacy flag this earns it.
const SKIPPED_TYPES = new Set(['DUPLICATE RECEIPT', 'SUBSCRIPTION ITEM'])
const CMU_PURCHASE_TYPES = new Set(['PURCHASE CMU', 'SUBSCRIPTION CMU'])

// Every `ingress.cmu.*`/`ingress.dogfood.cmu.xs` pack has been confirmed (against a real export)
// to grant a fixed amount of CMU per purchase - derived at finalize() time as
// totalCurrency/count for that SKU rather than hardcoded here, so it stays correct even if a
// pack's price/grant changes rather than silently going stale. The C.O.R.E. subscription is the
// opposite case: its CMU grant has changed over time, so a per-purchase average would be
// misleading - it gets a fixed descriptive label instead of a computed number.
const KNOWN_CMU_PACK_SKUS = new Set([
  'ingress.dogfood.cmu.xs',
  'ingress.cmu.small',
  'ingress.cmu.medium',
  'ingress.cmu.large',
  'ingress.cmu.xl',
  'ingress.cmu.xxl',
  'ingress.cmu.xxxxl'
])
const VARIABLE_CMU_PACK_LABELS = {
  'monthly.subscription.core.500inventory': 'Monthly C.O.R.E. CMU grant'
}

const CURRENCY_ACQUIRED_PATTERN = /soft currency (?:by subscription )?(\d+)/
const PRICE_E6_PATTERN = /pricePaidE6Long (\d+)/
const PRICE_PATTERN = /price (\d+\.\d+)/
const COST_PATTERN = /Cost[:\s]+(\d+)/
const ADJUSTMENT_DELTA_PATTERN = /soft currency adjustment: (-?\d+)/
const HASHED_ID_PATTERN = /\b\S+\.c\b/g
// Real-money transaction currency (e.g. "currency EUR") - exactly 3 uppercase letters, which
// also happens to filter out two false-positive "currency ..." substrings seen in real receipt
// text: "soft currency by subscription" (currency followed by the word "by") and a locale-like
// 2-letter value seen on some subscription rows ("currency DE") that isn't an ISO currency code.
const CURRENCY_CODE_PATTERN = /currency ([A-Z]{3})\b/
// Just the free-text part of "Description: <text>, Quantity (total items): N, Cost: NCMU" -
// Quantity/Cost are already shown as their own fields, so only the description itself is worth
// surfacing verbatim.
const DESCRIPTION_PATTERN = /Description:\s*(.*), Quantity \(total items\)/

function extractDescription (text) {
  const match = text.match(DESCRIPTION_PATTERN)
  return match ? match[1].trim() : null
}

// Replaces each hashed ID with a visible placeholder rather than deleting it outright - an
// empty gap in the reason text would look like unexplained missing content, whereas
// "[GUID hidden]" makes the redaction itself legible.
function cleanAdjustmentReason (text) {
  return text.replace(HASHED_ID_PATTERN, '[GUID hidden]').replace(/\s+/g, ' ').trim()
}

export function appliesTo (classification) {
  return classification.shape === 'tabular' && Boolean(classification.purchaseColumns)
}

export function createAccumulator (classification, headers) {
  const { type: typeColumn, item: itemColumn, description: descriptionColumn } = classification.purchaseColumns
  const typeIndex = headers.indexOf(typeColumn)
  const itemIndex = headers.indexOf(itemColumn)
  const descriptionIndex = headers.indexOf(descriptionColumn)
  const timeIndex = headers.indexOf(classification.timeColumn)

  let totalPurchases = 0
  let unknownPriceCount = 0
  let totalSpent = 0
  let totalCurrencyAcquired = 0
  const perSkuCount = new Map()
  const perSkuSpent = new Map()
  const perSkuCurrency = new Map()
  const currencyCodeCounts = new Map()

  let piTotalCost = 0
  let piTotalItems = 0
  let piPaidItems = 0
  let piFreeItems = 0
  const piCounts = new Map()
  const piCosts = new Map()
  const piDescriptions = new Map()

  const grantedEntries = []

  let itemsConsumed = 0

  let adjustmentNetCurrency = 0
  const adjustmentEntries = []

  const bump = (map, key, amount = 1) => map.set(key, (map.get(key) ?? 0) + amount)
  const addDescription = (map, key, text) => {
    if (!map.has(key)) map.set(key, new Set())
    map.get(key).add(text)
  }

  return {
    addRow (row) {
      if (typeIndex === -1 || itemIndex === -1 || descriptionIndex === -1) return
      const type = row[typeIndex]
      if (SKIPPED_TYPES.has(type)) return

      const itemId = row[itemIndex]
      const receiptText = row[descriptionIndex]
      const timestamp = timeIndex !== -1 ? parseTimestamp(row[timeIndex]) : null

      if (CMU_PURCHASE_TYPES.has(type)) {
        totalPurchases++
        bump(perSkuCount, itemId)

        const currencyMatch = receiptText.match(CURRENCY_ACQUIRED_PATTERN)
        if (currencyMatch) {
          const acquired = Number(currencyMatch[1])
          totalCurrencyAcquired += acquired
          bump(perSkuCurrency, itemId, acquired)
        }

        const currencyCodeMatch = receiptText.match(CURRENCY_CODE_PATTERN)
        if (currencyCodeMatch) bump(currencyCodeCounts, currencyCodeMatch[1])

        let price = 0
        let priceKnown = false
        const e6Match = receiptText.match(PRICE_E6_PATTERN)
        const priceMatch = receiptText.match(PRICE_PATTERN)
        if (e6Match && Number(e6Match[1]) > 0) {
          price = Number(e6Match[1]) / 1000000
          priceKnown = true
        } else if (priceMatch && Number(priceMatch[1]) > 0) {
          price = Number(priceMatch[1])
          priceKnown = true
        }

        if (priceKnown) {
          totalSpent += price
          bump(perSkuSpent, itemId, price)
        } else {
          unknownPriceCount++
        }
      } else if (type === 'PURCHASE ITEM') {
        piTotalItems++
        bump(piCounts, itemId)
        addDescription(piDescriptions, itemId, receiptText)

        const costMatch = receiptText.match(COST_PATTERN)
        const cost = costMatch ? Number(costMatch[1]) : 0
        piTotalCost += cost
        bump(piCosts, itemId, cost)
        if (cost > 0) piPaidItems++
        else piFreeItems++
      } else if (type === 'OPS GRANT ITEM') {
        const costMatch = receiptText.match(COST_PATTERN)
        grantedEntries.push({
          item: itemId,
          value: costMatch ? Number(costMatch[1]) : 0,
          description: extractDescription(receiptText),
          timestamp
        })
      } else if (type === 'CONSUME ITEM') {
        itemsConsumed++
      } else if (type === 'OPS ADJUST CMU') {
        const deltaMatch = receiptText.match(ADJUSTMENT_DELTA_PATTERN)
        const delta = deltaMatch ? Number(deltaMatch[1]) : 0
        adjustmentNetCurrency += delta
        adjustmentEntries.push({ delta, timestamp, reason: cleanAdjustmentReason(receiptText) })
      }
    },

    finalize () {
      const perSku = Array.from(perSkuCount.keys()).sort().map(sku => {
        const count = perSkuCount.get(sku)
        const currency = perSkuCurrency.get(sku) ?? 0
        return {
          sku,
          count,
          spent: perSkuSpent.get(sku) ?? 0,
          currency,
          // Known packs get a display-ready CMU amount (derived from this file's own data, not
          // hardcoded) or a fixed text label (for the C.O.R.E. subscription, whose grant amount
          // has varied over time) - unrecognized SKUs fall back to null, and the UI shows the
          // raw sku for those.
          packCmu: KNOWN_CMU_PACK_SKUS.has(sku) && count > 0 ? Math.round(currency / count) : null,
          packLabel: VARIABLE_CMU_PACK_LABELS[sku] ?? null
        }
      })

      const perItem = Array.from(piCounts.keys())
        .sort((a, b) => piCounts.get(b) - piCounts.get(a))
        .map(item => ({
          item,
          count: piCounts.get(item),
          cost: piCosts.get(item) ?? 0,
          descriptions: Array.from(piDescriptions.get(item) ?? []).sort()
        }))

      // The most-seen real-money currency code across purchase/subscription rows - null if none
      // were ever matched (e.g. a file with no PURCHASE CMU/SUBSCRIPTION CMU rows at all), in
      // which case the UI falls back to guessing from the browser's locale.
      let currency = null
      let currencyBestCount = 0
      for (const [code, count] of currencyCodeCounts) {
        if (count > currencyBestCount) {
          currency = code
          currencyBestCount = count
        }
      }

      return {
        purchaseSummary: {
          currency,
          cmuPurchases: { totalPurchases, unknownPriceCount, totalSpent, totalCurrencyAcquired, perSku },
          itemPurchases: { totalCost: piTotalCost, totalItems: piTotalItems, paidItems: piPaidItems, freeItems: piFreeItems, perItem },
          grantedItems: { totalItems: grantedEntries.length, entries: grantedEntries },
          itemsConsumed,
          adjustments: { count: adjustmentEntries.length, netCurrency: adjustmentNetCurrency, entries: adjustmentEntries }
        }
      }
    }
  }
}
