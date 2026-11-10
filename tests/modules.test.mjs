import assert from 'node:assert/strict';
import { candidates, evidence, initialState } from '../modules/data.js';
import { impacts, isReady, missingEvidence, resilience, score, selectedCandidate } from '../modules/domain.js';

const base = { ...initialState, checks: {} };
assert.deepEqual(impacts(base), { shortage: 0, cost: 0, campaign: 0 });

const disruption = { ...base, delay: 15, supply: 50 };
assert.equal(impacts(disruption).shortage, 11);
assert.equal(impacts(disruption).campaign, 6);
assert.ok(impacts(disruption).cost > 10);
assert.ok(Object.values(resilience(disruption)).every(value => value >= 5 && value <= 100));

assert.equal(selectedCandidate(base).id, 'ALT-B1');
assert.ok(score(base, candidates[0]) >= 0 && score(base, candidates[0]) <= 100);
assert.equal(isReady(base), false);
assert.equal(missingEvidence(base).length, evidence.filter(item => item.required).length);

const checked = { ...base, checks: Object.fromEntries(evidence.filter(item => item.required).map(item => [item.id, true])) };
assert.equal(isReady(checked), true);
assert.equal(missingEvidence(checked).length, 0);

const memory = new Map();
globalThis.localStorage = {
  getItem: key => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
  removeItem: key => memory.delete(key)
};
const { createStore } = await import('../modules/state.js');
const store = createStore();
store.patch({ delay: 999, supply: -1, selected: 'UNKNOWN' });
assert.equal(store.get().delay, 45);
assert.equal(store.get().supply, 20);
assert.equal(store.get().selected, 'ALT-B1');
store.log('테스트', '모듈 저장 확인');
assert.equal(store.get().logs[0].title, '테스트');
store.resetDecision();
assert.equal(store.get().delay, 0);

console.log('module tests passed');
