import { candidates, evidence } from './data.js';
import { impacts, isReady, resilience, selectedCandidate } from './domain.js';

export const $ = selector => document.querySelector(selector);
export const $$ = selector => document.querySelectorAll(selector);

let toastTimer;
const escapeHtml = value => String(value).replace(/[&<>"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]);

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

function renderScenarioTabs(state) {
  $$('.scenario-btn').forEach(button => button.classList.toggle('active', button.dataset.scenario === state.scenario));
}

function renderCandidates(state, onSelect) {
  $('#candidateList').innerHTML = candidates.map(candidate => `
    <button class="candidate ${state.selected === candidate.id ? 'selected' : ''}" data-candidate="${candidate.id}" aria-pressed="${state.selected === candidate.id}">
      <div class="candidate-info"><strong>${candidate.id} · ${candidate.name}</strong><span>가상 후보 · 실측 자료 미제공</span></div>
      ${[0, 1, 2, 3].map(() => '<span class="candidate-metric">미확인</span>').join('')}
      <span class="candidate-score"><strong>산정 불가</strong></span>
    </button>`).join('');
  $$('[data-candidate]').forEach(button => button.onclick = () => onSelect(button.dataset.candidate));
}

function renderEvidence(state, onChange) {
  $('#evidenceList').innerHTML = evidence.map(item => `
    <div class="check ${item.required ? '' : 'optional'}"><label><input type="checkbox" data-evidence="${item.id}" ${state.checks[item.id] ? 'checked' : ''}>${item.label}</label><span class="${item.required ? 'pill warn' : 'source mock'}">${item.required ? '필수' : '확장'}</span></div>`).join('');
  $$('[data-evidence]').forEach(input => input.onchange = () => onChange(input.dataset.evidence, input.checked, input.parentElement.textContent.trim()));
}

function renderFlow(state, ready) {
  const steps = ['충격 감지','영향 계산','증빙 확인','사람 승인','발주 요청','계획 반영'];
  const current = state.status === '승인 완료' ? 6 : state.status === '승인 거절' ? 3 : ready ? 3 : state.ran ? 2 : 1;
  $('#flow').innerHTML = steps.map((step,index) => `${index ? '<span class="arrow">›</span>' : ''}<span class="step ${index < current ? 'done' : index === current ? 'current' : ''}">${step}</span>`).join('');
}

function renderGate(state) {
  const ready = isReady(state), candidate = selectedCandidate(state), impact = impacts(state);
  $('#approveBtn').disabled = !ready;
  $('#gatePill').className = `pill ${ready ? 'ok' : 'warn'}`;
  $('#gatePill').textContent = ready ? '모의 승인 가능' : '확인 필요';
  $('#gateAlert').className = `alert ${ready ? 'ok' : ''}`;
  $('#gateAlert').innerHTML = ready ? '<span>✓</span><div><b>필수 증빙이 화면에서 체크됐습니다.</b><br>실제 증빙 파일 검증이나 사용 승인은 수행되지 않았습니다.</div>' : '<span>!</span><div><b>필수 증빙 체크가 필요합니다.</b><br>이 화면은 시연용이며 실제 시험 파일은 연결되지 않았습니다.</div>';
  $('#aiSummary').textContent = `데이터룸 재계산: ${impact.critical.id}는 예정 발주 도착 전 ${impact.exposureDays}일의 재고 노출이 있습니다. 운송중 물량의 도착일은 없어 제외했습니다. ${candidate.id}는 실측 자료가 없어 점수를 매길 수 없습니다. ${ready ? '화면의 증빙 체크는 모의 입력이며 최종 판단은 승인권자에게 있습니다.' : '필수 증빙이 누락되어 모의 승인도 진행할 수 없습니다.'}`;
  renderFlow(state, ready);
}

function renderImpacts(state) {
  const impact = impacts(state), recovery = resilience(state);
  $('#delay').value = state.delay; $('#supply').value = state.supply;
  $('#delayValue').textContent = `${state.delay}일`; $('#supplyValue').textContent = `${state.supply}%`;
  $('#shortageDays').textContent = `${impact.exposureDays}일`; $('#costChange').textContent = `${impact.unfilledOrderEok.toFixed(2)}억원`; $('#campaignDelay').textContent = `${impact.exposedSkuCount}개 SKU`;
  $('#shortageImpact').className = `impact-item ${impact.exposureDays ? 'warn' : ''}`;
  $('#costImpact').className = `impact-item ${impact.unfilledOrderEok ? 'warn' : ''}`;
  $('#campaignImpact').className = `impact-item ${impact.exposedSkuCount ? 'warn' : ''}`;
  $('#gapKpi').textContent = `${impact.exposureDays}일`; $('#gapCaption').textContent = `${impact.critical.id} · 운송중 도착일 미반영`;
  $('#statusKpi').textContent = state.status; $('#statusCaption').textContent = state.status === '승인 완료' ? '모의 작업이 생성됐습니다' : state.status === '승인 거절' ? '모의 보완 작업이 생성됐습니다' : isReady(state) ? '화면 체크 완료 · 실제 파일 미검증' : '필수 항목을 체크하세요';
  $('#overviewGap').textContent = impact.exposureDays;
  $('#overviewGapCaption').textContent = `${impact.critical.id} · 예정 발주 전`;
  $('#overviewStatus').textContent = state.status;
  const checkedCount = evidence.filter(item => item.required && state.checks[item.id]).length;
  $('#overviewEvidence').textContent = `${checkedCount} / ${evidence.filter(item => item.required).length}`;
  const progress = state.status === '승인 완료' ? 4 : isReady(state) ? 3 : state.ran ? 2 : 1;
  $$('.step-dots i').forEach((dot, index) => dot.classList.toggle('active', index < progress));
  Object.entries(recovery).forEach(([name,value]) => {
    const bar = $(`#${name}Bar`);
    bar.style.width = `${value}%`;
    bar.className = `compare-current ${value < 100 ? 'warn' : ''}`;
    $(`#${name}Score`).textContent = value;
  });
  $('#visualNarrative').textContent = '기록된 재고·발주량 기준. 운송중 도착일은 미제공입니다.';
}

function renderTasks(state, onComplete) {
  const container = $('#taskTable');
  if (!state.tasks.length) {
    container.innerHTML = '<div class="empty">아직 생성된 작업이 없습니다. 증빙 확인 후 승인하거나 거절해 보세요.</div>';
    return;
  }
  container.innerHTML = `<div class="table-wrap"><table><thead><tr><th>업무 ID</th><th>담당</th><th>업무</th><th>상태</th><th>근거</th><th>처리</th></tr></thead><tbody>${state.tasks.map(task => `<tr><td class="mono">${escapeHtml(task.id)}</td><td>${escapeHtml(task.owner)}</td><td>${escapeHtml(task.title)}</td><td><span class="pill ${task.status === '완료' ? 'ok' : 'warn'}">${escapeHtml(task.status)}</span></td><td>${escapeHtml(task.basis)}</td><td><button class="task-action" data-task="${escapeHtml(task.id)}" ${task.status === '완료' ? 'disabled' : ''}>${task.status === '완료' ? '완료됨' : '완료 처리'}</button></td></tr>`).join('')}</tbody></table></div>`;
  $$('[data-task]').forEach(button => button.onclick = () => onComplete(button.dataset.task));
}

function renderLog(state) {
  $('#auditLog').innerHTML = state.logs.length
    ? state.logs.map(item => `<div class="log-row"><div class="log-time">오늘 ${escapeHtml(item.time)}</div><div class="log-line"><i class="log-dot"></i></div><div class="log-body"><b>${escapeHtml(item.title)}</b><span>${escapeHtml(item.detail)}</span></div></div>`).join('')
    : '<div class="empty">아직 기록된 의사결정이 없습니다.</div>';
}

export function renderApp(state, handlers) {
  renderScenarioTabs(state);
  renderCandidates(state, handlers.onCandidateSelect);
  renderEvidence(state, handlers.onEvidenceChange);
  renderGate(state);
  renderImpacts(state);
  renderTasks(state, handlers.onTaskComplete);
  renderLog(state);
}
