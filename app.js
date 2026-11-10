const candidates = [
  { id: 'ALT-B1', name: '동등 규격 후보 A', quality: 94, lead: 86, cost: 72, resilience: 88, price: 12, days: 18 },
  { id: 'ALT-B2', name: '국내 공급 후보 B', quality: 88, lead: 96, cost: 80, resilience: 95, price: 8, days: 9 },
  { id: 'ALT-B3', name: '저비용 후보 C', quality: 79, lead: 73, cost: 96, resilience: 68, price: -6, days: 28 }
];

const evidence = [
  { id: 'spec', label: '성분·규격 비교표', required: true },
  { id: 'test', label: '품질 시험 결과', required: true },
  { id: 'reg', label: '규제·안전성 검토', required: true },
  { id: 'sample', label: '샘플 생산 결과', required: true },
  { id: 'site', label: '공급처 현장 확인', required: false }
];

const initialState = { delay: 0, supply: 100, selected: 'ALT-B1', checks: {}, status: '검토 준비', ran: false, tasks: [], logs: [] };
const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('materialswitch-state') || '{}');
    const selected = candidates.some(item => item.id === saved.selected) ? saved.selected : initialState.selected;
    return {
      ...initialState,
      ...saved,
      delay: Math.max(0, Math.min(45, Number(saved.delay) || 0)),
      supply: Math.max(20, Math.min(100, Number(saved.supply) || 100)),
      selected,
      checks: saved.checks && typeof saved.checks === 'object' ? saved.checks : {},
      tasks: Array.isArray(saved.tasks) ? saved.tasks.slice(0, 50) : [],
      logs: Array.isArray(saved.logs) ? saved.logs.slice(0, 30) : []
    };
  } catch {
    localStorage.removeItem('materialswitch-state');
    return { ...initialState };
  }
}

let state = loadState();
let toastTimer;

function save() { localStorage.setItem('materialswitch-state', JSON.stringify(state)); }
function currentCandidate() { return candidates.find(item => item.id === state.selected) || candidates[0]; }
function time() { return new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' }).format(new Date()); }
function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('show'), 2200);
}
function log(title, detail) {
  state.logs.unshift({ time: time(), title, detail });
  state.logs = state.logs.slice(0, 30);
  save();
  renderLog();
}

function impacts() {
  const shortage = Math.max(0, Math.round(state.delay - (state.supply - 20) / 8));
  const cost = Math.max(0, (100 - state.supply) * .18 + state.delay * .22);
  return { shortage, cost, campaign: Math.max(0, shortage - 5) };
}

function score(candidate) {
  const shock = (100 - state.supply) / 10 + state.delay / 10;
  return Math.max(0, Math.min(100, Math.round(candidate.quality * .4 + candidate.lead * .25 + candidate.cost * .15 + candidate.resilience * .2 - shock * (100 - candidate.resilience) / 100)));
}

function ready() { return evidence.filter(item => item.required).every(item => state.checks[item.id]); }

function renderCandidates() {
  $('#candidateList').innerHTML = candidates.map(candidate => `
    <button class="candidate ${state.selected === candidate.id ? 'selected' : ''}" data-candidate="${candidate.id}" aria-pressed="${state.selected === candidate.id}">
      <div><h3>${candidate.id} · ${candidate.name} <span class="source mock">모의</span></h3><div class="candidate-meta"><span>리드타임 ${candidate.days}일</span><span>비용 ${candidate.price >= 0 ? '+' : ''}${candidate.price}%</span><span>${candidate.resilience >= 85 ? '복수 조달 가능' : '회복력 확인 필요'}</span></div></div>
      <div class="score">${score(candidate)}<small>/ 100</small></div>
      <div class="score-bars">${[['품질',candidate.quality],['납기',candidate.lead],['비용',candidate.cost],['회복력',candidate.resilience]].map(metric => `<div class="metric">${metric[0]} ${metric[1]}<div class="bar"><i style="width:${metric[1]}%"></i></div></div>`).join('')}</div>
    </button>`).join('');
  $$('[data-candidate]').forEach(button => button.onclick = () => {
    state.selected = button.dataset.candidate;
    state.status = '후보 선택';
    save(); render(); log('후보 변경', `${state.selected} 후보를 검토 대상으로 선택`);
  });
}

