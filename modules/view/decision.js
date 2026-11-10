import { candidates, evidence } from '../data.js';
import { impacts, isReady, selectedCandidate } from '../domain.js';
import { $, $$ } from './dom.js';

export function renderCandidates(state, onSelect) {
  $('#candidateList').innerHTML = candidates.map(candidate => `
    <button class="candidate ${state.selected === candidate.id ? 'selected' : ''}" data-candidate="${candidate.id}" aria-pressed="${state.selected === candidate.id}">
      <div class="candidate-info"><strong>${candidate.id} · ${candidate.name}</strong><span>가상 후보 · 실측 자료 미제공</span></div>
      ${[0, 1, 2, 3].map(() => '<span class="candidate-metric">미확인</span>').join('')}
      <span class="candidate-score"><strong>산정 불가</strong></span>
    </button>`).join('');
  $$('[data-candidate]').forEach(button => button.onclick = () => onSelect(button.dataset.candidate));
}

export function renderEvidence(state, onChange) {
  $('#evidenceList').innerHTML = evidence.map(item => `
    <div class="check ${item.required ? '' : 'optional'}"><label><input type="checkbox" data-evidence="${item.id}" ${state.checks[item.id] ? 'checked' : ''}>${item.label}</label><span class="${item.required ? 'pill warn' : 'source mock'}">${item.required ? '필수' : '확장'}</span></div>`).join('');
  $$('[data-evidence]').forEach(input => input.onchange = () => onChange(input.dataset.evidence, input.checked, input.parentElement.textContent.trim()));
}

function renderFlow(state, ready) {
  const steps = ['충격 감지','영향 계산','증빙 확인','사람 승인','발주 요청','계획 반영'];
  const current = state.status === '승인 완료' ? 6 : state.status === '승인 거절' ? 3 : ready ? 3 : state.ran ? 2 : 1;
  $('#flow').innerHTML = steps.map((step,index) => `${index ? '<span class="arrow">›</span>' : ''}<span class="step ${index < current ? 'done' : index === current ? 'current' : ''}">${step}</span>`).join('');
}

export function renderGate(state) {
  const ready = isReady(state), candidate = selectedCandidate(state), impact = impacts(state);
  $('#approveBtn').disabled = !ready;
  $('#gatePill').className = `pill ${ready ? 'ok' : 'warn'}`;
  $('#gatePill').textContent = ready ? '모의 승인 가능' : '확인 필요';
  $('#gateAlert').className = `alert ${ready ? 'ok' : ''}`;
  $('#gateAlert').innerHTML = ready ? '<span>✓</span><div><b>필수 증빙이 화면에서 체크됐습니다.</b><br>실제 증빙 파일 검증이나 사용 승인은 수행되지 않았습니다.</div>' : '<span>!</span><div><b>필수 증빙 체크가 필요합니다.</b><br>이 화면은 시연용이며 실제 시험 파일은 연결되지 않았습니다.</div>';
  $('#aiSummary').textContent = `데이터룸 재계산: ${impact.critical.id}는 예정 발주 도착 전 ${impact.exposureDays}일의 재고 노출이 있습니다. 운송중 물량의 도착일은 없어 제외했습니다. ${candidate.id}는 실측 자료가 없어 점수를 매길 수 없습니다. ${ready ? '화면의 증빙 체크는 모의 입력이며 최종 판단은 승인권자에게 있습니다.' : '필수 증빙이 누락되어 모의 승인도 진행할 수 없습니다.'}`;
  renderFlow(state, ready);
}
