export const $ = selector => document.querySelector(selector);
export const $$ = selector => document.querySelectorAll(selector);

let toastTimer;
export const escapeHtml = value => String(value).replace(/[&<>"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]);

export function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('show'), 2200);
}

export function openView(id) {
  $$('.nav-btn').forEach(button => {
    const active = button.dataset.view === id;
    button.classList.toggle('active', active);
    button.setAttribute('aria-current', active ? 'page' : 'false');
  });
  $$('.view').forEach(view => view.classList.toggle('active', view.id === id));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
