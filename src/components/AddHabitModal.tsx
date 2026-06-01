import { useState, useEffect, useRef } from 'react';
import { useHabits } from '../context/HabitContext';
import { useFocusTrap } from '../utils/useFocusTrap';

interface AddHabitModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddHabitModal({ onClose, onSuccess }: AddHabitModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = 'add-habit-title';
  const descriptionId = 'add-habit-description';
  const { addHabit } = useHabits();
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('psychology');

  // Curated list of futuristic / practical icons (15 icons for a clean 3x5 grid)
  const availableIcons = [
    // Health & Body
    'psychology', 'fitness_center', 'directions_run',
    // Tech & Work
    'terminal', 'code', 'monitoring',
    // Learning & Focus
    'menu_book', 'school', 'brush',
    // Life & Home
    'local_cafe', 'nightlight', 'cleaning_services',
    // Leisure & Finance
    'music_note', 'sports_esports', 'savings'
  ];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useFocusTrap(modalRef);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      addHabit({ title: title.trim(), icon });
      onSuccess?.();
      onClose();
    }
  };

  return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="glass-panel p-6 lg:p-8 w-full max-w-md mx-4 relative rounded-lg border-primary-fixed-dim/30 shadow-[0_0_30px_rgba(0,220,230,0.1)]"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-primary-fixed-dim transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <h2 id={titleId} className="font-headline-md text-headline-md text-primary-fixed-dim mb-2">NEW HABIT</h2>
        <p id={descriptionId} className="font-label-caps text-[10px] text-on-surface-variant mb-6">INITIALIZE A NEW HABIT TO TRACK</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-label-caps text-xs text-on-surface">HABIT NAME</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Study Feynman diagrams"
              className="bg-surface-container-lowest border-b border-white/20 p-3 font-body-md text-on-surface focus:outline-none focus:border-primary-fixed-dim focus:shadow-[0_4px_12px_rgba(0,220,230,0.1)] transition-all"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-label-caps text-xs text-on-surface">SELECT ICON</label>
            <div className="grid grid-cols-5 gap-3">
              {availableIcons.map(ic => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`p-3 border rounded-sm flex items-center justify-center transition-all cursor-pointer ${
                    icon === ic
                      ? 'border-primary-fixed-dim bg-primary-fixed-dim/10 text-primary-fixed-dim'
                      : 'border-white/10 hover:border-white/30 text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined">{ic}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!title.trim()}
            className="w-full py-4 mt-2 bg-primary-fixed-dim text-background font-label-caps text-label-caps hover:bg-[#6ff6ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed tracking-widest cursor-pointer"
          >
            INITIALIZE HABIT
          </button>
        </form>
      </div>
    </div>
  );
}
