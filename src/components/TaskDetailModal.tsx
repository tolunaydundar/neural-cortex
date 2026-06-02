import { useState, useEffect, useRef } from 'react';
import { useTasks, type Task } from '../context/TaskContext';
import ConfirmModal from './ConfirmModal';
import { useFocusTrap } from '../utils/useFocusTrap';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
}

const priorities: { value: Task['priority']; label: string; icon: string }[] = [
  { value: 'critical', label: 'CRIT', icon: 'error' },
  { value: 'high', label: 'HIGH', icon: 'priority_high' },
  { value: 'medium', label: 'MED', icon: 'drag_handle' },
  { value: 'low', label: 'LOW', icon: 'arrow_downward' },
];

const statuses: { value: Task['status']; label: string; icon: string }[] = [
  { value: 'todo', label: 'QUEUED', icon: 'radio_button_unchecked' },
  { value: 'in_progress', label: 'ACTIVE', icon: 'pending' },
  { value: 'done', label: 'DONE', icon: 'check_circle' },
];

export default function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = 'task-detail-title';
  const { updateTask, deleteTask, toggleSubtask, addSubtask, removeSubtask } = useTasks();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState(task.priority);
  const [status, setStatus] = useState(task.status);
  const [category, setCategory] = useState(task.category);
  const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.slice(0, 10) : '');
  const [newSubtask, setNewSubtask] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useFocusTrap(modalRef);

  const hasChanges =
    title !== task.title || description !== task.description ||
    priority !== task.priority || status !== task.status ||
    category !== task.category || dueDate !== (task.due_date ? task.due_date.slice(0, 10) : '');

  const handleSave = () => {
    updateTask(task.id, {
      title: title.trim() || task.title,
      description: description.trim(),
      priority,
      status,
      category: category.trim(),
      due_date: dueDate || null,
    });
    onClose();
  };

  const handleStatusChange = (newStatus: Task['status']) => {
    setStatus(newStatus);
    // Immediately persist status changes
    updateTask(task.id, { status: newStatus });
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtask.trim()) {
      addSubtask(task.id, newSubtask.trim());
      setNewSubtask('');
    }
  };

  const subtasksDone = task.subtasks.filter(st => st.done).length;
  const subtasksTotal = task.subtasks.length;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="glass-panel p-6 lg:p-8 w-full max-w-lg mx-4 relative rounded-lg border-primary-fixed-dim/30 max-h-[90vh] overflow-y-auto custom-scrollbar"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-on-surface-variant hover:text-primary-fixed-dim transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          {/* Title */}
          <input
            id={titleId}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-headline-md text-headline-sm text-primary-fixed-dim bg-transparent border-none outline-none w-full mb-1 pr-8"
          />
          <p className="font-label-caps text-[10px] text-on-surface-variant mb-6">
            CREATED {new Date(task.created_at).toLocaleDateString()}
            {task.completed_at && ` • COMPLETED ${new Date(task.completed_at).toLocaleDateString()}`}
          </p>

          {/* Status buttons */}
          <div className="flex gap-2 mb-6">
            {statuses.map(s => (
              <button
                key={s.value}
                onClick={() => handleStatusChange(s.value)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-sm transition-all cursor-pointer flex-1 justify-center ${
                  status === s.value
                    ? 'border-primary-fixed-dim bg-primary-fixed-dim/10 text-primary-fixed-dim'
                    : 'border-white/10 text-on-surface-variant hover:border-white/20'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]" style={s.value === 'done' && status === s.value ? {fontVariationSettings: "'FILL' 1"} : undefined}>{s.icon}</span>
                <span className="font-label-caps text-[9px] tracking-wider">{s.label}</span>
              </button>
            ))}
          </div>

          {/* Priority */}
          <div className="mb-5">
            <label className="font-label-caps text-[10px] text-on-surface-variant block mb-2">PRIORITY</label>
            <div className="flex gap-2">
              {priorities.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className={`flex items-center gap-1 px-3 py-1.5 border rounded-sm transition-all cursor-pointer ${
                    priority === p.value
                      ? 'border-primary-fixed-dim bg-primary-fixed-dim/10 text-primary-fixed-dim'
                      : 'border-white/10 text-on-surface-variant hover:border-white/20'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">{p.icon}</span>
                  <span className="font-label-caps text-[9px] tracking-wider">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mb-5">
            <label className="font-label-caps text-[10px] text-on-surface-variant block mb-2">DESCRIPTION</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes..."
              rows={3}
              className="w-full bg-surface-container-lowest border border-white/10 p-3 font-body-md text-sm text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-all resize-none rounded-sm"
            />
          </div>

          {/* Category + Due Date */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="font-label-caps text-[10px] text-on-surface-variant block mb-2">CATEGORY</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Work"
                className="w-full bg-surface-container-lowest border border-white/10 p-2 font-body-md text-sm text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-all rounded-sm"
              />
            </div>
            <div>
              <label className="font-label-caps text-[10px] text-on-surface-variant block mb-2">DUE DATE</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-surface-container-lowest border border-white/10 p-2 font-body-md text-sm text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-all rounded-sm [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Subtasks */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="font-label-caps text-[10px] text-on-surface-variant">
                SUBTASKS {subtasksTotal > 0 && `(${subtasksDone}/${subtasksTotal})`}
              </label>
            </div>

            {subtasksTotal > 0 && (
              <div className="subtask-progress-bar mb-3">
                <div className="subtask-progress-fill" style={{ width: `${subtasksTotal > 0 ? (subtasksDone / subtasksTotal) * 100 : 0}%` }} />
              </div>
            )}

            <div className="space-y-1 mb-3">
              {task.subtasks.map(st => (
                <div key={st.id} className="flex items-center gap-3 py-1.5 group">
                  <button
                    onClick={() => toggleSubtask(task.id, st.id)}
                    className={`task-checkbox ${st.done ? 'checked' : ''}`}
                    style={{ width: '16px', height: '16px' }}
                  >
                    {st.done && (
                      <span className="material-symbols-outlined text-background text-[11px]" style={{fontVariationSettings: "'FILL' 1"}}>check</span>
                    )}
                  </button>
                  <span className={`text-sm flex-grow ${st.done ? 'line-through text-on-surface-variant/50' : 'text-on-surface'}`}>
                    {st.title}
                  </span>
                  <button
                    onClick={() => removeSubtask(task.id, st.id)}
                    className="text-on-surface-variant/30 hover:text-error transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add subtask..."
                className="flex-grow bg-surface-container-lowest border border-white/10 px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-all rounded-sm"
              />
              <button
                type="submit"
                disabled={!newSubtask.trim()}
                className="px-3 py-1.5 border border-primary-fixed-dim/30 text-primary-fixed-dim font-label-caps text-[9px] hover:bg-primary-fixed-dim/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                ADD
              </button>
            </form>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4 border-t border-white/5">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 border border-error/40 text-error font-label-caps text-[10px] hover:bg-error/10 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              DELETE
            </button>
            <div className="flex-grow" />
            {hasChanges && (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-primary-fixed-dim text-background font-label-caps text-[10px] hover:bg-[#6ff6ff] transition-colors cursor-pointer tracking-widest"
              >
                SAVE CHANGES
              </button>
            )}
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          title="DELETE TASK"
          message={`Permanently delete "${task.title}" and all its subtasks? This action cannot be undone.`}
          confirmLabel="DELETE"
          onConfirm={() => { deleteTask(task.id); onClose(); }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
}
