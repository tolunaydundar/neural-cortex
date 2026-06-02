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
  const best = sortedByEfficiency.at(0);
  const worst = sortedByEfficiency.at(-1);

  return (
    <div className="flex-grow space-y-8 max-w-[1200px] mx-auto w-full pb-24">
      {/* Massive Header */}
      <div className="mb-8 pt-8 lg:pt-12">
        <h1 className="font-headline-lg text-4xl sm:text-6xl text-on-surface font-bold tracking-tight">Analytics</h1>
        <div className="flex flex-wrap items-center gap-3 mt-5 font-label-caps text-[11px] sm:text-[13px] text-on-surface-variant/80 tracking-wider">
          <span>{totalCompletions} TOTAL EXECUTIONS</span>
          <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/30"></span>
          <span className={overallEfficiency < 50 ? 'text-secondary' : 'text-primary-fixed-dim'}>{overallEfficiency}% SYSTEM EFFICIENCY</span>
          <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/30"></span>
          <span>{tasksDoneTotal} TASKS DONE</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-on-surface/5 rounded-md p-6 lg:p-8 text-center border border-on-surface/5">
          <p className="font-label-caps text-[11px] text-on-surface-variant mb-2">ACTIVE HABITS</p>
          <p className="font-data-display text-4xl text-on-surface">{totalActive}</p>
        </div>
        <div className="bg-on-surface/5 rounded-md p-6 lg:p-8 text-center border border-on-surface/5">
          <p className="font-label-caps text-[11px] text-on-surface-variant mb-2">TOTAL LOGS</p>
          <p className="font-data-display text-4xl text-primary-fixed-dim">{totalCompletions}</p>
        </div>
        <div className="bg-on-surface/5 rounded-md p-6 lg:p-8 text-center border border-on-surface/5">
          <p className="font-label-caps text-[11px] text-on-surface-variant mb-2">TOP STREAK</p>
          <p className="font-data-display text-4xl text-on-surface">
            {sortedByStreak.length > 0 ? getStreak(sortedByStreak.at(0)!.id) : 0}
          </p>
        </div>
        <div className="bg-on-surface/5 rounded-md p-6 lg:p-8 text-center border border-on-surface/5">
          <p className="font-label-caps text-[11px] text-on-surface-variant mb-2">TASKS DONE</p>
          <p className="font-data-display text-4xl text-primary-fixed-dim">{tasksDoneTotal}</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-10">
        {/* Weekly Breakdown Table */}
        <div className="xl:col-span-8 bg-on-surface/5 rounded-md p-6 lg:p-8 border border-on-surface/5">
          <h2 className="font-headline-sm text-2xl text-on-surface mb-2">Weekly Telemetry</h2>
          <p className="font-label-caps text-[11px] text-on-surface-variant mb-8">EFFICIENCY BY HABIT — LAST 4 WEEKS</p>
          
          {habits.length === 0 ? (
            <p className="text-on-surface-variant text-sm py-8 text-center">No habits initialized yet.</p>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left min-w-[600px]">
                <thead className="border-b border-on-surface/10">
                  <tr>
                    <th className="pb-4 font-label-caps text-[11px] text-on-surface-variant font-bold">HABIT</th>
                    {weeks.map(w => (
                      <th key={w.label} className="pb-4 font-label-caps text-[11px] text-on-surface-variant text-center font-bold">{w.label}</th>
                    ))}
                    <th className="pb-4 font-label-caps text-[11px] text-on-surface-variant text-center font-bold">30-DAY</th>
                  </tr>
                </thead>
                <tbody>
                  {habits.map((habit, idx) => (
                    <tr key={habit.id} className={`transition-colors hover:bg-on-surface/5 ${idx !== habits.length - 1 ? 'border-b border-on-surface/5' : ''}`}>
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary-fixed-dim/60 text-[18px]">{habit.icon}</span>
                          <span className="text-base text-on-surface font-medium truncate">{habit.title}</span>
                        </div>
                      </td>
                      {weeks.map(w => {
                        const eff = getWeeklyEfficiency(habit.id, w.start, w.end);
                        return (
                          <td key={w.label} className="py-4 text-center px-2">
                            <span className={`font-data-display text-sm font-bold ${
                              eff >= 80 ? 'text-primary-fixed-dim' : eff >= 50 ? 'text-on-surface/80' : 'text-error'
                            }`}>
                              {eff}%
                            </span>
                          </td>
                        );
                      })}
                      <td className="py-4 text-center pl-2">
                        <span className="font-data-display text-base font-bold text-primary-fixed-dim bg-primary-fixed-dim/10 px-3 py-1 rounded-full">{getEfficiency(habit.id)}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="xl:col-span-4 space-y-6 lg:space-y-8">
          {/* Best & Worst */}
          {best && worst && habits.length >= 2 && (
            <div className="bg-on-surface/5 rounded-md p-6 lg:p-8 border border-on-surface/5">
              <h3 className="font-headline-sm text-xl text-on-surface mb-6">Optimization Status</h3>
              <div className="space-y-4">
                <div className="p-4 bg-on-surface/5 rounded-sm border-l-4 border-primary-fixed-dim">
                  <p className="font-label-caps text-[10px] text-primary-fixed-dim tracking-wider font-bold">HIGHEST EFFICIENCY</p>
                  <p className="text-base font-medium text-on-surface mt-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary-fixed-dim text-[18px]">{best.icon}</span>
                    {best.title}
                  </p>
                  <p className="font-data-display text-2xl text-primary-fixed-dim font-bold mt-1">{getEfficiency(best.id)}%</p>
                </div>
                <div className="p-4 bg-error/5 rounded-sm border-l-4 border-error">
                  <p className="font-label-caps text-[10px] text-error tracking-wider font-bold">NEEDS ATTENTION</p>
                  <p className="text-base font-medium text-on-surface mt-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-error text-[18px]">{worst.icon}</span>
                    {worst.title}
                  </p>
                  <p className="font-data-display text-2xl text-error font-bold mt-1">{getEfficiency(worst.id)}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Task Metrics */}
          <div className="bg-on-surface/5 rounded-md p-6 lg:p-8 border border-on-surface/5">
            <h3 className="font-headline-sm text-xl text-on-surface mb-6">Task Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-on-surface/10">
                <span className="text-sm font-medium text-on-surface/80">This Week</span>
                <span className="font-data-display text-base font-bold text-primary-fixed-dim">{taskStats7d.completed}/{taskStats7d.total}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-on-surface/10">
                <span className="text-sm font-medium text-on-surface/80">Last 2 Weeks</span>
                <span className="font-data-display text-base font-bold text-primary-fixed-dim">{taskStats14d.completed}/{taskStats14d.total}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-on-surface/10">
                <span className="text-sm font-medium text-on-surface/80">Overdue Tasks</span>
                <span className={`font-data-display text-base font-bold ${overdueTaskCount > 0 ? 'text-error' : 'text-primary-fixed-dim'}`}>{overdueTaskCount}</span>
              </div>
              
              {categoryStats.length > 0 && (
                <div className="pt-4">
                  <p className="font-label-caps text-[10px] text-on-surface-variant mb-4 font-bold tracking-wider">COMPLETION BY CATEGORY</p>
                  <div className="space-y-4">
                    {categoryStats.map(cat => (
                      <div key={cat.name}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-medium text-on-surface/80">{cat.name}</span>
                          <span className="font-data-display text-xs font-bold text-primary-fixed-dim">{cat.rate}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-on-surface/10 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-fixed-dim rounded-full" style={{ width: `${cat.rate}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Streak Rankings */}
          <div className="bg-on-surface/5 rounded-md p-6 lg:p-8 border border-on-surface/5">
            <h3 className="font-headline-sm text-xl text-on-surface mb-6">Streak Leaderboard</h3>
            {sortedByStreak.length === 0 ? (
              <p className="text-on-surface-variant text-sm text-center py-4">No data available.</p>
            ) : (
              <div className="space-y-3">
                {sortedByStreak.slice(0, 5).map((habit, index) => (
                  <div key={habit.id} className="flex items-center gap-4 p-3 bg-on-surface/5 rounded-sm hover:bg-on-surface/10 transition-colors">
                    <span className={`font-data-display text-xl w-6 text-center font-bold ${
                      index === 0 ? 'text-primary-fixed-dim' : 'text-on-surface-variant/50'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="material-symbols-outlined text-primary-fixed-dim/70 text-[20px]">{habit.icon}</span>
                    <span className="text-sm font-medium text-on-surface flex-grow truncate">{habit.title}</span>
                    <span className="font-data-display text-sm font-bold text-primary-fixed-dim bg-primary-fixed-dim/10 px-2 py-1 rounded-full">
                      {getStreak(habit.id)}d
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
