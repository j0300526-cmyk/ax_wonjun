import { $, escapeHtml } from './dom.js';

let grid;
let signature;
let onCompleteTask;
let bound = false;

const columns = () => {
  const { html } = window.gridjs;
  return [
    { name: '업무 ID', formatter: value => html(`<span class="mono">${escapeHtml(value)}</span>`) },
    '담당',
    '업무',
    { name: '상태', formatter: value => html(`<span class="pill ${value === '완료' ? 'ok' : 'warn'}">${escapeHtml(value)}</span>`) },
    '근거',
    { name: '처리', sort: false, formatter: (value, row) => html(`<button class="task-action" data-task="${escapeHtml(row.cells[0].data)}" ${row.cells[3].data === '완료' ? 'disabled' : ''}>${row.cells[3].data === '완료' ? '완료됨' : '완료 처리'}</button>`) }
  ];
};

const rows = tasks => tasks.map(task => [task.id, task.owner, task.title, task.status, task.basis, task.id]);

export function renderTasks(state, onComplete) {
  const container = $('#taskTable');
  onCompleteTask = onComplete;
  if (!bound) {
    container.addEventListener('click', event => {
      const button = event.target.closest('[data-task]');
      if (button && !button.disabled) onCompleteTask(button.dataset.task);
    });
    bound = true;
  }

  const nextSignature = JSON.stringify(state.tasks);
  if (nextSignature === signature) return;
  signature = nextSignature;

  if (!state.tasks.length) {
    if (grid) grid.destroy();
    grid = null;
    container.innerHTML = '<div class="empty">아직 생성된 작업이 없습니다. 증빙 확인 후 승인하거나 거절해 보세요.</div>';
    return;
  }

  if (!window.gridjs) throw new Error('작업 표 모듈을 불러오지 못했습니다.');
  if (grid) {
    grid.updateConfig({ data: rows(state.tasks) }).forceRender();
    return;
  }
  container.innerHTML = '';
  grid = new window.gridjs.Grid({
    columns: columns(),
    data: rows(state.tasks),
    search: true,
    sort: true,
    pagination: { limit: 8, summary: false },
    className: { container: 'execution-grid' },
    language: {
      search: { placeholder: '업무 ID·담당·내용 검색' },
      noRecordsFound: '일치하는 작업이 없습니다',
      pagination: { previous: '이전', next: '다음' }
    }
  }).render(container);
}
