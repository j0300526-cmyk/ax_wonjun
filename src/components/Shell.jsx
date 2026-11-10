import Icon from './Icon.jsx';

const nav = [
  ['overview', '관제센터', 'dashboard'],
  ['workbench', '의사결정', 'workflow'],
  ['approvals', '승인 · 실행', 'approval'],
  ['audit', '판단 이력', 'history'],
  ['sources', '데이터 계보', 'database']
];

export default function Shell({ children, view, onNavigate, onOpenCopilot, copilotOpen }) {
  return <div className={`app-shell ${copilotOpen ? 'ai-open' : ''}`} id="appShell">
    <aside className="sidebar" aria-label="워크스페이스 메뉴">
      <div className="brand"><div className="brand-mark">M</div><div className="brand-copy"><strong>MaterialSwitch</strong><span>AI 공급망 관제</span></div></div>
      <div className="workspace-switcher"><div className="workspace-avatar">CV</div><div><strong>Corevia</strong><span>운영 워크스페이스</span></div><Icon name="chevronDown" size={13} /></div>
      <div className="nav-label">운영</div><nav className="nav" aria-label="주요 메뉴">{nav.slice(0, 4).map(([id, label, icon]) => <button type="button" key={id} className={`nav-btn ${view === id ? 'active' : ''}`} aria-current={view === id ? 'page' : undefined} onClick={() => onNavigate(id)}><span className="nav-icon"><Icon name={icon} size={16} /></span><span>{label}</span></button>)}</nav>
      <div className="nav-label nav-label-secondary">시스템</div><nav className="nav"><button type="button" className={`nav-btn ${view === 'sources' ? 'active' : ''}`} aria-current={view === 'sources' ? 'page' : undefined} onClick={() => onNavigate('sources')}><span className="nav-icon"><Icon name="database" size={16} /></span><span>데이터 계보</span></button></nav>
      <div className="sidebar-spacer" /><div className="sidebar-status"><div className="status-head"><span className="pulse-dot" /><strong>가상 데이터 시연</strong></div><div className="status-row"><span>기록 기준일</span><b>2026.06.30</b></div><div className="status-row"><span>분석 대상</span><b>SKU 4종</b></div></div>
      <div className="sidebar-user"><div className="user-avatar">Q</div><div><strong>입찰 승인권자</strong><span>입찰 책임자</span></div><Icon name="more" size={16} /></div>
    </aside>
    <main className="workspace"><header className="topbar"><div className="breadcrumb"><span>Corevia</span><i>/</i><span>Supply operations</span><i>/</i><strong>Material resilience</strong></div><div className="top-actions"><button className="command-trigger" onClick={onOpenCopilot} aria-expanded={copilotOpen} aria-controls="copilot-panel"><Icon name="search" size={14} /><span>AI 분석 열기</span><kbd>Ctrl K</kbd></button><span className="sync-state"><span className="pulse-dot" />기록 시연판</span></div></header><div className="content">{children}</div></main>
  </div>;
}
