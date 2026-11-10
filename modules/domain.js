import { candidates, evidence } from './data.js';
import { asOf, dermSkus } from './observations.js';

export function selectedCandidate(state) {
  return candidates.find(item => item.id === state.selected) || candidates[0];
}

export function impacts(state) {
  const asOfDay = Date.parse(`${asOf}T00:00:00Z`);
  const rows = dermSkus.map(sku => {
    const coverDays = sku.onHand / (sku.weeklyDemand / 7);
    const plannedArrival = Date.parse(`${sku.orderDate}T00:00:00Z`) + sku.leadWeeks * 7 * 86400000;
    const arrivalDays = Math.max(0, (plannedArrival - asOfDay) / 86400000 + state.delay);
    return { ...sku, coverDays, arrivalDays, exposureDays: Math.max(0, Math.ceil(arrivalDays - coverDays)) };
  });
  const critical = rows.reduce((worst, row) => row.exposureDays > worst.exposureDays ? row : worst, rows[0]);
  const unfilledKrw = rows.reduce((sum, row) => sum + row.orderAmountKrw * (1 - state.supply / 100), 0);
  return { exposureDays: critical.exposureDays, unfilledOrderEok: unfilledKrw / 100000000, exposedSkuCount: rows.filter(row => row.exposureDays > 0).length, critical, rows };
}

export function isReady(state) {
  return evidence.filter(item => item.required).every(item => state.checks[item.id]);
}

export function missingEvidence(state) {
  return evidence.filter(item => item.required && !state.checks[item.id]);
}

export function resilience(state) {
  const impact = impacts(state);
  const minCoverWeeks = Math.min(...impact.rows.map(row => row.coverDays / 7));
  return {
    supply: state.supply,
    production: Math.min(100, Math.round(minCoverWeeks / impact.critical.safetyWeeks * 100)),
    campaign: Math.min(100, Math.round(impact.critical.coverDays / impact.critical.arrivalDays * 100))
  };
}
