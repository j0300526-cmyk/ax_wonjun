import { renderCandidates, renderEvidence, renderGate } from './view/decision.js';
import { renderLog, renderTasks } from './view/history.js';
import { renderImpacts, renderScenarioTabs } from './view/overview.js';

export function renderApp(state, handlers) {
  renderScenarioTabs(state);
  renderCandidates(state, handlers.onCandidateSelect);
  renderEvidence(state, handlers.onEvidenceChange);
  renderGate(state);
  renderImpacts(state);
  renderTasks(state, handlers.onTaskComplete);
  renderLog(state);
}
