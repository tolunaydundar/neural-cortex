import { useState, useEffect } from 'react';
import { useTasks, type Task } from '../context/TaskContext';

interface AddTaskModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const priorities: { value: Task['priority']; label: string; icon: string }[] = [
  { value: 'critical', label: 'CRITICAL', icon: 'error' },
  { value: 'high', label: 'HIGH', icon: 'priority_high' },
  { value: 'medium', label: 'MEDIUM', icon: 'drag_handle' },
  { value: 'low', label: 'LOW', icon: 'arrow_downward' },
];

export default function AddTaskModal({ onClose, onSuccess }: AddTaskModalProps) {
  const { addTask, getCategories } = useTasks();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [category, setCategory] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);

  const existingCategories = getCategories();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      addTask({
        title: title.trim(),
        description: description.trim(),
        priority,
        status: 'todo',
        category: category.trim(),
        due_date: dueDate || null,
        subtasks: [],
      });
      onSuccess?.();
      onClose();
    }
  };

  const filteredCategories = existingCategories.filter(c =>
    c.toLowerCase().includes(category.toLowerCase()) && c.toLowerCase() !== category.toLowerCase()
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-panel p-6 lg:p-8 w-full max-w-md mx-4 relative rounded-lg border-primary-fixed-dim/30 shadow-[0_0_30px_rgba(0,220,230,0.1)] max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-primary-fixed-dim transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <h2 className="font-headline-md text-headline-md text-primary-fixed-dim mb-2">NEW TASK</h2>
        <p className="font-label-caps text-[10px] text-on-surface-variant mb-6">DEPLOY A NEW OBJECTIVE TO THE QUEUE</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Title */}
          <div className="flex flex-col gap-2">
            <label className="font-label-caps text-xs text-on-surface">TASK TITLE</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Review pull requests"
              className="bg-surface-container-lowest border-b border-white/20 p-3 font-body-md text-on-surface focus:outline-none focus:border-primary-fixed-dim focus:shadow-[0_4px_12px_rgba(0,220,230,0.1)] transition-all"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="font-label-caps text-xs text-on-surface">DESCRIPTION <span className="text-on-surface-variant/50">(OPTIONAL)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes or context..."
              rows={2}
              className="bg-surface-container-lowest border-b border-white/20 p-3 font-body-md text-on-surface focus:outline-none focus:border-primary-fixed-dim focus:shadow-[0_4px_12px_rgba(0,220,230,0.1)] transition-all resize-none"
            />
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-2">
            <label className="font-label-caps text-xs text-on-surface">PRIORITY LEVEL</label>
            <div className="grid grid-cols-4 gap-2">
              {priorities.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`flex flex-col items-center gap-1 py-2 px-1 border rounded-sm transition-all cursor-pointer ${
                    priority === p.value
                      ? `border-primary-fixed-dim bg-primary-fixed-dim/10 text-primary-fixed-dim`
                      : 'border-white/10 hover:border-white/30 text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{p.icon}</span>
                  <span className="text-[8px] font-label-caps tracking-wider">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category + Due Date row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2 relative">
              <label className="font-label-caps text-xs text-on-surface">CATEGORY</label>
              <input
                type="text"
                value={category}
                onChange={(e) => { setCategory(e.target.value); setShowCategorySuggestions(true); }}
                onFocus={() => setShowCategorySuggestions(true)}
                onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 200)}
                placeholder="e.g. Work"
                className="bg-surface-container-lowest border-b border-white/20 p-3 font-body-md text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-all"
              />
              {showCategorySuggestions && filteredCategories.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 z-10 glass-panel border border-white/10 shadow-lg">
                  {filteredCategories.map(c => (
                    <button
                      key={c}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm text-on-surface hover:bg-primary-fixed-dim/10 hover:text-primary-fixed-dim transition-colors cursor-pointer"
                      onMouseDown={() => { setCategory(c); setShowCategorySuggestions(false); }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-label-caps text-xs text-on-surface">DUE DATE</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-surface-container-lowest border-b border-white/20 p-3 font-body-md text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-all [color-scheme:dark]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!title.trim()}
            className="w-full py-4 mt-1 bg-primary-fixed-dim text-background font-label-caps text-label-caps hover:bg-[#6ff6ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed tracking-widest cursor-pointer"
          >
            DEPLOY TASK
          </button>
        </form>
      </div>
    </div>
  );
}
