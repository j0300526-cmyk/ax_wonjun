import Icon from '../components/Icon.jsx';

function exportLogs(logs) {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ type: 'MaterialSwitch AI 시연 이력', exportedAt: new Date().toISOString(), logs }, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'materialswitch-demo-audit.json';
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Audit({ state }) {
  return <section id="audit" className="view active"><div className="page-heading compact"><div><div className="heading-meta"><span className="mono-label">시연 이력</span></div><h1>의사결정 로그</h1><p>입력 변경부터 증빙 확인, 모의 승인과 실행까지 브라우저에 남은 판단 이력을 확인합니다.</p></div><div className="heading-actions"><button className="button ghost" onClick={() => exportLogs(state.logs)} disabled={!state.logs.length}><Icon name="database" size={15} />JSON 내보내기</button></div></div><article className="panel log-panel"><header className="panel-header"><div><span className="panel-kicker">변경 이력</span><h2>MAT-047 변경 이력</h2></div><span className="source mock">브라우저 저장</span></header>{state.logs.length ? state.logs.map((item, i) => <div className="log-row" key={`${item.time}-${i}`}><div className="log-time">{item.time}</div><div className="log-line"><i className="log-dot" /></div><div className="log-body"><b>{item.title}</b><span>{item.detail}</span></div></div>) : <div className="empty">아직 기록된 시연 이력이 없습니다.</div>}</article></section>;
}
