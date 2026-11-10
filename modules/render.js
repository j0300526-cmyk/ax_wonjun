import { candidates, evidence } from './data.js';
import { impacts, isReady, resilience, score, selectedCandidate } from './domain.js';

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
      <div class="candidate-info"><strong>${candidate.id} · ${candidate.name}</strong><span>리드타임 ${candidate.days}일 · 비용 ${candidate.price >= 0 ? '+' : ''}${candidate.price}% · ${candidate.resilience >= 85 ? '복수 조달 가능' : '회복력 확인 필요'}</span></div>
      ${[candidate.quality, candidate.lead, candidate.cost, candidate.resilience].map(value => `<span class="candidate-metric">${value}<span class="mini-track"><i style="width:${value}%"></i></span></span>`).join('')}
      <span class="candidate-score"><strong>${score(state, candidate)}</strong><span>/100</span></span>
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
  $('#gatePill').textContent = ready ? '승인 가능' : '확인 필요';
  $('#gateAlert').className = `alert ${ready ? 'ok' : ''}`;
  $('#gateAlert').innerHTML = ready ? '<span>✓</span><div><b>필수 증빙이 모두 확인됐습니다.</b><br>승인권자가 최종 결정을 내릴 수 있습니다.</div>' : '<span>!</span><div><b>승인 전 증빙 확인이 필요합니다.</b><br>누락 자료가 있으면 사용 승인을 차단합니다.</div>';
  $('#aiSummary').textContent = `AI 요약: ${candidate.id}는 현재 ${score(state, candidate)}점입니다. ${impact.shortage ? `공급 공백 ${impact.shortage}일과 캠페인 ${impact.campaign}일 지연 가능성이 있습니다.` : '즉시 공급 공백은 계산되지 않았습니다.'} ${ready ? '필수 증빙은 확인됐으나 최종 안전성 판단은 승인권자에게 있습니다.' : '필수 증빙이 누락되어 승인할 수 없습니다.'}`;
  renderFlow(state, ready);
}

function renderImpacts(state) {
  const impact = impacts(state), recovery = resilience(state);
  $('#delay').value = state.delay; $('#supply').value = state.supply;
  $('#delayValue').textContent = `${state.delay}일`; $('#supplyValue').textContent = `${state.supply}%`;
  $('#shortageDays').textContent = `${impact.shortage}일`; $('#costChange').textContent = `+${impact.cost.toFixed(1)}%`; $('#campaignDelay').textContent = impact.campaign ? `${impact.campaign}일 지연` : '영향 없음';
  $('#shortageImpact').className = `impact-item ${impact.shortage > 7 ? 'danger' : impact.shortage ? 'warn' : ''}`;
  $('#costImpact').className = `impact-item ${impact.cost > 10 ? 'danger' : impact.cost ? 'warn' : ''}`;
  $('#campaignImpact').className = `impact-item ${impact.campaign ? 'danger' : ''}`;
  $('#gapKpi').textContent = `${impact.shortage}일`; $('#gapCaption').textContent = impact.shortage ? '대체 조달 없을 때 예상' : '기본 조건에서는 공백 없음';
  $('#statusKpi').textContent = state.status; $('#statusCaption').textContent = state.status === '승인 완료' ? '후속 작업이 생성됐습니다' : state.status === '승인 거절' ? '보완 작업이 생성됐습니다' : isReady(state) ? '최종 승인 가능' : '필수 증빙을 확인하세요';
  $('#overviewGap').textContent = impact.shortage;
  $('#overviewGapCaption').textContent = impact.shortage ? `현재 입력에서 ${impact.shortage}일 위험` : '기본 시나리오 기준';
  $('#overviewStatus').textContent = state.status;
  const checkedCount = evidence.filter(item => item.required && state.checks[item.id]).length;
  $('#overviewEvidence').textContent = `${checkedCount} / ${evidence.filter(item => item.required).length}`;
  const progress = state.status === '승인 완료' ? 4 : isReady(state) ? 3 : state.ran ? 2 : 1;
  $$('.step-dots i').forEach((dot, index) => dot.classList.toggle('active', index < progress));
  Object.entries(recovery).forEach(([name,value]) => {
    const bar = $(`#${name}Bar`);
    bar.style.width = `${value}%`;
    bar.className = `compare-current ${value < 50 ? 'danger' : value < 75 ? 'warn' : ''}`;
    $(`#${name}Score`).textContent = value;
  });
  $('#visualNarrative').textContent = recovery.supply < 50 ? '공급 충격이 생산과 캠페인으로 전파될 위험이 큽니다.' : recovery.production < 75 ? '대체 조달과 생산계획 재검토가 필요합니다.' : '현재 조건에서 안정적으로 운영 가능합니다.';
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
