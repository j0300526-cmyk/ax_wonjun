export const candidates = [
  { id: 'ALT-B1', name: '동등 규격 후보 A', quality: 94, lead: 86, cost: 72, resilience: 88, price: 12, days: 18 },
  { id: 'ALT-B2', name: '국내 공급 후보 B', quality: 88, lead: 96, cost: 80, resilience: 95, price: 8, days: 9 },
  { id: 'ALT-B3', name: '저비용 후보 C', quality: 79, lead: 73, cost: 96, resilience: 68, price: -6, days: 28 }
];

export const evidence = [
  { id: 'spec', label: '성분·규격 비교표', required: true },
  { id: 'test', label: '품질 시험 결과', required: true },
  { id: 'reg', label: '규제·안전성 검토', required: true },
  { id: 'sample', label: '샘플 생산 결과', required: true },
  { id: 'site', label: '공급처 현장 확인', required: false }
];

export const scenarios = {
  normal: { delay: 0, supply: 100, checks: { spec: true, test: true, reg: true, sample: true, site: false }, status: '재평가 완료' },
  delay: { delay: 15, supply: 100, checks: { spec: true, test: true, reg: true, sample: true, site: true }, status: '재평가 완료' },
  shortage: { delay: 0, supply: 50, checks: { spec: true, test: true, reg: true, sample: true, site: true }, status: '재평가 완료' },
  missing: { delay: 15, supply: 50, checks: { spec: true, test: false, reg: true, sample: false, site: false }, status: '증빙 보완 필요' }
};

export const initialState = {
  delay: 0,
  supply: 100,
  selected: 'ALT-B1',
  scenario: 'normal',
  checks: {},
  status: '검토 준비',
  ran: false,
  tasks: [],
  logs: []
};
