import { impacts, missingEvidence, score, selectedCandidate } from './domain.js';
import { $, $$ } from './render.js';

function reply(state, query) {
  const impact = impacts(state), candidate = selectedCandidate(state), missing = missingEvidence(state);
  if (query.includes('50%')) return '공급량 50% 조건은 긴급조달 비용과 생산 준비도를 동시에 낮춥니다. 워크벤치에서 해당 시나리오를 적용해 후보 점수와 캠페인 영향을 함께 확인하세요.';
  if (query.includes('증빙') || query.includes('부족')) return missing.length ? `현재 미확인 필수 증빙은 ${missing.map(item => item.label).join(', ')}입니다. 모두 확인되기 전에는 승인 요청이 차단됩니다.` : '필수 증빙 4건이 모두 확인됐습니다. 최종 안전성 판단과 승인은 담당자가 수행해야 합니다.';
  if (query.includes('후보') || query.includes('비교')) return `${candidate.id}가 현재 ${score(state, candidate)}점으로 선택되어 있습니다. 품질, 납기, 비용, 회복력의 가중 점수이며 품질 승인을 대신하지 않습니다.`;
  return `현재 예상 공급 공백은 ${impact.shortage}일, 긴급조달 비용 변화는 +${impact.cost.toFixed(1)}%입니다. ${candidate.id} 후보와 증빙 상태를 우선 검토하세요.`;
}

function appendAnswer(getState, query) {
  const value = query.trim();
  if (!value) return;

  const thread = $('#aiThread');
  const user = document.createElement('div');
  user.className = 'user-message';
  user.textContent = value;
  thread.appendChild(user);

  const loading = document.createElement('div');
  loading.className = 'assistant-message';
  loading.innerHTML = '<span class="message-icon">✦</span><div class="message-body"><b>분석 중</b><div class="typing"><i></i><i></i><i></i></div></div>';
  thread.appendChild(loading);
  thread.scrollTop = thread.scrollHeight;

  setTimeout(() => {
    loading.remove();
    const message = document.createElement('div');
    const icon = document.createElement('span');
    const body = document.createElement('div');
    const title = document.createElement('b');
    const answer = document.createElement('span');
    message.className = 'assistant-message'; icon.className = 'message-icon'; body.className = 'message-body';
    icon.textContent = '✦'; title.textContent = '컨텍스트 기반 분석'; answer.textContent = reply(getState(), value);
    body.append(title, answer); message.append(icon, body); thread.appendChild(message);
    thread.scrollTop = thread.scrollHeight;
  }, 420);
}

export function createCopilot(getState) {
  const open = () => { $('#aiRail').classList.add('open'); $('#aiInput').focus(); };
  const close = () => $('#aiRail').classList.remove('open');

  $('#aiForm').onsubmit = event => {
    event.preventDefault();
    const input = $('#aiInput');
    const value = input.value;
    input.value = '';
    appendAnswer(getState, value);
  };
  $$('[data-ai-query]').forEach(button => button.onclick = () => appendAnswer(getState, button.dataset.aiQuery));
  $('#commandTrigger').onclick = open;
  $('#aiClose').onclick = close;
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); open(); }
    if (event.key === 'Escape') close();
  });

  return {
    render(state) {
      const impact = impacts(state), candidate = selectedCandidate(state), missing = missingEvidence(state).length;
      $('#copilotSummary').textContent = impact.shortage ? `현재 조건에서는 ${impact.shortage}일의 공급 공백과 ${impact.campaign}일의 캠페인 지연이 예상됩니다. ${candidate.id} 전환 검토를 우선 실행하세요.` : '현재 조건에서는 즉시 공급 공백이 예상되지 않습니다. 다만 V‑205 단일 공급 구조는 지속적인 모니터링이 필요합니다.';
      $('#copilotRisk').textContent = impact.shortage > 7 ? '높은 위험' : impact.shortage ? '주의 필요' : '모니터링';
      $('#copilotCandidate').textContent = `${candidate.id} · ${score(state, candidate)}점`;
      $('#copilotGap').textContent = `${impact.shortage}일`;
      $('#copilotEvidence').textContent = missing ? `${missing}건 확인 필요` : '필수 증빙 완료';
      $('#contextScenario').textContent = state.delay || state.supply < 100 ? `지연 ${state.delay}일 · 공급 ${state.supply}%` : '기본 조건';
    }
  };
}
