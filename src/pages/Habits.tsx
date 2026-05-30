import { useHabits } from '../context/HabitContext';
import { useTheme } from '../context/ThemeContext';
import { startOfDay, subDays, isSameDay } from 'date-fns';
import HabitCard from '../components/HabitCard';
import { useOutletContext } from 'react-router-dom';

export default function Habits() {
  const { habits, logs, getStreak, getEfficiency, getPattern } = useHabits();
  const { isDark } = useTheme();
  const { openAddModal } = useOutletContext<{ openAddModal: () => void }>();

  const today = startOfDay(new Date());
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(today, i));
  const possibleCompletions = habits.length * 7;

  const actualCompletions = possibleCompletions > 0 ? logs.filter(log => {
    const logDate = new Date(log.date);
    return habits.some(h => h.id === log.habitId) && last7Days.some(d => isSameDay(d, logDate));
  }).length : 0;

  const weeklyProgress = possibleCompletions > 0 ? (actualCompletions / possibleCompletions) * 100 : 0;

  return (
    <div className="flex-grow space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg text-primary-fixed-dim">Habit Grid</h1>
          <p className="text-on-surface-variant font-label-caps text-[10px] mt-1">MONTHLY CONSISTENCY & PROTOCOL MANAGEMENT</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary-fixed-dim text-background font-label-caps text-xs hover:bg-[#6ff6ff] transition-colors cursor-pointer shadow-[0_0_15px_rgba(0,220,230,0.4)] hover:shadow-[0_0_20px_rgba(0,220,230,0.6)] rounded-sm w-fit"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          <span>NEW PROTOCOL</span>
        </button>
      </div>

      {/* Weekly Progress */}
      <div className="glass-panel p-4 lg:p-6 rounded-lg shadow-[0_0_20px_rgba(0,220,230,0.05)]">
        <div className="flex justify-between items-end mb-4">
          <h2 className="font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase">Weekly Progress</h2>
          <span className="font-data-display text-data-display text-primary-fixed-dim drop-shadow-[0_0_8px_rgba(0,220,230,0.5)]">
            {Math.round(weeklyProgress)}%
          </span>
        </div>
        <div className="relative h-4 w-full bg-surface-container-lowest overflow-hidden border border-white/5">
          <div
            className="absolute top-0 left-0 h-full transition-all duration-1000"
            style={{
              width: `${weeklyProgress}%`,
              background: isDark ? '#00f3ff' : '#00696f',
              boxShadow: isDark ? '0 0 15px rgba(0,220,230,0.6)' : '0 0 10px rgba(0,105,111,0.35)'
            }}
          ></div>
          <div className="absolute top-0 left-0 h-full w-full opacity-20 pointer-events-none" style={{
            backgroundImage: `linear-gradient(90deg, transparent 49%, ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'} 50%, transparent 51%)`,
            backgroundSize: "20px 100%"
          }}></div>
        </div>
        <div className="mt-3 flex justify-between items-center">
          <span className="font-label-caps text-[10px] text-primary-fixed-dim/70 tracking-widest">
            SYSTEM CAPACITY: {weeklyProgress > 80 ? 'NOMINAL' : (weeklyProgress > 50 ? 'DEGRADED' : 'CRITICAL')}
          </span>
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-primary-fixed-dim animate-pulse"></div>
            <div className="w-1 h-1 bg-primary-fixed-dim/40"></div>
            <div className="w-1 h-1 bg-primary-fixed-dim/20"></div>
          </div>
        </div>
      </div>

      {/* Grid Legend */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-headline-md text-headline-md text-primary-fixed-dim">PROTOCOL MATRIX</h2>
          <p className="text-on-surface-variant font-label-caps text-[10px] mt-1">30-DAY EXECUTION PATTERNS</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary-fixed-dim shadow-[0_0_4px_#00dce6]"></div>
            <span className="text-[10px] font-label-caps">OPTIMIZED</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-outline-variant/30 border border-white/10"></div>
            <span className="text-[10px] font-label-caps">DEGRADED</span>
          </div>
        </div>
      </div>

      {/* Habit Cards */}
      {habits.length === 0 ? (
        <div className="glass-panel p-12 flex flex-col items-center justify-center gap-4 text-center">
          <button
            onClick={openAddModal}
            className="material-symbols-outlined text-6xl text-primary-fixed-dim/20 hover:text-primary-fixed-dim transition-colors cursor-pointer outline-none focus:outline-none hover:scale-110 active:scale-95"
          >
            add_circle
          </button>
          <h3 className="font-headline-sm text-headline-sm text-on-surface-variant">NO PROTOCOLS INITIALIZED</h3>
          <p className="text-sm text-on-surface-variant/60 max-w-md">
            Click the <span className="text-primary-fixed-dim font-semibold">+</span> button above to create your first habit protocol and start tracking.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {habits.map(habit => (
            <HabitCard
              key={habit.id}
              id={habit.id}
              title={habit.title}
              streak={getStreak(habit.id)}
              icon={habit.icon}
              efficiency={getEfficiency(habit.id)}
              pattern={getPattern(habit.id, 30)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
