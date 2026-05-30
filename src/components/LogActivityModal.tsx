import { useState, useEffect } from 'react';
import { useHabits } from '../context/HabitContext';

interface LogActivityModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function LogActivityModal({ onClose, onSuccess }: LogActivityModalProps) {
  const { habits, logHabit } = useHabits();
  const [selectedHabitId, setSelectedHabitId] = useState<string>('');

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedHabitId) {
      logHabit(selectedHabitId);
      onSuccess?.();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-panel p-6 lg:p-8 w-full max-w-md mx-4 relative rounded-lg border-primary-fixed-dim/30 shadow-[0_0_30px_rgba(0,220,230,0.1)]" onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-primary-fixed-dim transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        
        <h2 className="font-headline-md text-headline-md text-primary-fixed-dim mb-2">LOG ACTIVITY</h2>
        <p className="font-label-caps text-[10px] text-on-surface-variant mb-6">SELECT PROTOCOL TO MARK AS COMPLETED</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            {habits.length === 0 ? (
              <p className="text-on-surface-variant text-sm py-4 text-center">No protocols available. Create one first.</p>
            ) : (
              habits.map(habit => (
                <label 
                  key={habit.id} 
                  className={`flex items-center gap-4 p-4 border transition-all cursor-pointer rounded-sm ${
                    selectedHabitId === habit.id 
                      ? 'border-primary-fixed-dim bg-primary-fixed-dim/10' 
                      : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="habit" 
                    value={habit.id}
                    checked={selectedHabitId === habit.id}
                    onChange={(e) => setSelectedHabitId(e.target.value)}
                    className="hidden" 
                  />
                  <span className={`material-symbols-outlined ${selectedHabitId === habit.id ? 'text-primary-fixed-dim' : 'text-on-surface-variant'}`}>
                    {habit.icon}
                  </span>
                  <span className={`font-headline-sm text-sm ${selectedHabitId === habit.id ? 'text-primary-fixed-dim' : 'text-on-surface'}`}>
                    {habit.title}
                  </span>
                  {selectedHabitId === habit.id && (
                    <span className="material-symbols-outlined ml-auto text-primary-fixed-dim text-sm pulse" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
                  )}
                </label>
              ))
            )}
          </div>
          
          <button 
            type="submit" 
            disabled={!selectedHabitId}
            className="w-full py-4 mt-2 bg-primary-fixed-dim text-background font-label-caps text-label-caps hover:bg-[#6ff6ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed tracking-widest cursor-pointer"
          >
            CONFIRM EXECUTION
          </button>
        </form>
      </div>
    </div>
  );
}
