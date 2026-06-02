import { useState } from 'react';
import { useHabits } from '../context/HabitContext';
import { useTasks } from '../context/TaskContext';
import { startOfDay, subDays, isSameDay } from 'date-fns';
import { Link } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';

export default function Dashboard() {
  const { habits, logs, getStreak, getEfficiency, logHabit } = useHabits();
  const { tasks, moveStatus, getOverdueTasks, addTask } = useTasks();
  const { openAddModal, openAddTaskModal } = useOutletContext<{ openAddModal: () => void; openAddTaskModal: () => void }>();

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
    <div className="flex-grow space-y-8 lg:space-y-12 max-w-[1200px] mx-auto w-full pb-24">
      {/* Massive Header */}
      <div className="mb-8 pt-8 lg:pt-12">
        <h1 className="font-headline-lg text-4xl sm:text-6xl text-on-surface font-bold tracking-tight">Dashboard</h1>
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center items-start gap-1.5 sm:gap-3 mt-4 sm:mt-5 font-label-caps text-[11px] sm:text-[13px] text-on-surface-variant/80 tracking-wider">
          <span>{habitsLoggedCount}/{habits.length} HABITS TODAY</span>
          <span className="hidden sm:block w-1.5 h-1.5 rounded-full bg-on-surface-variant/30"></span>
          <span>{activeTasks.length} ACTIVE TASKS</span>
          <span className="hidden sm:block w-1.5 h-1.5 rounded-full bg-on-surface-variant/30"></span>
          <span>{topStreak} DAY TOP STREAK</span>
          <span className="hidden sm:block w-1.5 h-1.5 rounded-full bg-on-surface-variant/30"></span>
          <span className={overdueTasks.length > 0 ? 'text-error font-bold' : ''}>{overdueTasks.length} OVERDUE</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-10">

        {/* Left Column — Today's Agenda */}
        <div className="xl:col-span-8 space-y-10">

          {/* Habits Today */}
          <div className="bg-surface-container/30 rounded-md p-6 lg:p-8 border border-on-surface/5 transition-all hover:bg-surface-container/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline-sm text-2xl text-on-surface">Habits Today</h2>
              <Link to="/habits" className="font-label-caps text-[10px] text-primary-fixed-dim/60 hover:text-primary-fixed-dim transition-colors flex items-center gap-1">
                VIEW ALL
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>

            {habits.length === 0 ? (
              <div className="py-8 text-center bg-on-surface/5 rounded-sm border border-on-surface/5">
                <p className="text-base text-on-surface-variant/70 mb-4">No habits configured yet.</p>
                <button onClick={openAddModal} className="font-label-caps text-[12px] text-primary-fixed-dim hover:underline cursor-pointer">+ ADD FIRST HABIT</button>
              </div>
            ) : (
              <div className="space-y-3">
                {habitsToday.map(habit => (
                  <div key={habit.id} className="flex items-center gap-4 py-3.5 px-4 bg-on-surface/5 hover:bg-on-surface/10 border border-transparent hover:border-on-surface/10 transition-all group rounded-sm">
                    <button
                      onClick={() => !habit.loggedToday && handleQuickLog(habit.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${habit.loggedToday ? 'bg-primary-fixed-dim border-primary-fixed-dim' : 'border-on-surface/30 hover:border-primary-fixed-dim cursor-pointer'}`}
                      disabled={habit.loggedToday}
                    >
                      {habit.loggedToday && (
                        <span className="material-symbols-outlined text-background text-[14px]" style={{fontVariationSettings: "'FILL' 1"}}>check</span>
                      )}
                    </button>
                    <span className="material-symbols-outlined text-primary-fixed-dim/60 text-[20px]">{habit.icon}</span>
                    <span className={`text-base flex-grow font-medium ${habit.loggedToday ? 'line-through text-on-surface-variant/50' : 'text-on-surface'}`}>
                      {habit.title}
                    </span>
                    <span className="font-data-display text-[13px] text-primary-fixed-dim/70 bg-primary-fixed-dim/10 px-3 py-1 rounded-full">
                      {getStreak(habit.id)}d streak
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tasks Due Today */}
          <div className="bg-surface-container/30 rounded-md p-6 lg:p-8 border border-on-surface/5 transition-all hover:bg-surface-container/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline-sm text-2xl text-on-surface">Tasks Due Today</h2>
              <Link to="/tasks" className="font-label-caps text-[10px] text-primary-fixed-dim/60 hover:text-primary-fixed-dim transition-colors flex items-center gap-1">
                VIEW ALL
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>

            {todayTasks.length === 0 ? (
              <div className="py-8 text-center bg-on-surface/5 rounded-sm border border-on-surface/5">
                <p className="text-base text-on-surface-variant/70 mb-4">
                  {tasks.length === 0 ? 'No tasks created yet.' : 'No tasks due today. You\'re clear!'}
                </p>
                {tasks.length === 0 && (
                  <button onClick={openAddTaskModal} className="font-label-caps text-[12px] text-primary-fixed-dim hover:underline cursor-pointer">+ ADD FIRST TASK</button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {todayTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-4 py-3.5 px-4 bg-on-surface/5 hover:bg-on-surface/10 border border-transparent hover:border-on-surface/10 transition-all group rounded-sm relative overflow-hidden">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 priority-border-${task.priority}`} />
                    <button
                      onClick={() => handleQuickComplete(task.id)}
                      className="w-5 h-5 rounded border-2 border-on-surface/30 hover:border-primary-fixed-dim cursor-pointer transition-colors ml-2"
                    />
                    <div className="flex-grow min-w-0">
                      <span className="text-base font-medium text-on-surface block truncate">{task.title}</span>
                      {task.subtasks.length > 0 && (
                        <span className="font-label-caps text-[10px] text-on-surface-variant/70 mt-1 block">
                          {task.subtasks.filter(s => s.done).length}/{task.subtasks.length} SUBTASKS
                        </span>
                      )}
                    </div>
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
              className="mt-6 flex items-center gap-3 bg-on-surface/5 rounded-sm p-2 border border-on-surface/5 focus-within:border-primary-fixed-dim/50 transition-colors"
            >
              <input
                type="text"
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                placeholder="Quick add a task for today..."
                className="flex-grow bg-transparent px-4 py-2 text-base text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!quickTaskTitle.trim()}
                className="w-10 h-10 rounded-sm bg-primary-fixed-dim/10 text-primary-fixed-dim flex items-center justify-center hover:bg-primary-fixed-dim/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer mr-1"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
              </button>
            </form>

            {/* Overdue tasks alert */}
            {overdueTasks.length > 0 && (
              <div className="mt-6 p-5 bg-error/5 border border-error/20 rounded-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-error text-[18px]">warning</span>
                  <span className="font-label-caps text-[11px] text-error font-bold tracking-wider">
                    {overdueTasks.length} OVERDUE {overdueTasks.length === 1 ? 'TASK' : 'TASKS'}
                  </span>
                </div>
                <div className="space-y-2">
                  {overdueTasks.slice(0, 3).map(t => (
                    <p key={t.id} className="text-sm text-error/80 truncate font-medium">• {t.title}</p>
                  ))}
                  {overdueTasks.length > 3 && (
                    <Link to="/tasks" className="text-xs text-error/60 hover:text-error transition-colors font-medium mt-2 block">
                      +{overdueTasks.length - 3} more overdue tasks...
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column — System Status */}
        <div className="xl:col-span-4 space-y-6">
          {/* Efficiencies */}
          <div className="bg-surface-container/30 rounded-md p-6 lg:p-8 border border-on-surface/5 space-y-6">
            <h3 className="font-headline-sm text-xl text-on-surface mb-2">Efficiency</h3>
            
            <div className="flex justify-between items-end">
              <span className="font-label-caps text-[11px] text-on-surface-variant/80">7-DAY AVERAGE</span>
              <span className="font-data-display text-3xl text-primary-fixed-dim font-bold">
                {Math.round(weeklyProgress)}%
              </span>
            </div>

            <div className="flex justify-between items-end pt-6 border-t border-on-surface/5">
              <span className="font-label-caps text-[11px] text-on-surface-variant/80">30-DAY AVERAGE</span>
              <span className="font-data-display text-3xl text-primary-fixed-dim font-bold">
                {overallEfficiency}%
              </span>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-surface-container/30 rounded-md p-6 lg:p-8 border border-on-surface/5">
            <h3 className="font-headline-sm text-xl text-on-surface mb-6">System Status</h3>
            <div className="space-y-4">
              <div className="p-4 bg-on-surface/5 rounded-sm border-l-4 border-primary-fixed-dim">
                <p className="text-sm text-on-surface/80 leading-relaxed font-medium">
                  {consistencyLevel === 'high'
                    ? 'All systems nominal. Performance exceeds baseline. Maintain habit adherence.'
                    : consistencyLevel === 'medium'
                      ? 'Performance degraded. Increase habit execution frequency.'
                      : 'Critical deficit detected. Immediate habit re-engagement required.'
                  }
                </p>
              </div>

              {/* Missing habits */}
              {missingHabits.length > 0 && (
                <div className="p-4 bg-on-surface/5 rounded-sm border-l-4 border-secondary">
                  <p className="font-label-caps text-[10px] text-secondary font-bold mb-2 tracking-wider">PENDING TODAY</p>
                  <p className="text-sm text-on-surface/80 leading-relaxed font-medium">
                    {missingHabits.length === 1
                      ? `${missingHabits[0].title} not logged yet.`
                      : `${missingHabits.length} habits remaining: ${missingHabits.map(h => h.title).join(', ')}.`
                    }
                  </p>
                </div>
              )}
              {missingHabits.length === 0 && habits.length > 0 && (
                <div className="p-4 bg-on-surface/5 rounded-sm border-l-4 border-primary-fixed-dim">
                  <p className="font-label-caps text-[10px] text-primary-fixed-dim font-bold mb-2 tracking-wider">ALL CLEAR</p>
                  <p className="text-sm text-on-surface/80 leading-relaxed font-medium">All habits executed for today.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-surface-container/30 rounded-md p-6 lg:p-8 border border-on-surface/5">
            <h3 className="font-headline-sm text-xl text-on-surface mb-6">Quick Access</h3>
            <div className="space-y-3">
              <Link to="/habits" className="flex items-center gap-4 p-4 bg-on-surface/5 hover:bg-on-surface/10 border border-transparent hover:border-on-surface/10 transition-all rounded-sm group">
                <span className="material-symbols-outlined text-primary-fixed-dim/70 text-[20px] group-hover:text-primary-fixed-dim transition-colors">routine</span>
                <span className="text-base font-medium text-on-surface group-hover:text-primary-fixed-dim transition-colors">Habit Grid</span>
                <span className="material-symbols-outlined text-on-surface-variant/40 text-[18px] ml-auto group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
              <Link to="/tasks" className="flex items-center gap-4 p-4 bg-on-surface/5 hover:bg-on-surface/10 border border-transparent hover:border-on-surface/10 transition-all rounded-sm group">
                <span className="material-symbols-outlined text-primary-fixed-dim/70 text-[20px] group-hover:text-primary-fixed-dim transition-colors">task_alt</span>
                <span className="text-base font-medium text-on-surface group-hover:text-primary-fixed-dim transition-colors">Task Matrix</span>
                <span className="material-symbols-outlined text-on-surface-variant/40 text-[18px] ml-auto group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
              <Link to="/notes" className="flex items-center gap-4 p-4 bg-on-surface/5 hover:bg-on-surface/10 border border-transparent hover:border-on-surface/10 transition-all rounded-sm group">
                <span className="material-symbols-outlined text-primary-fixed-dim/70 text-[20px] group-hover:text-primary-fixed-dim transition-colors">book</span>
                <span className="text-base font-medium text-on-surface group-hover:text-primary-fixed-dim transition-colors">Notebook</span>
                <span className="material-symbols-outlined text-on-surface-variant/40 text-[18px] ml-auto group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
              <Link to="/performance" className="flex items-center gap-4 p-4 bg-on-surface/5 hover:bg-on-surface/10 border border-transparent hover:border-on-surface/10 transition-all rounded-sm group">
                <span className="material-symbols-outlined text-primary-fixed-dim/70 text-[20px] group-hover:text-primary-fixed-dim transition-colors">insights</span>
                <span className="text-base font-medium text-on-surface group-hover:text-primary-fixed-dim transition-colors">Performance Analytics</span>
                <span className="material-symbols-outlined text-on-surface-variant/40 text-[18px] ml-auto group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
