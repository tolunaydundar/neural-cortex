import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface TopBarProps {
  onAddHabit: () => void;
  onMenuToggle?: () => void;
}

export default function TopBar({ onAddHabit, onMenuToggle }: TopBarProps) {
  const [time, setTime] = useState("");
  const navigate = useNavigate();
  
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric' 
      }).replace(/\//g, '.');
      const timeStr = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      setTime(`${dateStr} // ${timeStr}`);
    };
    
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="flex justify-between items-center w-full px-4 lg:px-margin-desktop py-gutter bg-transparent">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-on-surface-variant hover:text-primary-fixed-dim transition-colors cursor-pointer p-1"
          aria-label="Open menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <span className="font-label-caps text-label-caps text-on-surface-variant hidden sm:inline">{time}</span>
      </div>
      <div className="flex items-center gap-3 sm:gap-8">
        <div className="hidden sm:flex items-center gap-2 bg-surface-container-low px-4 py-2 border border-white/5">
          <span className="material-symbols-outlined text-primary-fixed-dim text-sm pulse" style={{fontVariationSettings: "'FILL' 1"}}>bolt</span>
          <span className="font-label-caps text-[10px] text-primary-fixed-dim tracking-widest">ON TRACK</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onAddHabit}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary-fixed-dim text-background font-label-caps text-xs hover:bg-[#6ff6ff] transition-colors cursor-pointer shadow-[0_0_15px_rgba(0,220,230,0.4)] hover:shadow-[0_0_20px_rgba(0,220,230,0.6)] rounded-sm"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span className="hidden sm:inline">NEW PROTOCOL</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="text-on-surface-variant hover:text-primary-fixed-dim transition-colors cursor-pointer p-1"
            aria-label="Settings"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
        </div>
      </div>
    </header>
  );
}
