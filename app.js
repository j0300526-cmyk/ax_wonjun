import { scenarios } from './modules/data.js';
import { impacts, isReady, selectedCandidate } from './modules/domain.js';
import { createStore } from './modules/state.js';
import { $, $$, openView, renderApp, toast } from './modules/render.js';
import { createCopilot } from './modules/copilot.js';
import { mountIcons } from './modules/icons.js';

mountIcons();
const store = createStore();
const copilot = createCopilot(() => store.get());

const handlers = {
  onCandidateSelect(candidateId) {
    store.patch({ selected: candidateId, status: '후보 선택' });
    store.log('후보 변경', `${candidateId} 후보를 검토 대상으로 선택`);
    paint();
  },
  onEvidenceChange(evidenceId, checked, label) {
    store.update(state => ({ ...state, status: '증빙 확인 중', checks: { ...state.checks, [evidenceId]: checked } }));
    store.log('증빙 상태 변경', `${label} · ${checked ? '확인' : '미확인'}`);
    paint();
  },
  onTaskComplete(taskId) {
    const task = store.get().tasks.find(item => item.id === taskId);
    if (!task || task.status === '완료') return;
    store.update(state => ({ ...state, tasks: state.tasks.map(item => item.id === taskId ? { ...item, status: '완료' } : item) }));
    store.log('후속 작업 완료', `${task.owner} · ${task.title}`);
    paint();
    toast('작업 상태를 완료로 변경했습니다');
  }
};

function paint() {
  const state = store.get();
  renderApp(state, handlers);
  copilot.render(state);
}

function applyScenario(type) {
  const scenario = scenarios[type] || scenarios.normal;
  store.patch({ ...scenario, scenario: type, ran: true });
  store.log('시연 시나리오 적용', `${type} 조건 · 지연 ${scenario.delay}일 · 공급 ${scenario.supply}%`);
  paint();
}

function approve() {
  const state = store.get();
  if (!isReady(state)) return;
  if (state.status === '승인 완료') { toast('이미 승인되어 후속 작업이 생성됐습니다'); return; }

  const candidate = selectedCandidate(state);
  const suffix = Date.now().toString().slice(-5);
  const campaignDelay = impacts(state).campaign;
  const tasks = [
    { id: `PO-RQ-${suffix}`, owner: '조달팀', title: `${candidate.id} 대체 원료 발주 요청`, status: '생성', basis: '품질 승인 완료' },
    { id: `PLAN-${suffix}`, owner: '생산팀', title: 'PL-02 생산계획 갱신', status: '생성', basis: `대체 원료 ${candidate.id}` },
    { id: `MKT-${suffix}`, owner: 'Masil 운영팀', title: 'SKU-1001~1004 일정 검토', status: '생성', basis: `예상 지연 ${campaignDelay}일` }
  ];
  store.patch({ status: '승인 완료', tasks: [...tasks, ...state.tasks] });
  store.log('대체 원료 사용 승인', `${candidate.id} 승인 · 후속 작업 3건 생성`);
  paint();
  toast('승인 완료 · 후속 작업 3건을 생성했습니다');
}

function reject() {
  const state = store.get();
  const candidate = selectedCandidate(state);
  const suffix = Date.now().toString().slice(-5);
  const task = { id: `QA-${suffix}`, owner: '품질팀', title: `${candidate.id} 보완 시험 및 다른 후보 검토`, status: '확인 필요', basis: '사용 승인 거절' };
  store.patch({ status: '승인 거절', tasks: [task, ...state.tasks] });
  store.log('대체 원료 사용 승인 거절', `${candidate.id} 사용 차단 · 보완 시험 작업 생성`);
  paint();
  toast('사용을 차단하고 보완 작업을 생성했습니다');
}

$$('.nav-btn').forEach(button => button.onclick = () => openView(button.dataset.view));
$$('[data-goto]').forEach(button => button.onclick = () => openView(button.dataset.goto));
$$('[data-demo]').forEach(button => button.onclick = () => { applyScenario(button.dataset.demo); openView('workbench'); });
$$('.scenario-btn').forEach(button => button.onclick = () => applyScenario(button.dataset.scenario));

$('#delay').oninput = event => { store.patch({ delay: Number(event.target.value), scenario: 'custom' }); paint(); };
$('#supply').oninput = event => { store.patch({ supply: Number(event.target.value), scenario: 'custom' }); paint(); };
$('#runBtn').onclick = () => {
  const state = store.get();
  const impact = impacts(state);
  store.patch({ ran: true, status: impact.shortage ? '대체 조달 검토' : '재평가 완료' });
  store.log('스트레스 테스트 실행', `납기 지연 ${state.delay}일 · 공급 ${state.supply}% · 예상 공백 ${impact.shortage}일`);
  paint();
  toast('위험과 후보 점수를 다시 계산했습니다');
};
$('#resetBtn').onclick = () => { store.resetDecision(); paint(); toast('입력 조건을 초기화했습니다'); };
$('#approveBtn').onclick = approve;
$('#rejectBtn').onclick = reject;
$('#clearTasks').onclick = () => { store.clearExecution(); paint(); toast('모의 실행 결과를 초기화했습니다'); };

paint();
