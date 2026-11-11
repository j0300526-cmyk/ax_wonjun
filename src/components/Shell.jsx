import Icon from './Icon.jsx';
import { Button, Badge } from './ui.jsx';

const nav = [
  ['overview', '관제센터', 'dashboard'],
  ['workbench', '의사결정', 'workflow'],
  ['approvals', '승인 · 실행', 'approval'],
  ['audit', '판단 이력', 'history'],
  ['sources', '데이터 계보', 'database']
];

export default function Shell({ children, view, onNavigate, onOpenCopilot, copilotOpen }) {
  const current = nav.find(([id]) => id === view) || nav[0];
  return <div className={`app-shell ${copilotOpen ? 'ai-open' : ''}`} id="appShell">
    <aside className="sidebar" aria-label="워크스페이스 메뉴">
      <div className="brand"><div className="brand-mark">M</div><div className="brand-copy"><strong>MaterialSwitch</strong><span>CONTROL TOWER</span></div></div>
      <div className="workspace-switcher"><div className="workspace-avatar">CV</div><div><strong>Corevia</strong><span>Supply operations</span></div><Icon name="chevronDown" size={13} /></div>
      <div className="nav-label">Workspace</div><nav className="nav" aria-label="주요 메뉴">{nav.map(([id, label, icon]) => <button type="button" key={id} className={`nav-btn ${view === id ? 'active' : ''}`} aria-current={view === id ? 'page' : undefined} onClick={() => onNavigate(id)}><span className="nav-icon"><Icon name={icon} size={17} /></span><span>{label}</span>{view === id && <span className="nav-active-dot" />}</button>)}</nav>
      <div className="sidebar-spacer" /><div className="sidebar-status"><div className="status-head"><span className="pulse-dot" /><strong>가상 데이터 시연</strong></div><p>가상 데이터로 의사결정 흐름을 검증하고 있습니다.</p><div className="status-row"><span>기준일</span><b>2026.06.30</b></div><div className="status-row"><span>대상</span><b>SKU 4</b></div></div>
      <div className="sidebar-user"><div className="user-avatar">Q</div><div><strong>입찰 승인권자</strong><span>Administrator</span></div><button className="user-more" aria-label="사용자 메뉴"><Icon name="more" size={16} /></button></div>
    </aside>
    <main className="workspace"><header className="topbar"><div className="page-context"><span>Supply operations</span><strong>{current[1]}</strong></div><div className="top-actions"><Badge tone="neutral" className="sync-state">시연 모드</Badge><Button className="command-trigger" onClick={onOpenCopilot} aria-expanded={copilotOpen} aria-controls="copilot-panel"><Icon name="sparkles" size={14} /><span>분석 설명</span><kbd>Ctrl K</kbd></Button></div></header><div className="content">{children}</div></main>
  </div>;
}
