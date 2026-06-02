import { useHabits } from '../context/HabitContext';
import { useTheme } from '../context/ThemeContext';
import { startOfDay, subDays, isSameDay } from 'date-fns';
import HabitCard from '../components/HabitCard';
import { useOutletContext } from 'react-router-dom';
import { usePageTitle } from '../utils/usePageTitle';

export default function Habits() {
  usePageTitle('Habits');
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
    <div className="flex-grow space-y-8 max-w-[1200px] mx-auto w-full pb-24">
      {/* Massive Header */}
      <div className="mb-10 pt-8 lg:pt-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div>
          <h1 className="font-headline-lg text-4xl sm:text-6xl text-on-surface font-bold tracking-tight">Habits</h1>
          <div className="flex flex-wrap items-center gap-3 mt-5 font-label-caps text-[11px] sm:text-[13px] text-on-surface-variant/80 tracking-wider">
            <span>{habits.length} HABITS</span>
            <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/30"></span>
            <span className={weeklyProgress < 50 ? 'text-secondary' : 'text-primary-fixed-dim'}>{Math.round(weeklyProgress)}% WEEKLY PROGRESS</span>
            <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/30"></span>
            <span>{weeklyProgress > 80 ? 'SYSTEM OPTIMAL' : (weeklyProgress > 50 ? 'SYSTEM DEGRADED' : 'SYSTEM CRITICAL')}</span>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-6 py-3 bg-primary-fixed-dim text-background font-label-caps text-[12px] font-bold hover:bg-[#6ff6ff] transition-all cursor-pointer hover:shadow-[0_0_30px_rgba(0,220,230,0.5)] rounded-sm w-fit"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>NEW HABIT</span>
        </button>
      </div>

      {/* Progress & Legend */}
      <div className="bg-on-surface/5 p-6 lg:p-8 rounded-md border border-on-surface/5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex-grow w-full">
            <div className="flex justify-between items-end mb-4">
              <h2 className="font-label-caps text-xs text-on-surface font-bold tracking-widest uppercase">Weekly Capacity</h2>
              <span className="font-data-display text-2xl text-primary-fixed-dim font-bold drop-shadow-[0_0_8px_rgba(0,220,230,0.5)]">
                {Math.round(weeklyProgress)}%
              </span>
            </div>
            <div className="relative h-4 w-full bg-on-surface/10 overflow-hidden rounded-full border border-on-surface/5">
              <div
                className="absolute top-0 left-0 h-full transition-all duration-1000 rounded-full"
                style={{
                  width: `${weeklyProgress}%`,
                  background: isDark ? '#00f3ff' : '#00696f',
                  boxShadow: isDark ? '0 0 15px rgba(0,220,230,0.6)' : '0 0 10px rgba(0,105,111,0.35)'
                }}
              ></div>
              <div className="absolute top-0 left-0 h-full w-full opacity-20 pointer-events-none" style={{
                backgroundImage: `linear-gradient(90deg, transparent 49%, ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'} 50%, transparent 51%)`,
                backgroundSize: "20px 100%"
              }}></div>
            </div>
          </div>

          <div className="flex flex-row gap-6 items-center">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-primary-fixed-dim"></div>
              <span className="text-[11px] font-label-caps font-medium text-on-surface-variant">OPTIMIZED</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-on-surface-variant/20 border border-on-surface/20"></div>
              <span className="text-[11px] font-label-caps font-medium text-on-surface-variant">DEGRADED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Habit Cards */}
      {habits.length === 0 ? (
        <div className="bg-on-surface/5 rounded-md p-16 flex flex-col items-center justify-center gap-6 text-center border border-on-surface/5">
          <button
            onClick={openAddModal}
            className="w-20 h-20 rounded-full bg-primary-fixed-dim/10 text-primary-fixed-dim flex items-center justify-center hover:bg-primary-fixed-dim/20 transition-all cursor-pointer hover:scale-110 active:scale-95"
          >
            <span className="material-symbols-outlined text-[40px]">add</span>
          </button>
          <h3 className="font-headline-sm text-2xl text-on-surface">No Habits Initialized</h3>
          <p className="text-on-surface-variant/70 max-w-md">
            Click the add button to create your first habit protocol and start tracking your consistency.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:gap-6 pt-4">
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
