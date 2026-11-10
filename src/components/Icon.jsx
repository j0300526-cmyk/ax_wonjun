import Activity from 'lucide-react/icons/activity';
import AlertTriangle from 'lucide-react/icons/triangle-alert';
import ArrowRight from 'lucide-react/icons/arrow-right';
import ChevronDown from 'lucide-react/icons/chevron-down';
import ChevronRight from 'lucide-react/icons/chevron-right';
import Clock3 from 'lucide-react/icons/clock-3';
import Database from 'lucide-react/icons/database';
import History from 'lucide-react/icons/history';
import LayoutDashboard from 'lucide-react/icons/layout-dashboard';
import MoreHorizontal from 'lucide-react/icons/ellipsis';
import Search from 'lucide-react/icons/search';
import Send from 'lucide-react/icons/send';
import ShieldCheck from 'lucide-react/icons/shield-check';
import Sparkles from 'lucide-react/icons/sparkles';
import Workflow from 'lucide-react/icons/workflow';
import X from 'lucide-react/icons/x';
import ClipboardCheck from 'lucide-react/icons/clipboard-check';

const icons = {
  activity: Activity, alert: AlertTriangle, arrow: ArrowRight,
  chevronDown: ChevronDown,
  chevron: ChevronRight, clock: Clock3, database: Database,
  history: History, dashboard: LayoutDashboard, more: MoreHorizontal,
  search: Search, send: Send, shield: ShieldCheck,
  sparkles: Sparkles, workflow: Workflow, x: X, approval: ClipboardCheck
};

export default function Icon({ name, size = 16, ...props }) {
  const Component = icons[name] || Activity;
  return <Component size={size} strokeWidth={1.8} aria-hidden="true" {...props} />;
}
