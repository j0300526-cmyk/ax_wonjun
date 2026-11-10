import { evidence } from '../data.js';
import { impacts, isReady, resilience } from '../domain.js';
import { $, $$ } from './dom.js';

export function renderScenarioTabs(state) {
  $$('.scenario-btn').forEach(button => button.classList.toggle('active', button.dataset.scenario === state.scenario));
}

export function renderImpacts(state) {
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
