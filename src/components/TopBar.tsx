import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SystemStatus from './SystemStatus';
import { useSync } from '../context/SyncContext';

interface TopBarProps {
  onAddHabit: () => void;
  onAddTask?: () => void;
  onAddNote?: () => void;
  onMenuToggle?: () => void;
}

export default function TopBar({ onAddHabit, onAddTask, onAddNote, onMenuToggle }: TopBarProps) {
  const [time, setTime] = useState("");
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isSaving, lastSaved } = useSync();
  
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
        <div className="hidden md:flex items-center gap-2">
          {isSaving ? (
            <>
              <span className="material-symbols-outlined text-[14px] text-primary-fixed-dim animate-spin">sync</span>
              <span className="font-label-caps text-[9px] text-primary-fixed-dim tracking-wider">SAVING TO CLOUD...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[14px] text-on-surface-variant">cloud_done</span>
              <span className="font-label-caps text-[9px] text-on-surface-variant tracking-wider">
                {lastSaved ? 'CLOUD SYNCED' : 'CLOUD READY'}
              </span>
            </>
          )}
        </div>
        <SystemStatus />
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary-fixed-dim text-background font-label-caps text-xs hover:bg-[#6ff6ff] transition-colors cursor-pointer rounded-sm hover:shadow-lg"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span className="hidden sm:inline">CREATE</span>
              <span className="material-symbols-outlined text-[10px] hidden sm:inline ml-1 transition-transform" style={{ transform: isCreateMenuOpen ? 'rotate(180deg)' : 'none' }}>expand_more</span>
            </button>
            
            {isCreateMenuOpen && (
              <>
                <div className="fixed inset-0 z-[50]" onClick={() => setIsCreateMenuOpen(false)} />
                <div className="absolute top-full right-0 mt-2 w-40 bg-surface-container-highest border border-white/10 overflow-hidden z-[60] flex flex-col rounded-sm">
                  <button 
                    onClick={() => { onAddHabit(); setIsCreateMenuOpen(false); }} 
                    className="w-full text-left px-4 py-3 hover:bg-white/5 font-label-caps text-[10px] text-on-surface flex items-center gap-3 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary-fixed-dim">routine</span> HABIT
                  </button>
                  {onAddTask && (
                    <button 
                      onClick={() => { onAddTask(); setIsCreateMenuOpen(false); }} 
                      className="w-full text-left px-4 py-3 hover:bg-white/5 font-label-caps text-[10px] text-on-surface flex items-center gap-3 transition-colors cursor-pointer border-t border-white/5"
                    >
                      <span className="material-symbols-outlined text-[16px] text-primary-fixed-dim">task_alt</span> TASK
                    </button>
                  )}
                  {onAddNote && (
                    <button 
                      onClick={() => { onAddNote(); setIsCreateMenuOpen(false); }} 
                      className="w-full text-left px-4 py-3 hover:bg-white/5 font-label-caps text-[10px] text-on-surface flex items-center gap-3 transition-colors cursor-pointer border-t border-white/5"
                    >
                      <span className="material-symbols-outlined text-[16px] text-primary-fixed-dim">description</span> NOTE
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
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
