import { $, escapeHtml } from './dom.js';
export { renderTasks } from './task-grid.js';

export function renderLog(state) {
  $('#auditLog').innerHTML = state.logs.length
    ? state.logs.map(item => `<div class="log-row"><div class="log-time">오늘 ${escapeHtml(item.time)}</div><div class="log-line"><i class="log-dot"></i></div><div class="log-body"><b>${escapeHtml(item.title)}</b><span>${escapeHtml(item.detail)}</span></div></div>`).join('')
    : '<div class="empty">아직 기록된 의사결정이 없습니다.</div>';
}
