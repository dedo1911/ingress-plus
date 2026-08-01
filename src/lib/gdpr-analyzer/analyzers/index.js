// Registry of everything that can turn a recognized file's rows into an active-analysis result
// (see summarize.js). Adding a new analysis type is: write a module exporting `appliesTo` and
// `createAccumulator` like these two, add it here, and wire its config field(s) into the
// relevant catalog.js entries - no changes needed to the dispatcher itself.
import * as locationHeatmap from './location-heatmap.js'
import * as purchaseSummary from './purchase-summary.js'

export const ANALYZERS = [locationHeatmap, purchaseSummary]
