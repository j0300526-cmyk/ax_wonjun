import { evidence } from '../../modules/data.js';
import { impacts } from '../../modules/domain.js';
import Icon from '../components/Icon.jsx';
import { Card } from '@blueprintjs/core';

const scenarios = [
  ['normal', '기본 운영', '지연 0일 · 공급 100%', 'shield', 'green'],
  ['delay', '15일 납기 지연', '재고 노출과 도착일 비교', 'clock', 'amber'],
  ['shortage', '공급량 50%', '미공급 발주액 재계산', 'activity', 'red'],
  ['missing', '증빙 누락', '승인 차단 경로 확인', 'approval', 'blue']
];

function Metric({ label, value, unit, note, source = '계산값' }) {
  return <Card className="metric-card"><div className="metric-top"><span>{label}</span><span className={`source ${source === '가상 기록' ? 'original' : 'calc'}`}>{source}</span></div><div className="metric-main"><strong>{value}</strong><span>{unit}</span></div><div className="metric-foot">{note}</div></Card>;
}

function DependencyPanel() {
  const nodes = [
    ['supplier', 'SUPPLIER', 'V-205', '해외 · 단일 공급', '납기 위험', 'bad'],
    ['material', 'MATERIAL', 'M-B', '핵심 기능성 원료', '대체 필요', 'warn'],
    ['production', 'PRODUCTION', 'PL-02', 'Derma 생산라인', '영향 관찰', ''],
    ['market', 'MARKET', 'Masil · SKU 4종', '최소 커버 2.2주', '일정 검토', 'warn']
  ];
  return <article className="panel dependency-panel"><header className="panel-header"><div><span className="panel-kicker">공급망 연결</span><h2>공급 충격 전파 경로</h2></div><span className="live-label"><i />2026.07.01 기준</span></header><div className="dependency-canvas"><div className="canvas-grid" /><svg className="dependency-lines" viewBox="0 0 760 260" preserveAspectRatio="none" aria-hidden="true"><path className="connector risk" d="M118 118 C205 118 210 67 302 67" /><path className="connector" d="M378 70 C470 70 465 118 554 118" /><path className="connector" d="M608 145 C575 210 486 211 404 211" /><circle className="moving-dot red" cx="205" cy="98" r="4" /><circle className="moving-dot blue" cx="468" cy="91" r="4" /></svg>{nodes.map(([cls, type, name, detail, status, tone]) => <div className={`graph-node ${cls}`} key={type}><span className="node-type">{type}</span><strong>{name}</strong><small>{detail}</small><div className={`node-health ${tone}`}><i />{status}</div></div>)}</div><footer className="panel-footer"><span><i className="legend-dot source-dot" />가상 데이터룸</span><span><i className="legend-dot model-dot" />기록 기반 계산</span><span><i className="legend-dot risk-dot" />안전재고 미달</span></footer></article>;
}

export default function Overview({ state, navigate, demo }) {
  const impact = impacts(state);
  const checked = evidence.filter(item => item.required && state.checks[item.id]).length;
  return <section className="view active" id="overview"><div className="page-heading"><div><div className="heading-meta"><span className="mono-label">사건 · MAT-047</span><span className="severity critical">긴급 검토</span></div><h1>M-B 공급 중단 대응</h1><p>해외 단일 공급처 V-205의 납기 변화가 PL-02 생산과 Masil SKU 4종에 미치는 영향을 추적합니다.</p></div><div className="heading-actions"><button className="button ghost" onClick={() => navigate('sources')}><Icon name="database" />근거 보기</button><button className="button primary" onClick={() => navigate('workbench')}><Icon name="workflow" />의사결정 열기</button></div></div>
    <div className="incident-strip"><span className="incident-icon"><Icon name="alert" size={18} /></span><div><strong>M-B는 V-205 단일 공급입니다.</strong><span>재고와 발주 노출을 확인하고 대체 후보의 실제 입찰 및 납기 자료를 확보해야 합니다.</span></div><button className="text-button" onClick={() => navigate('workbench')}>분석 시작 <Icon name="arrow" size={15} /></button></div>
    <div className="metric-grid"><Metric label="M-B 공급처" source="가상 기록" value="1" unit="곳" note="V-205 독점 계약" /><Metric label="최소 재고 커버" value="2.2" unit="주" note="SKU-1004 · 안전재고 4주 미만" /><Metric label="보수적 재고 노출" value={impact.exposureDays} unit="일" note={`${impact.critical.id} · 이송 중 물량 제외`} /><article className="metric-card"><div className="metric-top"><span>의사결정 상태</span><span className="source calc">상태</span></div><div className="metric-state">{state.status}</div><div className="metric-foot">{checked} / 4 필수 증빙 확인</div><div className="step-dots" aria-hidden="true">{[0, 1, 2, 3].map(i => <i key={i} className={i < (state.ran ? 2 : 1) ? 'active' : ''} />)}</div></article></div>
    <div className="operations-grid"><DependencyPanel /><article className="panel event-panel"><header className="panel-header"><div><span className="panel-kicker">우선 확인</span><h2>지금 확인할 사건</h2></div><span className="queue-count">3건</span></header><div className="event-list"><button className="event-row active" onClick={() => navigate('workbench')}><span className="event-severity red" /><div><strong>V-205 공급 충격 검토</strong><small>기록된 발주와 재고로 노출을 계산합니다.</small><span>조달 · 가상 기록</span></div><Icon name="chevron" /></button><button className="event-row" onClick={() => demo('missing')}><span className="event-severity amber" /><div><strong>ALT-B1 증빙 보완</strong><small>필수 증빙 누락 시 승인 차단을 확인합니다.</small><span>입찰 · 시연 시나리오</span></div><Icon name="chevron" /></button><button className="event-row" onClick={() => navigate('approvals')}><span className="event-severity blue" /><div><strong>후속 작업 대기열</strong><small>모의 승인 후 생성된 업무를 확인합니다.</small><span>실행 · 브라우저 저장</span></div><Icon name="chevron" /></button></div><button className="panel-action" onClick={() => navigate('audit')}>전체 판단 이력 보기 <Icon name="arrow" size={14} /></button></article></div>
    <div className="section-title"><div><span className="panel-kicker">운영 시나리오</span><h2>시나리오 즉시 실행</h2></div><span>입력 변경에 따른 공급과 생산 영향을 다시 계산합니다.</span></div><div className="playbook-grid">{scenarios.map(([id, title, note, icon, tone]) => <button className="playbook" key={id} onClick={() => demo(id)}><span className={`playbook-icon ${tone}`}><Icon name={icon} size={18} /></span><div><strong>{title}</strong><small>{note}</small></div><Icon name="chevron" size={16} /></button>)}</div></section>;
}
