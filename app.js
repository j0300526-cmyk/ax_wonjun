import { createActions } from './modules/actions.js';
import { createCopilot } from './modules/copilot.js';
import { bindEvents } from './modules/events.js';
import { mountIcons } from './modules/icons.js';
import { renderApp } from './modules/render.js';
import { createStore } from './modules/state.js';
import { toast } from './modules/view/dom.js';

mountIcons();
const store = createStore();
const copilot = createCopilot(() => store.get());
let actions;
const paint = () => {
  const state = store.get();
  renderApp(state, actions);
  copilot.render(state);
};
actions = createActions({ store, paint, notify: toast });
bindEvents(actions);
paint();
