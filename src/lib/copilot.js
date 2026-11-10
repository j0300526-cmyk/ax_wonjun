import { impacts, missingEvidence } from '../../modules/domain.js';

export function answerQuestion(state, question) {
  const impact = impacts(state);
  const missing = missingEvidence(state);
  if (/증빙|승인|서류/.test(question)) return missing.length ? `필수 증빙 ${missing.length}건이 아직 확인되지 않았습니다. 화면의 체크는 시연 입력이며 실제 파일 검증은 별도로 필요합니다.` : '화면상 필수 증빙이 모두 체크되었습니다. 실제 파일 검증과 최종 승인은 별도로 필요합니다.';
  if (/후보|대체|점수|가중치/.test(question)) return 'ALT-B1~B3의 실측 입찰·납기·품질 자료가 없어 점수와 순위를 산정하지 않습니다. 문헌만으로 이 프로젝트의 가중치를 정할 수 없습니다.';
  if (/50|공급|물량/.test(question)) return `현재 공급 충족률은 ${state.supply}%입니다. 미공급 발주액은 ${impact.unfilledOrderEok.toFixed(2)}억원이며, 손실액이나 추가 비용이 아닙니다.`;
  if (/재고|노출|지연|납기/.test(question)) return `${impact.critical.id}의 보수적 재고 노출은 ${impact.exposureDays}일입니다. 이송 중 재고와 확정 입고일이 없어 실제 품절일은 예측할 수 없습니다.`;
  return `현재 시나리오는 납기 지연 ${state.delay}일, 공급 충족률 ${state.supply}%입니다. 재고 노출 ${impact.exposureDays}일은 가상 데이터룸 기록을 이용한 보수적 계산입니다.`;
}
