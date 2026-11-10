import { scenarios } from './data.js';
import { impacts, isReady, selectedCandidate } from './domain.js';

export function createActions({ store, paint, notify }) {
  return {
    onCandidateSelect(candidateId) { store.patch({ selected: candidateId, status: '후보 선택' }); store.log('후보 변경', `${candidateId} 후보를 검토 대상으로 선택`); paint(); },
    onEvidenceChange(evidenceId, checked, label) { store.update(state => ({ ...state, status: '증빙 확인 중', checks: { ...state.checks, [evidenceId]: checked } })); store.log('증빙 상태 변경', `${label} · ${checked ? '확인' : '미확인'}`); paint(); },
    onTaskComplete(taskId) { const task = store.get().tasks.find(item => item.id === taskId); if (!task || task.status === '완료') return; store.update(state => ({ ...state, tasks: state.tasks.map(item => item.id === taskId ? { ...item, status: '완료' } : item) })); store.log('후속 작업 완료', `${task.owner} · ${task.title}`); paint(); notify('작업 상태를 완료로 변경했습니다.'); },
    applyScenario(type) { const scenario = scenarios[type] || scenarios.normal; store.patch({ ...scenario, scenario: type, ran: true }); store.log('시연 시나리오 적용', `${type} 조건 · 발주 지연 ${scenario.delay}일 · 충족률 ${scenario.supply}%`); paint(); },
    setDelay(value) { store.patch({ delay: Number(value), scenario: 'custom' }); paint(); },
    setSupply(value) { store.patch({ supply: Number(value), scenario: 'custom' }); paint(); },
    runStressTest() { const state = store.get(); const impact = impacts(state); store.patch({ ran: true, status: impact.exposureDays ? '대체 조달 검토' : '재평가 완료' }); store.log('스트레스 테스트 실행', `발주 지연 ${state.delay}일 · 충족률 ${state.supply}% · 재고 노출 ${impact.exposureDays}일`); paint(); notify('재고 노출과 미공급 발주액을 다시 계산했습니다.'); },
    reset() { store.resetDecision(); paint(); notify('입력 조건을 초기화했습니다.'); },
    approve() { const state = store.get(); if (!isReady(state)) return; if (state.status === '승인 완료') { notify('이미 모의 승인되어 후속 작업이 생성되었습니다.'); return; } const candidate = selectedCandidate(state); const suffix = Date.now().toString().slice(-5); const exposedSkuCount = impacts(state).exposedSkuCount; const tasks = [
      { id: `PO-RQ-${suffix}`, owner: '조달팀', title: `${candidate.id} 대체 원료 발주 요청`, status: '생성', basis: '모의 승인 완료' },
      { id: `PLAN-${suffix}`, owner: '생산팀', title: 'PL-02 생산계획 갱신', status: '생성', basis: `모의 후보 ${candidate.id}` },
      { id: `MKT-${suffix}`, owner: 'Masil 운영팀', title: 'SKU-1001~1004 일정 검토', status: '생성', basis: `노출 SKU ${exposedSkuCount}개 · 일정 미확인` }
    ]; store.patch({ status: '승인 완료', tasks: [...tasks, ...state.tasks] }); store.log('대체 원료 모의 승인', `${candidate.id} 시연 승인 · 로컬 작업 3건 생성`); paint(); notify('모의 승인 완료 · 브라우저에 작업 3건을 생성했습니다.'); },
    reject() { const state = store.get(); const candidate = selectedCandidate(state); const task = { id: `QA-${Date.now().toString().slice(-5)}`, owner: '입찰팀', title: `${candidate.id} 보완 시험 및 다른 후보 검토`, status: '확인 필요', basis: '모의 승인 거절' }; store.patch({ status: '승인 거절', tasks: [task, ...state.tasks] }); store.log('대체 원료 모의 승인 거절', `${candidate.id} 시연 거절 · 보완 시험 작업 생성`); paint(); notify('모의 거절 · 브라우저에 보완 작업이 생성되었습니다.'); },
    clearTasks() { store.clearExecution(); paint(); notify('모의 실행 결과를 초기화했습니다.'); }
  };
}
