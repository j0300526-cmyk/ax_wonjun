import { candidates, evidence } from './data.js';

export function selectedCandidate(state) {
  return candidates.find(item => item.id === state.selected) || candidates[0];
}

export function impacts(state) {
  const shortage = Math.max(0, Math.round(state.delay - (state.supply - 20) / 8));
  const cost = Math.max(0, (100 - state.supply) * .18 + state.delay * .22);
  return { shortage, cost, campaign: Math.max(0, shortage - 5) };
}

export function score(state, candidate) {
  const shock = (100 - state.supply) / 10 + state.delay / 10;
  return Math.max(0, Math.min(100, Math.round(
    candidate.quality * .4 + candidate.lead * .25 + candidate.cost * .15 + candidate.resilience * .2
    - shock * (100 - candidate.resilience) / 100
  )));
}

export function isReady(state) {
  return evidence.filter(item => item.required).every(item => state.checks[item.id]);
}

export function missingEvidence(state) {
  return evidence.filter(item => item.required && !state.checks[item.id]);
}

export function resilience(state) {
  const impact = impacts(state);
  return {
    supply: Math.max(5, Math.round(state.supply - state.delay * 1.2)),
    production: Math.max(5, Math.round(100 - impact.shortage * 4 - (100 - state.supply) * .35)),
    campaign: Math.max(5, Math.round(100 - impact.campaign * 6 - (100 - state.supply) * .15))
  };
}
