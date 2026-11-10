import { $, $$, openView } from './view/dom.js';

export function bindEvents(actions) {
  $$('.nav-btn').forEach(button => button.onclick = () => openView(button.dataset.view));
  $$('[data-goto]').forEach(button => button.onclick = () => openView(button.dataset.goto));
  $$('[data-demo]').forEach(button => button.onclick = () => {
    actions.applyScenario(button.dataset.demo);
    openView('workbench');
  });
  $$('.scenario-btn').forEach(button => button.onclick = () => actions.applyScenario(button.dataset.scenario));

  $('#delay').oninput = event => actions.setDelay(event.target.value);
  $('#supply').oninput = event => actions.setSupply(event.target.value);
  $('#runBtn').onclick = actions.runStressTest;
  $('#resetBtn').onclick = actions.reset;
  $('#approveBtn').onclick = actions.approve;
  $('#rejectBtn').onclick = actions.reject;
  $('#clearTasks').onclick = actions.clearTasks;
}
