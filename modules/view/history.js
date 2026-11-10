import { $, $$, escapeHtml } from './dom.js';

export function renderTasks(state, onComplete) {
  const container = $('#taskTable');
  if (!state.tasks.length) {
    container.innerHTML = '<div class="empty">아직 생성된 작업이 없습니다. 증빙 확인 후 승인하거나 거절해 보세요.</div>';
    return;
  }
  container.innerHTML = `<div class="table-wrap"><table><thead><tr><th>업무 ID</th><th>담당</th><th>업무</th><th>상태</th><th>근거</th><th>처리</th></tr></thead><tbody>${state.tasks.map(task => `<tr><td class="mono">${escapeHtml(task.id)}</td><td>${escapeHtml(task.owner)}</td><td>${escapeHtml(task.title)}</td><td><span class="pill ${task.status === '완료' ? 'ok' : 'warn'}">${escapeHtml(task.status)}</span></td><td>${escapeHtml(task.basis)}</td><td><button class="task-action" data-task="${escapeHtml(task.id)}" ${task.status === '완료' ? 'disabled' : ''}>${task.status === '완료' ? '완료됨' : '완료 처리'}</button></td></tr>`).join('')}</tbody></table></div>`;
  $$('[data-task]').forEach(button => button.onclick = () => onComplete(button.dataset.task));
}

export function renderLog(state) {
  $('#auditLog').innerHTML = state.logs.length
    ? state.logs.map(item => `<div class="log-row"><div class="log-time">오늘 ${escapeHtml(item.time)}</div><div class="log-line"><i class="log-dot"></i></div><div class="log-body"><b>${escapeHtml(item.title)}</b><span>${escapeHtml(item.detail)}</span></div></div>`).join('')
    : '<div class="empty">아직 기록된 의사결정이 없습니다.</div>';
}
