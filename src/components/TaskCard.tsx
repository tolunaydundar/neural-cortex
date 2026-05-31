import type { Task } from '../context/TaskContext';
import { startOfDay } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onClick: (task: Task) => void;
}

function getPriorityLabel(priority: Task['priority']): string {
  switch (priority) {
    case 'critical': return 'CRITICAL';
    case 'high': return 'HIGH';
    case 'medium': return 'MEDIUM';
    case 'low': return 'LOW';
  }
}


export default function TaskCard({ task, onToggleComplete, onClick }: TaskCardProps) {
  const isDone = task.status === 'done';
  const today = startOfDay(new Date());
  const isOverdue = !isDone && task.due_date && new Date(task.due_date) < today;
  const subtasksDone = task.subtasks.filter(st => st.done).length;
  const subtasksTotal = task.subtasks.length;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((d.getTime() - startOfDay(now).getTime()) / 86400000);
    if (diff === 0) return 'TODAY';
    if (diff === 1) return 'TOMORROW';
    if (diff === -1) return 'YESTERDAY';
    if (diff < -1) return `${Math.abs(diff)}d OVERDUE`;
    if (diff <= 7) return `IN ${diff}d`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  };

  return (
    <div
      className={`glass-panel group hover:border-primary-fixed-dim/30 transition-all duration-300 cursor-pointer priority-${task.priority} ${isDone ? 'opacity-60' : ''}`}
      onClick={() => onClick(task)}
    >
      <div className="flex items-start gap-3 p-4 lg:p-5">
        {/* Completion checkbox */}
        <div
          className={`task-checkbox mt-0.5 ${isDone ? 'checked' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleComplete(task.id); }}
        >
          {isDone && (
            <span className="material-symbols-outlined text-background text-[14px]" style={{fontVariationSettings: "'FILL' 1"}}>check</span>
          )}
        </div>

        {/* Main content */}
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-headline-sm text-sm leading-snug ${isDone ? 'line-through text-on-surface-variant' : 'text-on-surface group-hover:text-primary-fixed-dim transition-colors'}`}>
              {task.title}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              {task.category && (
                <span className="category-chip hidden sm:inline-flex">{task.category}</span>
              )}
              <div className={`w-2 h-2 rounded-full priority-dot-${task.priority}`} title={getPriorityLabel(task.priority)} />
            </div>
          </div>

          {task.description && (
            <p className={`text-xs mt-1 truncate max-w-md ${isDone ? 'text-on-surface-variant/40' : 'text-on-surface-variant/70'}`}>
              {task.description}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {task.due_date && (
              <span className={`font-label-caps text-[9px] tracking-wider flex items-center gap-1 ${isOverdue ? 'date-overdue' : isDone ? 'text-on-surface-variant/40' : 'text-on-surface-variant'}`}>
                <span className="material-symbols-outlined text-[12px]">schedule</span>
                {formatDate(task.due_date)}
              </span>
            )}

            {subtasksTotal > 0 && (
              <span className={`font-label-caps text-[9px] tracking-wider flex items-center gap-1 ${isDone ? 'text-on-surface-variant/40' : 'text-primary-fixed-dim/70'}`}>
                <span className="material-symbols-outlined text-[12px]">checklist</span>
                {subtasksDone}/{subtasksTotal}
              </span>
            )}

            <span className={`status-badge status-${task.status}`}>
              {task.status === 'todo' ? 'QUEUED' : task.status === 'in_progress' ? 'ACTIVE' : 'DONE'}
            </span>
          </div>

          {/* Subtask progress */}
          {subtasksTotal > 0 && !isDone && (
            <div className="subtask-progress-bar mt-2">
              <div className="subtask-progress-fill" style={{ width: `${(subtasksDone / subtasksTotal) * 100}%` }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