function renderEvidence() {
  $('#evidenceList').innerHTML = evidence.map(item => `
    <div class="check ${item.required ? '' : 'optional'}"><label><input type="checkbox" data-evidence="${item.id}" ${state.checks[item.id] ? 'checked' : ''}>${item.label}</label><span class="${item.required ? 'pill warn' : 'source mock'}">${item.required ? '필수' : '확장'}</span></div>`).join('');
  $$('[data-evidence]').forEach(input => input.onchange = () => {
    state.checks[input.dataset.evidence] = input.checked;
    state.status = '증빙 확인 중';
    save(); render();
    log('증빙 상태 변경', `${input.parentElement.textContent.trim()} · ${input.checked ? '확인' : '미확인'}`);
  });
}

function renderFlow(isReady) {
  const steps = ['충격 감지','영향 계산','증빙 확인','사람 승인','발주 요청','계획 반영'];
  const current = state.status === '승인 완료' ? 6 : state.status === '승인 거절' ? 3 : isReady ? 3 : state.ran ? 2 : 1;
  $('#flow').innerHTML = steps.map((step,index) => `${index ? '<span class="arrow">›</span>' : ''}<span class="step ${index < current ? 'done' : index === current ? 'current' : ''}">${step}</span>`).join('');
}

function renderGate() {
  const isReady = ready(), candidate = currentCandidate(), impact = impacts();
  $('#approveBtn').disabled = !isReady;
  $('#gatePill').className = `pill ${isReady ? 'ok' : 'warn'}`;
  $('#gatePill').textContent = isReady ? '승인 가능' : '확인 필요';
  $('#gateAlert').className = `alert ${isReady ? 'ok' : ''}`;
  $('#gateAlert').innerHTML = isReady ? '<span>✓</span><div><b>필수 증빙이 모두 확인됐습니다.</b><br>승인권자가 최종 결정을 내릴 수 있습니다.</div>' : '<span>!</span><div><b>승인 전 증빙 확인이 필요합니다.</b><br>누락 자료가 있으면 사용 승인을 차단합니다.</div>';
  $('#aiSummary').textContent = `AI 요약: ${candidate.id}는 현재 ${score(candidate)}점입니다. ${impact.shortage ? `공급 공백 ${impact.shortage}일과 캠페인 ${impact.campaign}일 지연 가능성이 있습니다.` : '즉시 공급 공백은 계산되지 않았습니다.'} ${isReady ? '필수 증빙은 확인됐으나 최종 안전성 판단은 승인권자에게 있습니다.' : '필수 증빙이 누락되어 승인할 수 없습니다.'}`;
  renderFlow(isReady);
}

