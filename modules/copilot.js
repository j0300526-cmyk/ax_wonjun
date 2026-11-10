import { impacts, missingEvidence, selectedCandidate } from './domain.js';
import { $, $$ } from './render.js';
import { icon } from './icons.js';

function reply(state, query) {
  const impact = impacts(state), candidate = selectedCandidate(state), missing = missingEvidence(state);
  if (query.includes('50%')) return '공급량 50%는 기록된 발주액 중 절반이 미공급되는 시나리오입니다. 이는 비용 증가율이 아니라 미공급분의 계약금액입니다.';
  if (query.includes('증빙') || query.includes('부족')) return missing.length ? `화면에서 체크되지 않은 필수 항목은 ${missing.map(item => item.label).join(', ')}입니다. 실제 증빙 파일은 연결되지 않았습니다.` : '필수 항목 4건이 화면에서 체크됐습니다. 실제 파일 검증과 사용 승인은 수행되지 않았습니다.';
  if (query.includes('후보') || query.includes('비교')) return `${candidate.id}는 시연용 가상 후보입니다. 후보별 시험 결과, 실제 납기, 견적이 없어 비교 점수를 산정할 수 없습니다.`;
  return `${impact.critical.id}의 예정 발주 도착 전 재고 노출은 ${impact.exposureDays}일입니다. 공급량 조건에 따른 미공급 발주액은 ${impact.unfilledOrderEok.toFixed(2)}억원입니다. 운송중 재고 도착일이 없어 실제 품절 예측은 아닙니다.`;
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
  loading.innerHTML = `<span class="message-icon">${icon('sparkles')}</span><div class="message-body"><b>분석 중</b><div class="typing"><i></i><i></i><i></i></div></div>`;
  thread.appendChild(loading);
  thread.scrollTop = thread.scrollHeight;

  setTimeout(() => {
    loading.remove();
    const message = document.createElement('div');
    const iconElement = document.createElement('span');
    const body = document.createElement('div');
    const title = document.createElement('b');
    const answer = document.createElement('span');
    message.className = 'assistant-message'; iconElement.className = 'message-icon'; body.className = 'message-body';
    iconElement.innerHTML = icon('sparkles'); title.textContent = '컨텍스트 기반 분석'; answer.textContent = reply(getState(), value);
    body.append(title, answer); message.append(iconElement, body); thread.appendChild(message);
    thread.scrollTop = thread.scrollHeight;
  }, 420);
}

export function createCopilot(getState) {
  const shell = $('#appShell');
  const trigger = $('#commandTrigger');
  const open = () => {
    shell.classList.add('ai-open');
    trigger.setAttribute('aria-expanded', 'true');
    window.setTimeout(() => $('#aiInput').focus(), 180);
  };
  const close = () => {
    shell.classList.remove('ai-open');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus();
  };

  $('#aiForm').onsubmit = event => {
    event.preventDefault();
    const input = $('#aiInput');
    const value = input.value;
    input.value = '';
    appendAnswer(getState, value);
  };
  $$('[data-ai-query]').forEach(button => button.onclick = () => appendAnswer(getState, button.dataset.aiQuery));
  trigger.onclick = open;
  $('#aiClose').onclick = close;
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); open(); }
    if (event.key === 'Escape') close();
  });

  return {
    render(state) {
      const impact = impacts(state), candidate = selectedCandidate(state), missing = missingEvidence(state).length;
      $('#copilotSummary').textContent = `${impact.critical.id}는 예정 발주 도착 전 ${impact.exposureDays}일의 재고 노출이 있습니다. 운송중 물량의 도착일이 없어 실제 품절일은 산정할 수 없습니다.`;
      $('#copilotRisk').textContent = '추가 확인 필요';
      $('#copilotCandidate').textContent = '후보 점수 산정 불가';
      $('#copilotGap').textContent = `${impact.exposureDays}일`;
      $('#copilotEvidence').textContent = missing ? `${missing}건 확인 필요` : '필수 증빙 완료';
      $('#contextScenario').textContent = state.delay || state.supply < 100 ? `지연 ${state.delay}일 · 공급 ${state.supply}%` : '기본 조건';
    }
  };
}
