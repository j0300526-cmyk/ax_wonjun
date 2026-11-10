import { Table } from '../components/ui.jsx';

const lineages = [
  ['M-B / V-205', '해외·독점 계약', '가상 기록', '단일 공급 확인', '실제 기업 기록 아님'],
  ['SKU-1001~1004', '재고·최근 4주 판매·발주', '계산값', '재고 커버와 예정 도착일 비교', '이송 중 재고·입고일 없음'],
  ['노출 기간·미공급 발주액', '발주 지연·미충족 가정', '계산값', '시나리오 민감도 확인', '실제 손실·추가 비용 예측 아님'],
  ['ALT-B1~B3', '실측 자료 없음', '모의', '입찰 흐름 시연', '후보 순위 산정 불가']
];
const methods = [
  ['재고 커버 = 현재고 ÷ 최근 4주 평균 판매량', '데이터룸 계산 정의와 SKU별 재고·판매 기록'],
  ['노출 = 예정 도착일 − 재고 커버 종료일', '발주일 + 기록된 리드타임 + 입력 지연 · 이송 중 재고 제외'],
  ['미공급 발주액 = 발주액 × 미충족 비율', '실제 긴급조달 비용이나 손실액은 아닙니다.'],
  ['후보 비교는 실측 자료 확보 후', '문헌은 다기준 평가의 필요성을 제시하지만 가중치는 별도 검증이 필요합니다.']
];

export default function Sources() {
  return <section id="sources" className="view active"><div className="page-heading compact"><div><div className="heading-meta"><span className="mono-label">데이터 거버넌스</span></div><h1>데이터 계보와 분석 근거</h1><p>가상 기록, 계산 결과, 시연 가정을 구분해 분석의 근거와 한계를 표시합니다.</p></div></div><div className="source-layout"><article className="panel table-panel"><header className="panel-header"><div><span className="panel-kicker">데이터 계보</span><h2>프로젝트 데이터 계보</h2></div><div className="legend"><span className="source original">가상 기록</span><span className="source calc">계산값</span><span className="source mock">모의</span></div></header><div className="table-wrap"><Table><thead><tr><th>데이터 항목</th><th>분류</th><th>의사결정에서의 역할</th><th>한계</th></tr></thead><tbody>{lineages.map(([name, note, source, role, limit]) => <tr key={name}><td><strong>{name}</strong><small>{note}</small></td><td><span className={`source ${source === '가상 기록' ? 'original' : source === '계산값' ? 'calc' : 'mock'}`}>{source}</span></td><td>{role}</td><td>{limit}</td></tr>)}</tbody></Table></div></article><article className="panel methods-panel"><header className="panel-header"><div><span className="panel-kicker">분석 방법</span><h2>계산식과 근거</h2></div></header>{methods.map(([title, detail], i) => <div className="method-item" key={title}><span>{String(i + 1).padStart(2, '0')}</span><div><strong>{title}</strong><small>{detail}</small></div></div>)}</article></div></section>;
}
