import { candidates, initialState, scenarios } from './data.js';

const STORAGE_KEY = 'materialswitch-state';

function clamp(value, minimum, maximum, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, number)) : fallback;
}

function normalize(saved = {}) {
  const selected = candidates.some(item => item.id === saved.selected) ? saved.selected : initialState.selected;
  const scenario = Object.hasOwn(scenarios, saved.scenario) || saved.scenario === 'custom' ? saved.scenario : initialState.scenario;
  return {
    ...initialState,
    ...saved,
    delay: clamp(saved.delay, 0, 45, initialState.delay),
    supply: clamp(saved.supply, 20, 100, initialState.supply),
    selected,
    scenario,
    checks: saved.checks && typeof saved.checks === 'object' ? saved.checks : {},
    tasks: Array.isArray(saved.tasks) ? saved.tasks.slice(0, 50) : [],
    logs: Array.isArray(saved.logs) ? saved.logs.slice(0, 30) : []
  };
}

function load() {
  try {
    return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return { ...initialState };
  }
}

function now() {
  return new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' }).format(new Date());
}

export function createStore() {
  let state = load();
  const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  return {
    get() { return state; },
    replace(nextState) { state = normalize(nextState); persist(); },
    patch(changes) { state = normalize({ ...state, ...changes }); persist(); },
    update(updater) { state = normalize(updater(state)); persist(); },
    log(title, detail) {
      state = { ...state, logs: [{ time: now(), title, detail }, ...state.logs].slice(0, 30) };
      persist();
    },
    resetDecision() {
      state = { ...initialState, tasks: state.tasks, logs: state.logs };
      persist();
    },
    clearExecution() {
      state = { ...state, tasks: [], logs: [], status: '검토 준비' };
      persist();
    }
  };
}
