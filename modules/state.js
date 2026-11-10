import { candidates, initialState, scenarios } from './data.js';

const STORAGE_KEY = 'materialswitch-react-state';
const clamp = (value, min, max, fallback) => Number.isFinite(Number(value)) ? Math.max(min, Math.min(max, Number(value))) : fallback;

function normalize(saved = {}) {
  return { ...initialState, ...saved,
    delay: clamp(saved.delay, 0, 45, initialState.delay), supply: clamp(saved.supply, 20, 100, initialState.supply),
    selected: candidates.some(item => item.id === saved.selected) ? saved.selected : initialState.selected,
    scenario: Object.hasOwn(scenarios, saved.scenario) || saved.scenario === 'custom' ? saved.scenario : initialState.scenario,
    checks: saved.checks && typeof saved.checks === 'object' ? saved.checks : {},
    tasks: Array.isArray(saved.tasks) ? saved.tasks.slice(0, 50) : [],
    logs: Array.isArray(saved.logs) ? saved.logs.slice(0, 30) : []
  };
}

function load() {
  try { return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')); }
  catch { localStorage.removeItem(STORAGE_KEY); return { ...initialState }; }
}

export function createStore() {
  let state = load();
  const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return {
    get() { return state; },
    patch(changes) { state = normalize({ ...state, ...changes }); persist(); },
    update(updater) { state = normalize(updater(state)); persist(); },
    log(title, detail) { state = { ...state, logs: [{ time: new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' }).format(new Date()), title, detail }, ...state.logs].slice(0, 30) }; persist(); },
    resetDecision() { state = { ...initialState, tasks: state.tasks, logs: state.logs }; persist(); },
    clearExecution() { state = { ...state, tasks: [], logs: [], status: '검토 준비' }; persist(); }
  };
}