function renderImpacts() {
  const impact = impacts();
  $('#delay').value = state.delay; $('#supply').value = state.supply;
  $('#delayValue').textContent = `${state.delay}일`; $('#supplyValue').textContent = `${state.supply}%`;
  $('#shortageDays').textContent = `${impact.shortage}일`; $('#costChange').textContent = `+${impact.cost.toFixed(1)}%`; $('#campaignDelay').textContent = impact.campaign ? `${impact.campaign}일 지연` : '영향 없음';
  $('#shortageImpact').className = `impact-item ${impact.shortage > 7 ? 'danger' : impact.shortage ? 'warn' : ''}`;
  $('#costImpact').className = `impact-item ${impact.cost > 10 ? 'danger' : impact.cost ? 'warn' : ''}`;
  $('#campaignImpact').className = `impact-item ${impact.campaign ? 'danger' : ''}`;
  $('#gapKpi').textContent = `${impact.shortage}일`; $('#gapCaption').textContent = impact.shortage ? '대체 조달 없을 때 예상' : '기본 조건에서는 공백 없음';
  $('#statusKpi').textContent = state.status; $('#statusCaption').textContent = state.status === '승인 완료' ? '후속 작업이 생성됐습니다' : state.status === '승인 거절' ? '보완 작업이 생성됐습니다' : ready() ? '최종 승인 가능' : '필수 증빙을 확인하세요';
  const resilience = { supply: Math.max(5, Math.round(state.supply - state.delay * 1.2)), production: Math.max(5, Math.round(100 - impact.shortage * 4 - (100-state.supply) * .35)), campaign: Math.max(5, Math.round(100 - impact.campaign * 6 - (100-state.supply) * .15)) };
  Object.entries(resilience).forEach(([name,value]) => { const bar = $(`#${name}Bar`); bar.style.width = `${value}%`; bar.className = `compare-current ${value < 50 ? 'danger' : value < 75 ? 'warn' : ''}`; $(`#${name}Score`).textContent = value; });
  $('#visualNarrative').textContent = resilience.supply < 50 ? '공급 충격이 생산과 캠페인으로 전파될 위험이 큽니다.' : resilience.production < 75 ? '대체 조달과 생산계획 재검토가 필요합니다.' : '현재 조건에서 안정적으로 운영 가능합니다.';
}

function renderTasks() {
  const container = $('#taskTable');
  if (!state.tasks.length) { container.innerHTML = '<div class="empty">아직 생성된 작업이 없습니다. 증빙 확인 후 승인하거나 거절해 보세요.</div>'; return; }
  container.innerHTML = `<div class="table-wrap"><table><thead><tr><th>업무 ID</th><th>담당</th><th>업무</th><th>상태</th><th>근거</th><th>처리</th></tr></thead><tbody>${state.tasks.map(task => `<tr><td class="mono">${task.id}</td><td>${task.owner}</td><td>${task.title}</td><td><span class="pill ${task.status === '완료' ? 'ok' : 'warn'}">${task.status}</span></td><td>${task.basis}</td><td><button class="task-action" data-task="${task.id}" ${task.status === '완료' ? 'disabled' : ''}>${task.status === '완료' ? '완료됨' : '완료 처리'}</button></td></tr>`).join('')}</tbody></table></div>`;
  $$('[data-task]').forEach(button => button.onclick = () => { const task = state.tasks.find(item => item.id === button.dataset.task); if (!task || task.status === '완료') return; task.status = '완료'; save(); renderTasks(); log('후속 작업 완료', `${task.owner} · ${task.title}`); toast('작업 상태를 완료로 변경했습니다'); });
}

function renderLog() {
  const container = $('#auditLog');
  container.innerHTML = state.logs.length ? state.logs.map(item => `<div class="log-row"><div class="log-time">오늘 ${item.time}</div><div class="log-line"><i class="log-dot"></i></div><div class="log-body"><b>${item.title}</b><span>${item.detail}</span></div></div>`).join('') : '<div class="empty">아직 기록된 의사결정이 없습니다.</div>';
}

function updateCopilot() {
  const impact = impacts(), candidate = currentCandidate(), missing = evidence.filter(item => item.required && !state.checks[item.id]).length;
  $('#copilotSummary').textContent = impact.shortage ? `현재 조건에서는 ${impact.shortage}일의 공급 공백과 ${impact.campaign}일의 캠페인 지연이 예상됩니다. ${candidate.id} 전환 검토를 우선 실행하세요.` : '현재 조건에서는 즉시 공급 공백이 예상되지 않습니다. 다만 V‑205 단일 공급 구조는 지속적인 모니터링이 필요합니다.';
  $('#copilotRisk').textContent = impact.shortage > 7 ? '높은 위험' : impact.shortage ? '주의 필요' : '모니터링';
  $('#copilotCandidate').textContent = `${candidate.id} · ${score(candidate)}점`; $('#copilotGap').textContent = `${impact.shortage}일`; $('#copilotEvidence').textContent = missing ? `${missing}건 확인 필요` : '필수 증빙 완료';
  $('#contextScenario').textContent = state.delay || state.supply < 100 ? `지연 ${state.delay}일 · 공급 ${state.supply}%` : '기본 조건';
}

