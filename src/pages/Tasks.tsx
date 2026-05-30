import { useState, useMemo } from 'react';
import { useTasks, type Task } from '../context/TaskContext';
import TaskCard from '../components/TaskCard';
import TaskDetailModal from '../components/TaskDetailModal';
import { useOutletContext } from 'react-router-dom';

type StatusFilter = 'all' | 'active' | 'done';
type SortMode = 'priority' | 'due_date' | 'created';

const priorityOrder: Record<Task['priority'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export default function Tasks() {
  const { tasks, moveStatus, getOverdueTasks, getCompletionStats } = useTasks();
  const { openAddTaskModal } = useOutletContext<{ openAddTaskModal: () => void; openAddModal: () => void }>();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [sortMode, setSortMode] = useState<SortMode>('priority');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const overdue = getOverdueTasks();
  const stats7d = getCompletionStats(7);
  const todayCount = tasks.filter(t => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date);
    const now = new Date();
    return d.toDateString() === now.toDateString() && t.status !== 'done';
  }).length;

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(tasks.map(t => t.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Status filter
    if (statusFilter === 'active') {
      result = result.filter(t => t.status !== 'done');
    } else if (statusFilter === 'done') {
      result = result.filter(t => t.status === 'done');
    }

    // Category filter
    if (categoryFilter) {
      result = result.filter(t => t.category === categoryFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortMode === 'priority') {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (sortMode === 'due_date') {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      // created
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [tasks, statusFilter, categoryFilter, sortMode]);

  // Split into active and completed for grouped display
  const activeTasks = filteredTasks.filter(t => t.status !== 'done');
  const completedTasks = filteredTasks.filter(t => t.status === 'done');

  // Group active tasks by status
  const queuedTasks = activeTasks.filter(t => t.status === 'todo');
  const inProgressTasks = activeTasks.filter(t => t.status === 'in_progress');

  const handleToggleComplete = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    moveStatus(id, task.status === 'done' ? 'todo' : 'done');
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  // Refresh selectedTask from live data
  const liveSelectedTask = selectedTask ? tasks.find(t => t.id === selectedTask.id) : null;

  return (
    <div className="flex-grow space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg text-primary-fixed-dim">Task Matrix</h1>
          <p className="text-on-surface-variant font-label-caps text-[10px] mt-1">MISSION CONTROL & OBJECTIVE MANAGEMENT</p>
        </div>
        <button
          onClick={openAddTaskModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary-fixed-dim text-background font-label-caps text-xs hover:bg-[#6ff6ff] transition-colors cursor-pointer shadow-[0_0_15px_rgba(0,220,230,0.4)] hover:shadow-[0_0_20px_rgba(0,220,230,0.6)] rounded-sm w-fit"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          <span>NEW TASK</span>
        </button>
      </div>

      {/* Stats ribbon */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-panel p-3 lg:p-4 text-center">
          <p className="font-label-caps text-[9px] text-on-surface-variant mb-1">TODAY'S TASKS</p>
          <p className="font-data-display text-xl lg:text-2xl text-primary-fixed-dim">{todayCount}</p>
        </div>
        <div className="glass-panel p-3 lg:p-4 text-center">
          <p className="font-label-caps text-[9px] text-on-surface-variant mb-1">OVERDUE</p>
          <p className={`font-data-display text-xl lg:text-2xl ${overdue.length > 0 ? 'text-error' : 'text-primary-fixed-dim'}`}>{overdue.length}</p>
        </div>
        <div className="glass-panel p-3 lg:p-4 text-center">
          <p className="font-label-caps text-[9px] text-on-surface-variant mb-1">7-DAY RATE</p>
          <p className="font-data-display text-xl lg:text-2xl text-primary-fixed-dim">{stats7d.rate}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status filter */}
        <button
          onClick={() => setStatusFilter('all')}
          className={`filter-pill ${statusFilter === 'all' ? 'active' : ''}`}
        >ALL</button>
        <button
          onClick={() => setStatusFilter('active')}
          className={`filter-pill ${statusFilter === 'active' ? 'active' : ''}`}
        >ACTIVE</button>
        <button
          onClick={() => setStatusFilter('done')}
          className={`filter-pill ${statusFilter === 'done' ? 'active' : ''}`}
        >DONE</button>

        <div className="w-px h-4 bg-white/10 mx-1" />

        {/* Category filters */}
        {categories.length > 0 && (
          <>
            <button
              onClick={() => setCategoryFilter('')}
              className={`filter-pill ${!categoryFilter ? 'active' : ''}`}
            >ALL CATEGORIES</button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat === categoryFilter ? '' : cat)}
                className={`filter-pill ${categoryFilter === cat ? 'active' : ''}`}
              >{cat}</button>
            ))}
          </>
        )}

        <div className="flex-grow" />

        {/* Sort */}
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          className="bg-surface-container-lowest border border-white/10 px-2 py-1 text-[10px] font-label-caps text-on-surface-variant focus:outline-none focus:border-primary-fixed-dim cursor-pointer rounded-sm"
        >
          <option value="priority">SORT: PRIORITY</option>
          <option value="due_date">SORT: DUE DATE</option>
          <option value="created">SORT: NEWEST</option>
        </select>
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="glass-panel p-12 flex flex-col items-center justify-center gap-4 text-center">
          <button
            onClick={openAddTaskModal}
            className="material-symbols-outlined text-6xl text-primary-fixed-dim/20 hover:text-primary-fixed-dim transition-colors cursor-pointer outline-none focus:outline-none hover:scale-110 active:scale-95"
          >
            add_circle
          </button>
          <h3 className="font-headline-sm text-headline-sm text-on-surface-variant">NO TASKS DEPLOYED</h3>
          <p className="text-sm text-on-surface-variant/60 max-w-md">
            Click the <span className="text-primary-fixed-dim font-semibold">+</span> button above to deploy your first task objective and start managing your missions.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active tasks */}
          {statusFilter !== 'done' && (
            <>
              {inProgressTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-primary-fixed-dim text-[16px]">pending</span>
                    <h2 className="font-label-caps text-[10px] text-primary-fixed-dim tracking-widest">IN PROGRESS ({inProgressTasks.length})</h2>
                  </div>
                  <div className="space-y-2">
                    {inProgressTasks.map(task => (
                      <TaskCard key={task.id} task={task} onToggleComplete={handleToggleComplete} onClick={handleTaskClick} />
                    ))}
                  </div>
                </div>
              )}

              {queuedTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-on-surface-variant text-[16px]">radio_button_unchecked</span>
                    <h2 className="font-label-caps text-[10px] text-on-surface-variant tracking-widest">QUEUED ({queuedTasks.length})</h2>
                  </div>
                  <div className="space-y-2">
                    {queuedTasks.map(task => (
                      <TaskCard key={task.id} task={task} onToggleComplete={handleToggleComplete} onClick={handleTaskClick} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Completed tasks */}
          {(statusFilter === 'done' || statusFilter === 'all') && completedTasks.length > 0 && (
            <div>
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-2 mb-3 cursor-pointer group"
              >
                <span className="material-symbols-outlined text-on-surface-variant/50 text-[16px] transition-transform group-hover:text-primary-fixed-dim" style={{ transform: showCompleted ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                  chevron_right
                </span>
                <h2 className="font-label-caps text-[10px] text-on-surface-variant/50 tracking-widest group-hover:text-primary-fixed-dim transition-colors">
                  COMPLETED ({completedTasks.length})
                </h2>
              </button>
              {(showCompleted || statusFilter === 'done') && (
                <div className="space-y-2">
                  {completedTasks.map(task => (
                    <TaskCard key={task.id} task={task} onToggleComplete={handleToggleComplete} onClick={handleTaskClick} />
                  ))}
                </div>
              )}
            </div>
          )}

          {filteredTasks.length === 0 && (
            <div className="text-center py-12 text-on-surface-variant/60">
              <span className="material-symbols-outlined text-4xl mb-2 block">filter_list_off</span>
              <p className="font-label-caps text-sm">No tasks match current filters</p>
            </div>
          )}
        </div>
      )}

      {/* Task Detail Modal */}
      {liveSelectedTask && (
        <TaskDetailModal
          task={liveSelectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
