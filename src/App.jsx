import { useEffect, useMemo, useState } from 'react';
import { createActions } from '../modules/actions.js';
import { createStore } from '../modules/state.js';
import Shell from './components/Shell.jsx';
import Copilot from './components/Copilot.jsx';
import Overview from './views/Overview.jsx';
import Workbench from './views/Workbench.jsx';
import Approvals from './views/Approvals.jsx';
import Audit from './views/Audit.jsx';
import Sources from './views/Sources.jsx';

export default function App() {
  const [store] = useState(createStore);
  const [state, setState] = useState(() => store.get());
  const [view, setView] = useState('overview');
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const actions = useMemo(() => createActions({ store, paint: () => setState(store.get()), notify: setNotice }), [store]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const onKeyDown = event => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCopilotOpen(true);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const navigate = nextView => {
    setView(nextView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const demo = type => {
    actions.applyScenario(type);
    navigate('workbench');
  };

  const screens = {
    overview: <Overview state={state} navigate={navigate} demo={demo} openCopilot={() => setCopilotOpen(true)} />,
    workbench: <Workbench state={state} actions={actions} />,
    approvals: <Approvals state={state} actions={actions} />,
    audit: <Audit state={state} />,
    sources: <Sources />
  };

  return <>
    <Shell view={view} onNavigate={navigate} onOpenCopilot={() => setCopilotOpen(true)} copilotOpen={copilotOpen}>
      {screens[view]}
    </Shell>
    <Copilot state={state} open={copilotOpen} onOpenChange={setCopilotOpen} />
    <div className={`toast ${notice ? 'show' : ''}`} role="status" aria-live="polite">{notice}</div>
  </>;
}
