import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimer, type TimerMode, type TimerSettings } from '../context/TimerContext';
import { usePageTitle } from '../utils/usePageTitle';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const PRESETS = [
  { name: 'Classic', focus: 25, short: 5, long: 15 },
  { name: 'Deep Work', focus: 50, short: 10, long: 30 },
  { name: 'Sprint', focus: 15, short: 3, long: 10 },
];

export default function Focus() {
  const { status, mode, timeLeft, sessionCount, settings, updateSettings, start, pause, skip, reset } = useTimer();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  usePageTitle(status === 'running' ? `(${formatTime(timeLeft)}) Focus` : 'Focus');

  const getTotalTime = () => {
    if (mode === 'focus') return settings.focusDuration;
    if (mode === 'shortBreak') return settings.shortBreakDuration;
    return settings.longBreakDuration;
  };

  const total = getTotalTime();
  const progress = total > 0 ? ((total - timeLeft) / total) * 100 : 0;
  
  // SVG Circle calculations using a fixed viewBox of 320x320
  const radius = 150;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const handleApplyPreset = (focusM: number, shortM: number, longM: number) => {
    updateSettings({
      focusDuration: focusM * 60,
      shortBreakDuration: shortM * 60,
      longBreakDuration: longM * 60
    });
  };

  const modeColors: Record<TimerMode, string> = {
    focus: 'text-primary-fixed-dim',
    shortBreak: 'text-secondary-container',
    longBreak: 'text-tertiary-container'
  };

  const modeStrokeColors: Record<TimerMode, string> = {
    focus: 'stroke-primary-fixed-dim',
    shortBreak: 'stroke-secondary-container',
    longBreak: 'stroke-tertiary-container'
  };

  const modeLabels: Record<TimerMode, string> = {
    focus: 'FOCUS SESSION',
    shortBreak: 'SHORT BREAK',
    longBreak: 'LONG BREAK'
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center relative w-full h-full min-h-[80vh] overflow-hidden">
      
      {/* Immersive Background Ambient Glow */}
      <div 
        className={`absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_center,currentColor_0%,transparent_60%)] ${modeColors[mode]} pointer-events-none transition-colors duration-1000`} 
      />

      {/* Top Header */}
      <div className="absolute top-6 w-full max-w-4xl flex justify-between items-center px-6 md:px-12 z-10">
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${status === 'running' ? 'animate-pulse' : ''} bg-current ${modeColors[mode]} shadow-[0_0_12px_currentColor]`}></span>
          <span className={`font-label-caps tracking-[0.2em] text-xs sm:text-sm lg:text-base ${modeColors[mode]} font-bold`}>{modeLabels[mode]}</span>
        </div>
        <button 
          onClick={() => setIsSettingsOpen(true)} 
          className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary-fixed-dim hover:bg-surface-container-highest transition-all cursor-pointer border border-outline/10 shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">tune</span>
        </button>
      </div>

      {/* Scalable Giant Timer */}
      <div className="relative flex items-center justify-center mt-8 md:mt-0 w-full max-w-[90vw]">
        <svg 
          className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] lg:w-[500px] lg:h-[500px] xl:w-[600px] xl:h-[600px] transform -rotate-90" 
          viewBox="0 0 320 320"
        >
          <circle
            cx="160"
            cy="160"
            r={radius}
            className="stroke-outline/5 fill-none"
            strokeWidth="4"
          />
          <circle
            cx="160"
            cy="160"
            r={radius}
            className={`${modeStrokeColors[mode]} fill-none transition-all duration-1000 ease-linear opacity-80`}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ filter: 'drop-shadow(0px 0px 8px currentColor)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-headline-lg text-[5.5rem] md:text-[7rem] lg:text-[8.5rem] xl:text-[10rem] font-bold tracking-tighter text-on-surface tabular-nums leading-none">
            {formatTime(timeLeft)}
          </span>
          <span className="font-label-caps text-[10px] md:text-xs lg:text-sm text-on-surface-variant/70 tracking-[0.4em] mt-2 md:mt-4 lg:mt-6">
            SESSION #{sessionCount + 1}
          </span>
        </div>
      </div>

      {/* Hero Controls */}
      <div className="flex items-center gap-6 sm:gap-10 mt-12 md:mt-16 relative z-10">
        <button 
          onClick={reset}
          className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all cursor-pointer border border-outline/5"
          title="Reset"
        >
          <span className="material-symbols-outlined text-[20px] md:text-[24px]">restart_alt</span>
        </button>
        
        <button 
          onClick={status === 'running' ? pause : start}
          className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-background shadow-xl transition-all cursor-pointer ${
            mode === 'focus' ? 'bg-primary-fixed-dim hover:bg-[#6ff6ff] shadow-primary-fixed-dim/20' : 
            mode === 'shortBreak' ? 'bg-secondary-container hover:bg-[#ffb4ab] shadow-secondary-container/20' :
            'bg-tertiary-container hover:bg-[#ffb4ab] shadow-tertiary-container/20'
          } hover:scale-105 active:scale-95`}
        >
          <span className="material-symbols-outlined text-[36px] md:text-[44px] ml-1">
            {status === 'running' ? 'pause' : 'play_arrow'}
          </span>
        </button>
        
        <button 
          onClick={skip}
          className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all cursor-pointer border border-outline/5"
          title="Skip"
        >
          <span className="material-symbols-outlined text-[20px] md:text-[24px]">skip_next</span>
        </button>
      </div>

      {/* Bottom Session Indicators */}
      <div className="absolute bottom-8 md:bottom-12 flex items-center gap-3 z-10">
        {Array.from({ length: settings.longBreakInterval }).map((_, i) => (
          <div 
            key={i} 
            className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors duration-500 ${
              i < (sessionCount % settings.longBreakInterval) 
                ? `bg-current ${modeColors['focus']} shadow-[0_0_6px_currentColor]` 
                : 'bg-outline/10'
            }`}
          />
        ))}
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal 
            settings={settings} 
            updateSettings={updateSettings} 
            onClose={() => setIsSettingsOpen(false)} 
            applyPreset={handleApplyPreset}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingsModal({ 
  settings, 
  updateSettings, 
  onClose,
  applyPreset
}: { 
  settings: TimerSettings, 
  updateSettings: (s: Partial<TimerSettings>) => void, 
  onClose: () => void,
  applyPreset: (f: number, s: number, l: number) => void
}) {
  const [localSettings, setLocalSettings] = useState({
    focusM: Math.round(settings.focusDuration / 60),
    shortM: Math.round(settings.shortBreakDuration / 60),
    longM: Math.round(settings.longBreakDuration / 60),
  });

  const handleSave = () => {
    updateSettings({
      focusDuration: localSettings.focusM * 60,
      shortBreakDuration: localSettings.shortM * 60,
      longBreakDuration: localSettings.longM * 60
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="glass-panel p-6 w-full max-w-md mx-4 rounded-lg relative"
      >
        <div className="flex justify-between items-center mb-6 border-b border-outline/10 pb-4">
          <h3 className="font-headline-sm text-lg text-primary-fixed-dim">TIMER SETTINGS</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-6">
          {/* Presets */}
          <div>
            <label className="block text-xs font-label-caps tracking-widest text-on-surface-variant mb-3">PRESETS</label>
            <div className="flex gap-2">
              {PRESETS.map(p => (
                <button
                  key={p.name}
                  onClick={() => {
                    setLocalSettings({ focusM: p.focus, shortM: p.short, longM: p.long });
                    applyPreset(p.focus, p.short, p.long);
                  }}
                  className="flex-1 py-2 rounded border border-outline/20 bg-surface-container hover:bg-white/5 text-[10px] font-label-caps transition-colors"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Durations */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-label-caps tracking-widest text-on-surface-variant mb-2">FOCUS (M)</label>
              <input 
                type="number" min="1" max="120"
                value={localSettings.focusM}
                onChange={e => setLocalSettings(p => ({...p, focusM: parseInt(e.target.value) || 1}))}
                className="w-full bg-surface-container-highest px-3 py-2 rounded text-on-surface text-center font-data-display border border-outline/10 focus:border-primary-fixed-dim/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-label-caps tracking-widest text-on-surface-variant mb-2">SHORT (M)</label>
              <input 
                type="number" min="1" max="30"
                value={localSettings.shortM}
                onChange={e => setLocalSettings(p => ({...p, shortM: parseInt(e.target.value) || 1}))}
                className="w-full bg-surface-container-highest px-3 py-2 rounded text-on-surface text-center font-data-display border border-outline/10 focus:border-primary-fixed-dim/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-label-caps tracking-widest text-on-surface-variant mb-2">LONG (M)</label>
              <input 
                type="number" min="1" max="60"
                value={localSettings.longM}
                onChange={e => setLocalSettings(p => ({...p, longM: parseInt(e.target.value) || 1}))}
                className="w-full bg-surface-container-highest px-3 py-2 rounded text-on-surface text-center font-data-display border border-outline/10 focus:border-primary-fixed-dim/50 focus:outline-none"
              />
            </div>
          </div>

          <hr className="border-outline/10" />

          {/* Toggles */}
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-label-caps tracking-widest text-on-surface">AUTO-START BREAKS</span>
              <input 
                type="checkbox" 
                checked={settings.autoStartBreaks}
                onChange={e => updateSettings({ autoStartBreaks: e.target.checked })}
                className="w-4 h-4 accent-primary-fixed-dim"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-label-caps tracking-widest text-on-surface">AUTO-START FOCUS</span>
              <input 
                type="checkbox" 
                checked={settings.autoStartFocus}
                onChange={e => updateSettings({ autoStartFocus: e.target.checked })}
                className="w-4 h-4 accent-primary-fixed-dim"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-label-caps tracking-widest text-on-surface">AUDIO NOTIFICATIONS</span>
              <input 
                type="checkbox" 
                checked={settings.soundEnabled}
                onChange={e => updateSettings({ soundEnabled: e.target.checked })}
                className="w-4 h-4 accent-primary-fixed-dim"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-label-caps tracking-widest text-on-surface">SYSTEM NOTIFICATIONS</span>
              <input 
                type="checkbox" 
                checked={settings.browserNotifications}
                onChange={e => updateSettings({ browserNotifications: e.target.checked })}
                className="w-4 h-4 accent-primary-fixed-dim"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-label-caps tracking-widest text-on-surface">ACTIVITY LOGGING</span>
              <input 
                type="checkbox" 
                checked={settings.logActivity}
                onChange={e => updateSettings({ logActivity: e.target.checked })}
                className="w-4 h-4 accent-primary-fixed-dim"
              />
            </label>
          </div>

          <button onClick={handleSave} className="w-full py-3 mt-4 bg-primary-fixed-dim text-background font-bold tracking-widest font-label-caps text-xs rounded hover:bg-[#6ff6ff] transition-colors">
            SAVE CHANGES
          </button>
        </div>
      </motion.div>
    </div>
  );
}
