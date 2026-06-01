import { useHabits } from '../context/HabitContext';
import { useTheme } from '../context/ThemeContext';
import { startOfDay, subDays, isSameDay } from 'date-fns';

interface PerformancePanelProps {
  consistency: number;
}

export default function PerformancePanel({ consistency }: PerformancePanelProps) {
  const { habits, logs } = useHabits();
  const { isDark } = useTheme();

  // Calculate actual weekly log counts per day (Mon–Sun of the current week)
  const today = startOfDay(new Date());
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon ... 6=Sat
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const weekDays = Array.from({ length: 7 }, (_, i) => subDays(today, mondayOffset - i));
  const maxPossible = habits.length || 1;

  const weeklyData = weekDays.map(day => {
    const count = habits.filter(h =>
      logs.some(l => l.habitId === h.id && isSameDay(new Date(l.date), day))
    ).length;
    return Math.round((count / maxPossible) * 100);
  });

  const isToday = (dayIndex: number) => isSameDay(weekDays.at(dayIndex)!, today);

  // Dynamic recommendations
  const todayMissing = habits.filter(h =>
    !logs.some(l => l.habitId === h.id && isSameDay(new Date(l.date), today))
  );

  const consistencyLevel = consistency >= 80 ? 'high' : consistency >= 50 ? 'medium' : 'low';

  const dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  // Calculate segments for progress bar (5 segments)
  const filledSegments = Math.round(consistency / 20);

  return (
    <section className="lg:col-span-4 space-y-6 lg:space-y-8">
      <div className="glass-panel p-4 lg:p-8 lg:sticky lg:top-margin-desktop">
        <div className="mb-10">
          <h2 className="font-headline-md text-headline-md text-primary-fixed-dim border-b border-primary-fixed-dim/20 pb-4">PERFORMANCE</h2>
          <div className="mt-8">
            <div className="flex justify-between items-center mb-2">
              <span className="font-label-caps text-[10px] text-on-surface-variant">SYSTEM CONSISTENCY</span>
              <span className="font-data-display text-data-display text-primary-fixed-dim">{consistency.toFixed(1)}%</span>
            </div>
            <div className="h-1 w-full bg-white/5 flex gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className={`h-full w-[20%] transition-all duration-700 ${
                    i < filledSegments ? 'bg-primary-fixed-dim' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Dynamic Bar Chart */}
        <div className="relative h-64 w-full bg-surface-container-lowest/50 border border-white/5 p-4 overflow-hidden group">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: isDark
              ? "linear-gradient(0deg, transparent 24%, rgba(0, 220, 230, .05) 25%, rgba(0, 220, 230, .05) 26%, transparent 27%, transparent 74%, rgba(0, 220, 230, .05) 75%, rgba(0, 220, 230, .05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 220, 230, .05) 25%, rgba(0, 220, 230, .05) 26%, transparent 27%, transparent 74%, rgba(0, 220, 230, .05) 75%, rgba(0, 220, 230, .05) 76%, transparent 77%, transparent)"
              : "linear-gradient(0deg, transparent 24%, rgba(0, 105, 111, .06) 25%, rgba(0, 105, 111, .06) 26%, transparent 27%, transparent 74%, rgba(0, 105, 111, .06) 75%, rgba(0, 105, 111, .06) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 105, 111, .06) 25%, rgba(0, 105, 111, .06) 26%, transparent 27%, transparent 74%, rgba(0, 105, 111, .06) 75%, rgba(0, 105, 111, .06) 76%, transparent 77%, transparent)",
            backgroundSize: "30px 30px"
          }}></div>
          
          <div className="relative z-10 h-full flex flex-col justify-end">
            <div className="flex items-end justify-between h-32 gap-1 px-2">
              {weeklyData.map((pct, i) => (
                <div
                  key={i}
                  className={`w-full transition-all duration-500 ${
                    isToday(i)
                      ? 'bg-primary-fixed-dim/40 border-t-2 border-primary-fixed-dim animate-pulse'
                      : 'bg-primary-fixed-dim/20 hover:bg-primary-fixed-dim/40'
                  }`}
                  style={{ height: `${Math.max(pct, 4)}%` }}
                  title={`${dayLabels.at(i)}: ${pct}%`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-4 px-2 font-label-caps text-[8px] text-on-surface-variant">
              {dayLabels.map(d => <span key={d}>{d}</span>)}
            </div>
          </div>
          <div className="absolute top-4 left-4 font-label-caps text-[10px] text-primary-fixed-dim opacity-50">WEEKLY_TELEMETRY</div>
        </div>
        
        {/* Dynamic Recommendations */}
        <div className="mt-8 space-y-4">
          <div className="p-4 bg-surface-container/50 border-l-2 border-primary-fixed-dim">
            <p className="font-label-caps text-[10px] text-on-surface-variant">SYSTEM STATUS</p>
            <p className="text-xs mt-1 leading-relaxed">
              {consistencyLevel === 'high'
                ? 'All systems nominal. Current performance exceeds baseline. Maintain habit adherence for continued optimization.'
                : consistencyLevel === 'medium'
                  ? 'System performance degraded. Recommend increasing habit execution frequency to restore optimal efficiency.'
                  : 'Critical performance deficit detected. Immediate habit re-engagement required to prevent further atrophy.'
              }
            </p>
          </div>
          {todayMissing.length > 0 && (
            <div className="p-4 bg-surface-container/50 border-l-2 border-secondary">
              <p className="font-label-caps text-[10px] text-secondary">MISSING ENTRIES</p>
              <p className="text-xs mt-1 leading-relaxed">
                {todayMissing.length === 1
                  ? `${todayMissing[0].title} not logged today.`
                  : `${todayMissing.length} habits not logged today: ${todayMissing.map(h => h.title).join(', ')}.`
                }
              </p>
            </div>
          )}
          {todayMissing.length === 0 && habits.length > 0 && (
            <div className="p-4 bg-surface-container/50 border-l-2 border-primary-fixed-dim/50">
              <p className="font-label-caps text-[10px] text-primary-fixed-dim">ALL CLEAR</p>
              <p className="text-xs mt-1 leading-relaxed">All habits executed for today. Outstanding operational status.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
