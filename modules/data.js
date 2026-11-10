export const candidates = [
  { id: 'ALT-B1', name: '동등 규격 후보 A' },
  { id: 'ALT-B2', name: '국내 공급 후보 B' },
  { id: 'ALT-B3', name: '저비용 후보 C' }
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