function render() { renderCandidates(); renderEvidence(); renderGate(); renderImpacts(); renderTasks(); renderLog(); updateCopilot(); }

function setScenario(type) {
  const scenarios = { normal: [0,100,{spec:true,test:true,reg:true,sample:true,site:false}], delay: [15,100,{spec:true,test:true,reg:true,sample:true,site:true}], shortage: [0,50,{spec:true,test:true,reg:true,sample:true,site:true}], missing: [15,50,{spec:true,test:false,reg:true,sample:false,site:false}] };
  const scenario = scenarios[type] || scenarios.normal;
  state.delay = scenario[0]; state.supply = scenario[1]; state.checks = scenario[2]; state.ran = true; state.status = type === 'missing' ? '증빙 보완 필요' : '재평가 완료';
  $$('.scenario-btn').forEach(button => button.classList.toggle('active', button.dataset.scenario === type));
  save(); render(); log('시연 시나리오 적용', `${type} 조건 · 지연 ${state.delay}일 · 공급 ${state.supply}%`);
}

function openView(id) {
  $$('.nav-btn').forEach(button => { const active = button.dataset.view === id; button.classList.toggle('active', active); button.setAttribute('aria-current', active ? 'page' : 'false'); });
  $$('.view').forEach(view => view.classList.toggle('active', view.id === id));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function aiReply(query) {
  const impact = impacts(), candidate = currentCandidate(), missing = evidence.filter(item => item.required && !state.checks[item.id]).map(item => item.label);
  if (query.includes('50%')) return '공급량 50% 조건은 긴급조달 비용과 생산 준비도를 동시에 낮춥니다. 워크벤치에서 해당 시나리오를 적용해 후보 점수와 캠페인 영향을 함께 확인하세요.';
  if (query.includes('증빙') || query.includes('부족')) return missing.length ? `현재 미확인 필수 증빙은 ${missing.join(', ')}입니다. 모두 확인되기 전에는 승인 요청이 차단됩니다.` : '필수 증빙 4건이 모두 확인됐습니다. 최종 안전성 판단과 승인은 담당자가 수행해야 합니다.';
  if (query.includes('후보') || query.includes('비교')) return `${candidate.id}가 현재 ${score(candidate)}점으로 선택되어 있습니다. 품질, 납기, 비용, 회복력의 가중 점수이며 품질 승인을 대신하지 않습니다.`;
  return `현재 예상 공급 공백은 ${impact.shortage}일, 긴급조달 비용 변화는 +${impact.cost.toFixed(1)}%입니다. ${candidate.id} 후보와 증빙 상태를 우선 검토하세요.`;
}

function submitAI(query) {
  const value = query.trim(); if (!value) return;
  const thread = $('#aiThread'), user = document.createElement('div'); user.className = 'user-message'; user.textContent = value; thread.appendChild(user);
  const loading = document.createElement('div'); loading.className = 'assistant-message'; loading.innerHTML = '<span class="message-icon">✦</span><div class="message-body"><b>분석 중</b><div class="typing"><i></i><i></i><i></i></div></div>'; thread.appendChild(loading); thread.scrollTop = thread.scrollHeight;
  setTimeout(() => { loading.remove(); const message = document.createElement('div'), icon = document.createElement('span'), body = document.createElement('div'), title = document.createElement('b'), answer = document.createElement('span'); message.className = 'assistant-message'; icon.className = 'message-icon'; icon.textContent = '✦'; body.className = 'message-body'; title.textContent = '컨텍스트 기반 분석'; answer.textContent = aiReply(value); body.append(title, answer); message.append(icon, body); thread.appendChild(message); thread.scrollTop = thread.scrollHeight; }, 420);
}

$$('.nav-btn').forEach(button => button.onclick = () => openView(button.dataset.view));
$$('[data-goto]').forEach(button => button.onclick = () => openView(button.dataset.goto));
$$('[data-demo]').forEach(button => button.onclick = () => { setScenario(button.dataset.demo); openView('workbench'); });
$$('.scenario-btn').forEach(button => button.onclick = () => setScenario(button.dataset.scenario));
$('#delay').oninput = event => { state.delay = Number(event.target.value); save(); renderImpacts(); renderCandidates(); renderGate(); updateCopilot(); };
$('#supply').oninput = event => { state.supply = Number(event.target.value); save(); renderImpacts(); renderCandidates(); renderGate(); updateCopilot(); };
$('#runBtn').onclick = () => { state.ran = true; state.status = impacts().shortage ? '대체 조달 검토' : '재평가 완료'; save(); render(); log('스트레스 테스트 실행', `납기 지연 ${state.delay}일 · 공급 ${state.supply}% · 예상 공백 ${impacts().shortage}일`); toast('위험과 후보 점수를 다시 계산했습니다'); };
$('#resetBtn').onclick = () => { state = { ...initialState, tasks: state.tasks, logs: state.logs }; $$('.scenario-btn').forEach(button => button.classList.toggle('active', button.dataset.scenario === 'normal')); save(); render(); toast('입력 조건을 초기화했습니다'); };
$('#approveBtn').onclick = () => { if (!ready()) return; if (state.status === '승인 완료') { toast('이미 승인되어 후속 작업이 생성됐습니다'); return; } const candidate = currentCandidate(), suffix = Date.now().toString().slice(-5); state.status = '승인 완료'; state.tasks.unshift({id:`PO-RQ-${suffix}`,owner:'조달팀',title:`${candidate.id} 대체 원료 발주 요청`,status:'생성',basis:'품질 승인 완료'},{id:`PLAN-${suffix}`,owner:'생산팀',title:'PL-02 생산계획 갱신',status:'생성',basis:`대체 원료 ${candidate.id}`},{id:`MKT-${suffix}`,owner:'Masil 운영팀',title:'SKU-1001~1004 일정 검토',status:'생성',basis:`예상 지연 ${impacts().campaign}일`}); save(); render(); log('대체 원료 사용 승인', `${candidate.id} 승인 · 후속 작업 3건 생성`); toast('승인 완료 · 후속 작업 3건을 생성했습니다'); };
$('#rejectBtn').onclick = () => { const candidate = currentCandidate(), suffix = Date.now().toString().slice(-5); state.status = '승인 거절'; state.tasks.unshift({id:`QA-${suffix}`,owner:'품질팀',title:`${candidate.id} 보완 시험 및 다른 후보 검토`,status:'확인 필요',basis:'사용 승인 거절'}); save(); render(); log('대체 원료 사용 승인 거절', `${candidate.id} 사용 차단 · 보완 시험 작업 생성`); toast('사용을 차단하고 보완 작업을 생성했습니다'); };
$('#clearTasks').onclick = () => { state.tasks = []; state.logs = []; state.status = '검토 준비'; save(); render(); toast('모의 실행 결과를 초기화했습니다'); };
$('#aiForm').onsubmit = event => { event.preventDefault(); const input = $('#aiInput'), value = input.value; input.value = ''; submitAI(value); };
$$('[data-ai-query]').forEach(button => button.onclick = () => submitAI(button.dataset.aiQuery));
$('#commandTrigger').onclick = () => { $('#aiRail').classList.add('open'); $('#aiInput').focus(); };
$('#aiClose').onclick = () => $('#aiRail').classList.remove('open');
document.addEventListener('keydown', event => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); $('#aiRail').classList.add('open'); $('#aiInput').focus(); } if (event.key === 'Escape') $('#aiRail').classList.remove('open'); });

render();
