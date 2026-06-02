
import { NavLink, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  onLogActivity: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ onLogActivity, isOpen = false, onClose }: SidebarProps) {
  const { toggleTheme, isDark } = useTheme();
  const { logout, operatorName } = useAuth();

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => {
    const base = "flex items-center gap-4 px-6 py-4";
    if (isActive) {
      return `${base} text-primary-fixed-dim bg-primary-fixed-dim/10 border-r-2 border-primary-fixed-dim active:scale-95`;
    }
    return `${base} text-on-surface-variant hover:text-primary-fixed-dim hover:bg-white/5 transition-colors duration-150`;
  };

  const handleNavClick = () => {
    // Close drawer on mobile when a nav link is tapped
    onClose?.();
  };

  const sidebarContent = (
    <>
      <div className="px-8 mb-12 flex items-center justify-between">
        <Link to="/" onClick={handleNavClick} className="cursor-pointer block group">
          <h1 className="font-headline-md text-headline-md font-bold tracking-tighter text-primary-fixed-dim group-hover:opacity-80 transition-opacity">Neural Cortex</h1>
          <p className="font-label-caps text-label-caps text-on-surface-variant/60 mt-1 ml-[2px]">Version 1.0.0</p>
        </Link>
        {/* Close button — only in mobile drawer */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-on-surface-variant hover:text-primary-fixed-dim transition-colors cursor-pointer p-1"
            aria-label="Close menu"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>
      <nav className="flex-grow flex flex-col gap-2">
        <NavLink to="/" className={getNavLinkClass} end onClick={handleNavClick}>
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-label-caps text-label-caps">Core</span>
        </NavLink>
        <NavLink to="/habits" className={getNavLinkClass} onClick={handleNavClick}>
          <span className="material-symbols-outlined">routine</span>
          <span className="font-label-caps text-label-caps">Habits</span>
        </NavLink>
        <NavLink to="/tasks" className={getNavLinkClass} onClick={handleNavClick}>
          <span className="material-symbols-outlined">task_alt</span>
          <span className="font-label-caps text-label-caps">Tasks</span>
        </NavLink>
        <NavLink to="/notes" className={getNavLinkClass} onClick={handleNavClick}>
          <span className="material-symbols-outlined">book</span>
          <span className="font-label-caps text-label-caps">Notebook</span>
        </NavLink>
        <NavLink to="/performance" className={getNavLinkClass} onClick={handleNavClick}>
          <span className="material-symbols-outlined">insights</span>
          <span className="font-label-caps text-label-caps">Performance</span>
        </NavLink>
        <NavLink to="/legacy" className={getNavLinkClass} onClick={handleNavClick}>
          <span className="material-symbols-outlined">history</span>
          <span className="font-label-caps text-label-caps">Legacy</span>
        </NavLink>
        <NavLink to="/settings" className={getNavLinkClass} onClick={handleNavClick}>
          <span className="material-symbols-outlined">settings</span>
          <span className="font-label-caps text-label-caps">Systems</span>
        </NavLink>
      </nav>
      <div className="px-6 mt-auto">
        <button 
          onClick={() => { onLogActivity(); onClose?.(); }}
          className="w-full py-4 border border-primary-fixed-dim/30 text-primary-fixed-dim font-label-caps text-label-caps hover:bg-primary-fixed-dim/10 transition-colors tracking-widest cursor-pointer"
        >
          LOG ACTIVITY
        </button>
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-on-surface-variant" style={{fontVariationSettings: "'FILL' 1"}}>
              {isDark ? 'dark_mode' : 'light_mode'}
            </span>
            <span className="font-label-caps text-[9px] text-on-surface-variant tracking-widest">
              {isDark ? 'DARK' : 'LIGHT'}
            </span>
          </div>
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
          />
        </div>
        <div className="mt-6 border-t border-white/5 pt-4 flex flex-col gap-1">
          <span className="text-[10px] font-label-caps text-on-surface-variant tracking-widest">OPERATOR</span>
          <div className="flex items-center justify-between">
            <span className="text-sm font-headline-sm font-bold text-primary-fixed-dim truncate">{operatorName}</span>
            <button 
              onClick={() => logout()}
              className="material-symbols-outlined text-[16px] text-on-surface-variant/50 hover:text-error transition-colors cursor-pointer"
              title="Log Out"
            >
              logout
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar — always visible on lg+ */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full z-50 flex-col py-8 w-64 border-r border-white/5 bg-surface/40 backdrop-blur-md">
        {sidebarContent}
      </aside>

      {/* Mobile drawer backdrop */}
      <div
        className={`drawer-backdrop lg:hidden ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />

      {/* Mobile drawer panel */}
      <aside
        className={`drawer-panel lg:hidden flex flex-col py-8 ${isOpen ? 'open' : ''}`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
