import { useEffect, useState } from 'react';

export default function TopBar() {
  const [time, setTime] = useState("");
  
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
    <header className="flex justify-between items-center w-full px-margin-desktop py-gutter bg-transparent">
      <div className="flex items-center gap-4">
        <span className="font-headline-sm text-headline-sm font-bold text-primary-fixed-dim">Neural Cortex</span>
        <div className="h-4 w-[1px] bg-white/10 mx-2"></div>
        <span className="font-label-caps text-label-caps text-on-surface-variant">{time}</span>
      </div>
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 border border-white/5">
          <span className="material-symbols-outlined text-primary-fixed-dim text-sm pulse" style={{fontVariationSettings: "'FILL' 1"}}>bolt</span>
          <span className="font-label-caps text-[10px] text-primary-fixed-dim tracking-widest">ON TRACK</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined text-on-surface-variant hover:text-primary-fixed-dim transition-colors cursor-pointer">notifications_active</button>
          <div className="w-8 h-8 rounded-full bg-primary-fixed-dim/20 border border-primary-fixed-dim/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary-fixed-dim text-sm">person</span>
          </div>
        </div>
      </div>
    </header>
  );
}
