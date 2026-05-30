import { useHabits } from '../context/HabitContext';
import { useTasks } from '../context/TaskContext';
import { startOfDay, subDays, isSameDay } from 'date-fns';

export default function PerformanceAnalytics() {
  const { habits, logs, getStreak, getEfficiency } = useHabits();
  const { tasks, getCompletionStats, getOverdueTasks } = useTasks();

  // Task metrics
  const taskStats7d = getCompletionStats(7);
  const taskStats14d = getCompletionStats(14);
  const overdueTaskCount = getOverdueTasks().length;
  const tasksDoneTotal = tasks.filter(t => t.status === 'done').length;

  // Per-category task completion
  const taskCategories = Array.from(new Set(tasks.map(t => t.category).filter(Boolean)));
  const categoryStats = taskCategories.map(cat => {
    const catTasks = tasks.filter(t => t.category === cat);
    const done = catTasks.filter(t => t.status === 'done').length;
    return { name: cat, done, total: catTasks.length, rate: catTasks.length > 0 ? Math.round((done / catTasks.length) * 100) : 0 };
  }).sort((a, b) => b.rate - a.rate);

  // Calculate weekly efficiency for last 4 weeks per habit
  const today = startOfDay(new Date());
  const weeks = [
    { label: 'THIS WEEK', start: 0, end: 6 },
    { label: 'LAST WEEK', start: 7, end: 13 },
    { label: '2 WEEKS AGO', start: 14, end: 20 },
    { label: '3 WEEKS AGO', start: 21, end: 27 },
  ];

  const getWeeklyEfficiency = (habitId: string, startDay: number, endDay: number) => {
    let completed = 0;
    const totalDays = endDay - startDay + 1;
    for (let i = startDay; i <= endDay; i++) {
      const d = subDays(today, i);
      if (logs.some(l => l.habitId === habitId && isSameDay(new Date(l.date), d))) {
        completed++;
      }
    }
    return Math.round((completed / totalDays) * 100);
  };

  // Sort habits by efficiency for leaderboard
  const sortedByStreak = [...habits].sort((a, b) => getStreak(b.id) - getStreak(a.id));
  const sortedByEfficiency = [...habits].sort((a, b) => getEfficiency(b.id) - getEfficiency(a.id));

  // Total completions
  const totalCompletions = logs.length;
  const totalActive = habits.length;
  const overallEfficiency = totalActive > 0
    ? Math.round(habits.reduce((acc, h) => acc + getEfficiency(h.id), 0) / totalActive)
    : 0;

  // Best/worst
  const best = sortedByEfficiency[0];
  const worst = sortedByEfficiency[sortedByEfficiency.length - 1];

  return (
    <div className="flex-grow space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg text-primary-fixed-dim">Performance Analytics</h1>
        <p className="text-on-surface-variant font-label-caps text-[10px] mt-1">SYSTEM TELEMETRY & OPTIMIZATION METRICS</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
        <div className="glass-panel p-4 lg:p-6 text-center">
          <p className="font-label-caps text-[10px] text-on-surface-variant mb-2">ACTIVE PROTOCOLS</p>
          <p className="font-data-display text-3xl text-primary-fixed-dim">{totalActive}</p>
        </div>
        <div className="glass-panel p-4 lg:p-6 text-center">
          <p className="font-label-caps text-[10px] text-on-surface-variant mb-2">TOTAL EXECUTIONS</p>
          <p className="font-data-display text-3xl text-primary-fixed-dim">{totalCompletions}</p>
        </div>
        <div className="glass-panel p-4 lg:p-6 text-center">
          <p className="font-label-caps text-[10px] text-on-surface-variant mb-2">SYSTEM EFFICIENCY</p>
          <p className="font-data-display text-3xl text-primary-fixed-dim">{overallEfficiency}%</p>
        </div>
        <div className="glass-panel p-4 lg:p-6 text-center">
          <p className="font-label-caps text-[10px] text-on-surface-variant mb-2">TOP STREAK</p>
          <p className="font-data-display text-3xl text-primary-fixed-dim">
            {sortedByStreak.length > 0 ? getStreak(sortedByStreak[0].id) : 0}
          </p>
        </div>
        <div className="glass-panel p-4 lg:p-6 text-center">
          <p className="font-label-caps text-[10px] text-on-surface-variant mb-2">TASKS DONE</p>
          <p className="font-data-display text-3xl text-primary-fixed-dim">{tasksDoneTotal}</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8">
        {/* Weekly Breakdown Table */}
        <div className="lg:col-span-8 glass-panel p-4 lg:p-6">
          <h2 className="font-headline-sm text-headline-sm text-primary-fixed-dim mb-1">WEEKLY TELEMETRY</h2>
          <p className="font-label-caps text-[10px] text-on-surface-variant mb-6">EFFICIENCY BY PROTOCOL — LAST 4 WEEKS</p>
          
          {habits.length === 0 ? (
            <p className="text-on-surface-variant text-sm py-8 text-center">No protocols initialized yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-white/10">
                  <tr>
                    <th className="pb-3 font-label-caps text-[10px] text-on-surface-variant">PROTOCOL</th>
                    {weeks.map(w => (
                      <th key={w.label} className="pb-3 font-label-caps text-[10px] text-on-surface-variant text-center">{w.label}</th>
                    ))}
                    <th className="pb-3 font-label-caps text-[10px] text-on-surface-variant text-center">30-DAY</th>
                  </tr>
                </thead>
                <tbody>
                  {habits.map(habit => (
                    <tr key={habit.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary-fixed-dim/60 text-sm">{habit.icon}</span>
                          <span className="text-sm text-on-surface">{habit.title}</span>
                        </div>
                      </td>
                      {weeks.map(w => {
                        const eff = getWeeklyEfficiency(habit.id, w.start, w.end);
                        return (
                          <td key={w.label} className="py-4 text-center">
                            <span className={`font-data-display text-sm ${
                              eff >= 80 ? 'text-primary-fixed-dim' : eff >= 50 ? 'text-on-surface' : 'text-error'
                            }`}>
                              {eff}%
                            </span>
                          </td>
                        );
                      })}
                      <td className="py-4 text-center">
                        <span className="font-data-display text-sm text-primary-fixed-dim">{getEfficiency(habit.id)}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Streak Leaderboard */}
        <div className="lg:col-span-4 space-y-4 lg:space-y-6">
          {/* Best & Worst */}
          {best && worst && habits.length >= 2 && (
            <div className="glass-panel p-6">
              <h3 className="font-label-caps text-[10px] text-on-surface-variant mb-4">OPTIMIZATION STATUS</h3>
              <div className="space-y-4">
                <div className="p-3 bg-surface-container/50 border-l-2 border-primary-fixed-dim">
                  <p className="font-label-caps text-[10px] text-primary-fixed-dim">HIGHEST EFFICIENCY</p>
                  <p className="text-sm mt-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary-fixed-dim text-sm">{best.icon}</span>
                    {best.title}
                  </p>
                  <p className="font-data-display text-lg text-primary-fixed-dim mt-1">{getEfficiency(best.id)}%</p>
                </div>
                <div className="p-3 bg-surface-container/50 border-l-2 border-error">
                  <p className="font-label-caps text-[10px] text-error">NEEDS ATTENTION</p>
                  <p className="text-sm mt-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-error/60 text-sm">{worst.icon}</span>
                    {worst.title}
                  </p>
                  <p className="font-data-display text-lg text-error mt-1">{getEfficiency(worst.id)}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Task Metrics */}
          <div className="glass-panel p-4 lg:p-6">
            <h3 className="font-label-caps text-[10px] text-on-surface-variant mb-4">TASK METRICS</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-xs text-on-surface-variant">This Week</span>
                <span className="font-data-display text-sm text-primary-fixed-dim">{taskStats7d.completed}/{taskStats7d.total}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-xs text-on-surface-variant">Last 2 Weeks</span>
                <span className="font-data-display text-sm text-primary-fixed-dim">{taskStats14d.completed}/{taskStats14d.total}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-xs text-on-surface-variant">Overdue</span>
                <span className={`font-data-display text-sm ${overdueTaskCount > 0 ? 'text-error' : 'text-primary-fixed-dim'}`}>{overdueTaskCount}</span>
              </div>
              {categoryStats.length > 0 && (
                <div className="pt-2">
                  <p className="font-label-caps text-[9px] text-on-surface-variant/70 mb-2">BY CATEGORY</p>
                  {categoryStats.map(cat => (
                    <div key={cat.name} className="mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-on-surface-variant">{cat.name}</span>
                        <span className="font-data-display text-[10px] text-primary-fixed-dim">{cat.rate}%</span>
                      </div>
                      <div className="subtask-progress-bar">
                        <div className="subtask-progress-fill" style={{ width: `${cat.rate}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Streak Rankings */}
          <div className="glass-panel p-6">
            <h3 className="font-label-caps text-[10px] text-on-surface-variant mb-4">STREAK RANKINGS</h3>
            {sortedByStreak.length === 0 ? (
              <p className="text-on-surface-variant text-sm text-center py-4">No data available.</p>
            ) : (
              <div className="space-y-3">
                {sortedByStreak.map((habit, index) => (
                  <div key={habit.id} className="flex items-center gap-3 p-3 bg-surface-container/30 hover:bg-surface-container/50 transition-colors">
                    <span className={`font-data-display text-lg w-6 text-center ${
                      index === 0 ? 'text-primary-fixed-dim' : 'text-on-surface-variant'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="material-symbols-outlined text-primary-fixed-dim/40 text-sm">{habit.icon}</span>
                    <span className="text-sm flex-grow truncate">{habit.title}</span>
                    <span className="font-data-display text-sm text-primary-fixed-dim">
                      {getStreak(habit.id).toString().padStart(2, '0')}d
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
