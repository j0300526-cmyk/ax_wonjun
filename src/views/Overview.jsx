import { evidence } from '../../modules/data.js';
import { impacts } from '../../modules/domain.js';
import Icon from '../components/Icon.jsx';
import { Badge, Button, Card } from '../components/ui.jsx';

const scenarios = [
  ['normal', '기본 운영', '지연 0일 · 공급 100%', 'shield'],
  ['delay', '납기 지연', '15일 지연을 반영', 'clock'],
  ['shortage', '공급 차질', '공급률 50% 가정', 'activity'],
  ['missing', '증빙 누락', '승인 차단 확인', 'approval']
];

const events = [
  ['01', '공급 차질 감지', 'V-205 단일 공급 구조 확인', '확인'],
  ['02', '재고 노출 계산', 'SKU-1004 보수적 노출', '계산'],
  ['03', '대체 후보 검증', '입찰·시험·납기 자료 필요', '대기'],
  ['04', '승인 및 실행', '사람 승인 후 모의 작업 생성', '대기']
];

function NetworkMap() {
  const nodes = [
    ['supplier', 'SUPPLIER', 'V-205', '해외 · 단일 공급', '납기 위험', 'bad'],
    ['material', 'MATERIAL', 'M-B', '핵심 기능성 원료', '대체 필요', 'warn'],
    ['production', 'PRODUCTION', 'PL-02', 'Derma 생산라인', '영향 관찰', ''],
    ['market', 'MARKET', 'Masil · SKU 4종', '최소 커버 2.2주', '일정 검토', 'warn']
  ];
  return <div className="network-map"><div className="canvas-grid" /><svg className="dependency-lines" viewBox="0 0 1000 260" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="arrow-risk" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker><marker id="arrow-flow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker></defs><path className="connector risk" markerEnd="url(#arrow-risk)" d="M230 130 C248 112 272 112 290 130" /><path className="connector" markerEnd="url(#arrow-flow)" d="M470 130 C488 148 512 148 530 130" /><path className="connector positive" markerEnd="url(#arrow-flow)" d="M710 130 C728 112 752 112 770 130" /><circle className="moving-dot red" cx="260" cy="117" r="4" /><circle className="moving-dot blue" cx="500" cy="143" r="4" /><circle className="moving-dot green" cx="740" cy="117" r="4" /></svg>{nodes.map(([cls, type, name, detail, status, tone]) => <div className={`graph-node ${cls}`} key={type}><span className="node-type">{type}</span><strong>{name}</strong><small>{detail}</small><div className={`node-health ${tone}`}><i />{status}</div></div>)}</div>;
}

export default function Overview({ state, navigate, demo, openCopilot }) {
  const impact = impacts(state);
  const checked = evidence.filter(item => item.required && state.checks[item.id]).length;
  return <section className="view overview-v2" id="overview">
    <div className="overview-heading"><div className="heading-meta"><span className="mono-label">CONTROL TOWER / MAT-047</span><Badge tone="warning">긴급 검토</Badge></div><span>2026.06.30 기준 · 가상 데이터룸</span></div>
    <div className="overview-hero">
      <div className="hero-story"><div className="hero-eyebrow"><span className="pulse-dot" /> SCENARIO OVERVIEW</div><h1>M-B 공급 중단,<br /><em>지금 결정할 것.</em></h1><p>단일 공급처 V-205의 납기 변화가 PL-02 생산과 Masil SKU 4종에 미치는 영향을 추적합니다. 실측되지 않은 대체 후보의 점수는 만들지 않습니다.</p><div className="hero-actions"><Button variant="primary" onClick={() => navigate('workbench')}>의사결정 워크벤치 <Icon name="arrow" size={15} /></Button><Button onClick={() => navigate('sources')}>데이터 근거 보기</Button></div><div className="hero-stats"><div><span>공급처</span><strong>01</strong><small>단일 공급</small></div><div><span>최소 커버</span><strong>2.2</strong><small>주 · SKU-1004</small></div><div><span>보수적 노출</span><strong>{impact.exposureDays}</strong><small>일 · 이송 중 재고 제외</small></div></div></div>
      <Card className="hero-brief"><div className="brief-label"><Icon name="sparkles" size={16} /> DECISION BRIEF <span>규칙 기반</span></div><h2>대체 후보의<br />실측 증빙이 필요합니다.</h2><p>재고 노출은 계산할 수 있지만, 후보별 입찰·품질·납기 자료가 없어 순위와 가중치를 정할 수 없습니다.</p><div className="brief-checks"><div><span>증빙 확인</span><strong>{checked} / 4</strong></div><div><span>현재 상태</span><strong>{state.status}</strong></div></div><Button className="brief-open" onClick={openCopilot}>분석 설명 열기 <Icon name="arrow" size={15} /></Button></Card>
    </div>
    <div className="overview-body"><Card className="overview-map"><div className="overview-panel-head"><div><span className="panel-kicker">SUPPLY NETWORK</span><h2>충격의 이동 경로</h2></div><Badge tone="neutral">4개 연결 대상</Badge></div><NetworkMap /><div className="overview-map-foot"><span><i className="legend-dot source-dot" />가상 기록</span><span><i className="legend-dot model-dot" />기록 기반 계산</span><span><i className="legend-dot risk-dot" />리스크</span></div></Card>
      <Card className="overview-queue"><div className="overview-panel-head"><div><span className="panel-kicker">DECISION PATH</span><h2>지금까지의 판단</h2></div><span className="queue-count">04 steps</span></div><div className="decision-timeline">{events.map(([number, title, detail, status], index) => <button className="timeline-row" key={number} onClick={() => navigate(index === 3 ? 'approvals' : 'workbench')}><span className={`timeline-number ${index < 2 ? 'done' : ''}`}>{number}</span><span className="timeline-copy"><strong>{title}</strong><small>{detail}</small></span><Badge tone={index < 2 ? 'positive' : 'neutral'}>{status}</Badge></button>)}</div><div className="queue-footer">판단과 승인 기록은 이 브라우저에만 저장됩니다.</div></Card></div>
    <div className="overview-scenario-head"><div><span className="panel-kicker">SIMULATION</span><h2>조건을 바꿔 확인하기</h2></div><span>시나리오를 고르면 워크벤치에서 영향이 다시 계산됩니다.</span></div><div className="scenario-launcher">{scenarios.map(([id, title, detail, icon]) => <button key={id} className="scenario-launch" onClick={() => demo(id)}><span className="scenario-launch-icon"><Icon name={icon} size={17} /></span><strong>{title}</strong><small>{detail}</small><Icon name="arrow" size={15} /></button>)}</div>
  </section>;
}
