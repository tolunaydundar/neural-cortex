import { useState } from 'react';
import { useHabits } from '../context/HabitContext';
import { useTasks } from '../context/TaskContext';
import { startOfDay, subDays, isSameDay } from 'date-fns';
import { Link } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { habits, logs, getStreak, getEfficiency, logHabit } = useHabits();
  const { tasks, moveStatus, getOverdueTasks, addTask } = useTasks();
  const { openAddModal, openAddTaskModal } = useOutletContext<{ openAddModal: () => void; openAddTaskModal: () => void }>();
  const { t } = useTranslation();

  const [quickTaskTitle, setQuickTaskTitle] = useState('');

  const today = startOfDay(new Date());
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, i));
  const possibleCompletions = habits.length * 7;

  const actualCompletions = possibleCompletions > 0 ? logs.filter(log => {
    const logDate = new Date(log.date);
    return habits.some(h => h.id === log.habitId) && last7Days.some(d => isSameDay(d, logDate));
  }).length : 0;

  const weeklyProgress = possibleCompletions > 0 ? (actualCompletions / possibleCompletions) * 100 : 0;

  // Today's habit status
  const habitsToday = habits.map(h => {
    const loggedToday = logs.some(l =>
      l.habitId === h.id && isSameDay(new Date(l.date), today)
    );
    return { ...h, loggedToday };
  });
  const habitsLoggedCount = habitsToday.filter(h => h.loggedToday).length;

  // Today's tasks
  const todayTasks = tasks.filter(t => {
    if (t.status === 'done') return false;
    if (!t.due_date) return false;
    return isSameDay(new Date(t.due_date), today);
  });
  const activeTasks = tasks.filter(t => t.status !== 'done');
  const overdueTasks = getOverdueTasks();

  // Top streak
  const topStreak = habits.length > 0
    ? Math.max(...habits.map(h => getStreak(h.id)))
    : 0;

  // Overall efficiency
  const overallEfficiency = habits.length > 0
    ? Math.round(habits.reduce((acc, h) => acc + getEfficiency(h.id), 0) / habits.length)
    : 0;

  // Missing habits today
  const missingHabits = habitsToday.filter(h => !h.loggedToday);

  // Consistency level
  const consistencyLevel = weeklyProgress >= 80 ? 'high' : weeklyProgress >= 50 ? 'medium' : 'low';

  const handleQuickLog = (habitId: string) => {
    logHabit(habitId);
  };

  const handleQuickComplete = (taskId: string) => {
    moveStatus(taskId, 'done');
  };

  return (
    <div className="flex-grow space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg text-primary-fixed-dim">Command Center</h1>
        <p className="text-on-surface-variant font-label-caps text-[10px] mt-1">DAILY OPERATIONS OVERVIEW</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-panel p-3 lg:p-4 text-center">
          <p className="font-label-caps text-[9px] text-on-surface-variant mb-1">HABITS TODAY</p>
          <p className="font-data-display text-xl lg:text-2xl text-primary-fixed-dim">{habitsLoggedCount}/{habits.length}</p>
        </div>
        <div className="glass-panel p-3 lg:p-4 text-center">
          <p className="font-label-caps text-[9px] text-on-surface-variant mb-1">ACTIVE TASKS</p>
          <p className="font-data-display text-xl lg:text-2xl text-primary-fixed-dim">{activeTasks.length}</p>
        </div>
        <div className="glass-panel p-3 lg:p-4 text-center">
          <p className="font-label-caps text-[9px] text-on-surface-variant mb-1">TOP STREAK</p>
          <p className="font-data-display text-xl lg:text-2xl text-primary-fixed-dim">{topStreak}d</p>
        </div>
        <div className="glass-panel p-3 lg:p-4 text-center">
          <p className="font-label-caps text-[9px] text-on-surface-variant mb-1">OVERDUE</p>
          <p className={`font-data-display text-xl lg:text-2xl ${overdueTasks.length > 0 ? 'text-error' : 'text-primary-fixed-dim'}`}>{overdueTasks.length}</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8">

        {/* Left Column — Today's Agenda */}
        <div className="lg:col-span-8 space-y-6">

          {/* Habits Today */}
          <div className="glass-panel p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary-fixed-dim text-[18px]">routine</span>
                <h2 className="font-headline-sm text-headline-sm text-primary-fixed-dim">HABITS TODAY</h2>
                <span className="font-label-caps text-[9px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-sm">{habitsLoggedCount}/{habits.length}</span>
              </div>
              <Link to="/habits" className="font-label-caps text-[9px] text-primary-fixed-dim/60 hover:text-primary-fixed-dim transition-colors flex items-center gap-1">
                VIEW ALL
                <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
              </Link>
            </div>

            {habits.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-on-surface-variant/60 mb-3">No habits configured yet.</p>
                <button onClick={openAddModal} className="font-label-caps text-[10px] text-primary-fixed-dim hover:underline cursor-pointer">+ ADD FIRST HABIT</button>
              </div>
            ) : (
              <div className="space-y-2">
                {habitsToday.map(habit => (
                  <div key={habit.id} className="flex items-center gap-3 py-2.5 px-3 bg-surface-container/30 hover:bg-surface-container/50 transition-colors group rounded-sm">
                    <button
                      onClick={() => !habit.loggedToday && handleQuickLog(habit.id)}
                      className={`task-checkbox ${habit.loggedToday ? 'checked' : ''} ${habit.loggedToday ? '' : 'cursor-pointer'}`}
                      disabled={habit.loggedToday}
                    >
                      {habit.loggedToday && (
                        <span className="material-symbols-outlined text-background text-[14px]" style={{fontVariationSettings: "'FILL' 1"}}>check</span>
                      )}
                    </button>
                    <span className="material-symbols-outlined text-primary-fixed-dim/40 text-[16px]">{habit.icon}</span>
                    <span className={`text-sm flex-grow ${habit.loggedToday ? 'line-through text-on-surface-variant/50' : 'text-on-surface'}`}>
                      {habit.title}
                    </span>
                    <span className="font-data-display text-[11px] text-primary-fixed-dim/60">
                      {getStreak(habit.id)}d
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tasks Due Today */}
          <div className="glass-panel p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary-fixed-dim text-[18px]">task_alt</span>
                <h2 className="font-headline-sm text-headline-sm text-primary-fixed-dim">TASKS DUE TODAY</h2>
                <span className="font-label-caps text-[9px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-sm">{todayTasks.length}</span>
              </div>
              <Link to="/tasks" className="font-label-caps text-[9px] text-primary-fixed-dim/60 hover:text-primary-fixed-dim transition-colors flex items-center gap-1">
                VIEW ALL
                <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
              </Link>
            </div>

            {todayTasks.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-on-surface-variant/60 mb-3">
                  {tasks.length === 0 ? 'No tasks created yet.' : 'No tasks due today. You\'re clear!'}
                </p>
                {tasks.length === 0 && (
                  <button onClick={openAddTaskModal} className="font-label-caps text-[10px] text-primary-fixed-dim hover:underline cursor-pointer">+ ADD FIRST TASK</button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {todayTasks.map(task => (
                  <div key={task.id} className={`flex items-center gap-3 py-2.5 px-3 bg-surface-container/30 hover:bg-surface-container/50 transition-colors group rounded-sm priority-${task.priority}`}>
                    <button
                      onClick={() => handleQuickComplete(task.id)}
                      className="task-checkbox cursor-pointer"
                    >
                    </button>
                    <div className="flex-grow min-w-0">
                      <span className="text-sm text-on-surface block truncate">{task.title}</span>
                      {task.subtasks.length > 0 && (
                        <span className="font-label-caps text-[9px] text-primary-fixed-dim/60">
                          {task.subtasks.filter(s => s.done).length}/{task.subtasks.length} subtasks
                        </span>
                      )}
                    </div>
                    <div className={`w-2 h-2 rounded-full priority-dot-${task.priority}`} />
                  </div>
                ))}
              </div>
            )}

            {/* Quick Add Task */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (quickTaskTitle.trim()) {
                  addTask({
                    title: quickTaskTitle.trim(),
                    description: '',
                    priority: 'medium',
                    status: 'todo',
                    category: '',
                    due_date: new Date().toISOString().slice(0, 10),
                    subtasks: []
                  });
                  setQuickTaskTitle('');
                }
              }}
              className="mt-4 flex items-center gap-2"
            >
              <input
                type="text"
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                placeholder="Quick add a task for today..."
                className="flex-grow bg-surface-container/30 border border-white/10 px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary-fixed-dim rounded-sm transition-colors"
              />
              <button
                type="submit"
                disabled={!quickTaskTitle.trim()}
                className="material-symbols-outlined text-primary-fixed-dim/60 hover:text-primary-fixed-dim disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {t('dashboard.add_circle')}
              </button>
            </form>

            {/* Overdue tasks alert */}
            {overdueTasks.length > 0 && (
              <div className="mt-4 p-3 bg-error/5 border border-error/20 rounded-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-error text-[14px]">warning</span>
                  <span className="font-label-caps text-[9px] text-error tracking-wider">
                    {overdueTasks.length} OVERDUE {overdueTasks.length === 1 ? 'TASK' : 'TASKS'}
                  </span>
                </div>
                <div className="space-y-1">
                  {overdueTasks.slice(0, 3).map(t => (
                    <p key={t.id} className="text-[11px] text-error/70 truncate">• {t.title}</p>
                  ))}
                  {overdueTasks.length > 3 && (
                    <Link to="/tasks" className="text-[10px] text-error/50 hover:text-error transition-colors">
                      +{overdueTasks.length - 3} more...
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column — System Status */}
        <div className="lg:col-span-4 space-y-4">
          {/* Efficiencies */}
          <div className="glass-panel p-4 lg:p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-label-caps text-[10px] text-on-surface-variant">WEEKLY EFFICIENCY</span>
              <span className="font-data-display text-xl text-primary-fixed-dim drop-shadow-[0_0_8px_rgba(0,220,230,0.5)]">
                {Math.round(weeklyProgress)}%
              </span>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <span className="font-label-caps text-[10px] text-on-surface-variant">30-DAY EFFICIENCY</span>
              <span className="font-data-display text-xl text-primary-fixed-dim drop-shadow-[0_0_8px_rgba(0,220,230,0.5)]">
                {overallEfficiency}%
              </span>
            </div>
          </div>

          {/* System Status */}
          <div className="glass-panel p-4 lg:p-6">
            <h3 className="font-label-caps text-[10px] text-on-surface-variant mb-4">SYSTEM STATUS</h3>
            <div className="space-y-3">
              <div className="p-3 bg-surface-container/50 border-l-2 border-primary-fixed-dim">
                <p className="text-xs leading-relaxed">
                  {consistencyLevel === 'high'
                    ? 'All systems nominal. Performance exceeds baseline. Maintain protocol adherence.'
                    : consistencyLevel === 'medium'
                      ? 'Performance degraded. Increase protocol execution frequency.'
                      : 'Critical deficit detected. Immediate protocol re-engagement required.'
                  }
                </p>
              </div>

              {/* Missing habits */}
              {missingHabits.length > 0 && (
                <div className="p-3 bg-surface-container/50 border-l-2 border-secondary">
                  <p className="font-label-caps text-[10px] text-secondary mb-1">PENDING TODAY</p>
                  <p className="text-xs leading-relaxed">
                    {missingHabits.length === 1
                      ? `${missingHabits[0].title} not logged yet.`
                      : `${missingHabits.length} habits remaining: ${missingHabits.map(h => h.title).join(', ')}.`
                    }
                  </p>
                </div>
              )}
              {missingHabits.length === 0 && habits.length > 0 && (
                <div className="p-3 bg-surface-container/50 border-l-2 border-primary-fixed-dim/50">
                  <p className="font-label-caps text-[10px] text-primary-fixed-dim">ALL CLEAR</p>
                  <p className="text-xs leading-relaxed">All habits executed for today.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="glass-panel p-4 lg:p-6">
            <h3 className="font-label-caps text-[10px] text-on-surface-variant mb-4">QUICK ACCESS</h3>
            <div className="space-y-2">
              <Link to="/habits" className="flex items-center gap-3 py-2.5 px-3 bg-surface-container/30 hover:bg-surface-container/50 transition-colors rounded-sm group">
                <span className="material-symbols-outlined text-primary-fixed-dim/40 text-[16px] group-hover:text-primary-fixed-dim transition-colors">routine</span>
                <span className="text-sm text-on-surface group-hover:text-primary-fixed-dim transition-colors">Habit Grid</span>
                <span className="material-symbols-outlined text-on-surface-variant/30 text-[14px] ml-auto">arrow_forward</span>
              </Link>
              <Link to="/tasks" className="flex items-center gap-3 py-2.5 px-3 bg-surface-container/30 hover:bg-surface-container/50 transition-colors rounded-sm group">
                <span className="material-symbols-outlined text-primary-fixed-dim/40 text-[16px] group-hover:text-primary-fixed-dim transition-colors">task_alt</span>
                <span className="text-sm text-on-surface group-hover:text-primary-fixed-dim transition-colors">Task Matrix</span>
                <span className="material-symbols-outlined text-on-surface-variant/30 text-[14px] ml-auto">arrow_forward</span>
              </Link>
              <Link to="/notes" className="flex items-center gap-3 py-2.5 px-3 bg-surface-container/30 hover:bg-surface-container/50 transition-colors rounded-sm group">
                <span className="material-symbols-outlined text-primary-fixed-dim/40 text-[16px] group-hover:text-primary-fixed-dim transition-colors">book</span>
                <span className="text-sm text-on-surface group-hover:text-primary-fixed-dim transition-colors">Notebook</span>
                <span className="material-symbols-outlined text-on-surface-variant/30 text-[14px] ml-auto">arrow_forward</span>
              </Link>
              <Link to="/performance" className="flex items-center gap-3 py-2.5 px-3 bg-surface-container/30 hover:bg-surface-container/50 transition-colors rounded-sm group">
                <span className="material-symbols-outlined text-primary-fixed-dim/40 text-[16px] group-hover:text-primary-fixed-dim transition-colors">insights</span>
                <span className="text-sm text-on-surface group-hover:text-primary-fixed-dim transition-colors">Performance Analytics</span>
                <span className="material-symbols-outlined text-on-surface-variant/30 text-[14px] ml-auto">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
