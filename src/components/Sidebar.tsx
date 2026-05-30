import { NavLink } from 'react-router-dom';

interface SidebarProps {
  onLogActivity: () => void;
}

export default function Sidebar({ onLogActivity }: SidebarProps) {
  const userName = localStorage.getItem('nexus_username') || 'OPERATOR';

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => {
    const base = "flex items-center gap-4 px-6 py-4 transition-all duration-300";
    if (isActive) {
      return `${base} text-primary-fixed-dim bg-primary-fixed-dim/10 border-r-2 border-primary-fixed-dim shadow-[inset_0_0_12px_rgba(0,220,230,0.2)] active:scale-95`;
    }
    return `${base} text-on-surface-variant hover:text-primary-fixed-dim hover:bg-white/5`;
  };

  return (
    <aside className="fixed left-0 top-0 h-full z-50 flex flex-col py-8 w-64 border-r border-white/10 bg-surface/10 backdrop-blur-xl">
      <div className="px-8 mb-12">
        <h1 className="font-headline-md text-headline-md font-bold tracking-tighter text-primary-fixed-dim drop-shadow-[0_0_8px_rgba(0,220,230,0.5)]">Neural Cortex</h1>
        <p className="font-label-caps text-label-caps text-on-surface-variant/60 mt-1">V 1.0.0</p>
      </div>
      <nav className="flex-grow flex flex-col gap-2">
        <NavLink to="/" className={getNavLinkClass} end>
          <span className="material-symbols-outlined">grid_view</span>
          <span className="font-label-caps text-label-caps">Core</span>
        </NavLink>
        <NavLink to="/performance" className={getNavLinkClass}>
          <span className="material-symbols-outlined">insights</span>
          <span className="font-label-caps text-label-caps">Performance</span>
        </NavLink>
        <NavLink to="/legacy" className={getNavLinkClass}>
          <span className="material-symbols-outlined">history</span>
          <span className="font-label-caps text-label-caps">Legacy</span>
        </NavLink>
        <NavLink to="/settings" className={getNavLinkClass}>
          <span className="material-symbols-outlined">settings</span>
          <span className="font-label-caps text-label-caps">Systems</span>
        </NavLink>
      </nav>
      <div className="px-6 mt-auto">
        <button 
          onClick={onLogActivity}
          className="w-full py-4 border border-primary-fixed-dim/30 text-primary-fixed-dim font-label-caps text-label-caps hover:bg-primary-fixed-dim/10 transition-colors tracking-widest cursor-pointer"
        >
          LOG ACTIVITY
        </button>
        <div className="mt-8 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full border border-primary-fixed-dim/30 bg-primary-fixed-dim/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary-fixed-dim text-lg">person</span>
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold truncate">{userName}</p>
            <p className="text-[10px] text-on-surface-variant">LVL 42 OPERATOR</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
