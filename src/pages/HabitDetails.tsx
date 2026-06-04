import { useState, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHabits } from '../context/HabitContext';
import ConfirmModal from '../components/ConfirmModal';

const EditHabitModal = lazy(() => import('../components/EditHabitModal'));

export default function HabitDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { habits, getStreak, getHighestStreak, getEfficiency, getPattern, deleteHabit, logHabit, logs } = useHabits();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const habit = habits.find(h => h.id === id);
  
  if (!habit) return (
    <div className="flex-grow flex flex-col items-center justify-center gap-4">
      <span className="material-symbols-outlined text-6xl text-error/40">error</span>
      <p className="font-headline-sm text-error">HABIT NOT FOUND</p>
      <button onClick={() => navigate('/habits')} className="text-primary-fixed-dim font-label-caps hover:underline cursor-pointer">
        RETURN TO CORE
      </button>
    </div>
  );

  const pattern = getPattern(habit.id, 60);
  const streak = getStreak(habit.id);
  const highestStreak = getHighestStreak(habit.id);
  const efficiency = getEfficiency(habit.id);
  const totalLogs = logs.filter(l => l.habitId === habit.id).length;

  // Check if logged today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const loggedToday = logs.some(l => {
    const logDate = new Date(l.date);
    logDate.setHours(0, 0, 0, 0);
    return l.habitId === habit.id && logDate.getTime() === today.getTime();
  });

  return (
    <div className="flex-grow max-w-[1200px] mx-auto w-full pb-24 space-y-8">
      <button onClick={() => navigate(-1)} className="text-on-surface-variant hover:text-primary-fixed-dim mt-8 flex items-center gap-2 cursor-pointer transition-colors w-fit">
        <span className="material-symbols-outlined">arrow_back</span>
        <span className="font-label-caps tracking-widest text-[11px]">RETURN</span>
      </button>
      
      <div className="bg-on-surface/5 rounded-md p-6 lg:p-10 border border-on-surface/5">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-on-surface/10 pb-8 mb-8">
          <div className="flex-1">
            <h1 className="font-headline-lg text-4xl sm:text-5xl text-on-surface flex items-center gap-4 font-bold tracking-tight break-words">
              <span className="material-symbols-outlined text-[48px] text-primary-fixed-dim shrink-0">{habit.icon}</span>
              <span>{habit.title}</span>
            </h1>
            {habit.description && (
              <p className="mt-4 text-on-surface-variant/90 text-sm sm:text-base max-w-2xl leading-relaxed whitespace-pre-wrap">
                {habit.description}
              </p>
            )}
            <p className="font-label-caps text-[11px] text-on-surface-variant mt-4 tracking-wider">CREATED: {new Date(habit.created_at).toLocaleDateString()}</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={() => {
                if (!loggedToday) logHabit(habit.id);
              }}
              disabled={loggedToday}
              className={`flex items-center justify-center gap-2 px-6 py-3 font-label-caps text-[11px] font-bold rounded-sm transition-all cursor-pointer tracking-widest ${
                loggedToday 
                  ? 'border-2 border-on-surface/10 text-on-surface/40 cursor-not-allowed bg-on-surface/5'
                  : 'bg-primary-fixed-dim text-background hover:bg-[#6ff6ff] hover:shadow-lg'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]" style={loggedToday ? {fontVariationSettings: "'FILL' 1"} : undefined}>
                {loggedToday ? 'check_circle' : 'add_circle'}
              </span>
              {loggedToday ? 'LOGGED TODAY' : 'LOG TODAY'}
            </button>
            <button 
              onClick={() => setShowEditModal(true)}
              className="border border-primary-fixed-dim/30 text-primary-fixed-dim hover:bg-primary-fixed-dim/10 px-6 py-3 font-label-caps text-[11px] font-bold rounded-sm transition-all cursor-pointer tracking-widest flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              EDIT
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="border-2 border-error/30 text-error hover:bg-error/10 hover:border-error/50 px-6 py-3 font-label-caps text-[11px] font-bold rounded-sm transition-all cursor-pointer tracking-widest flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              DELETE
            </button>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-10">
          <div className="bg-on-surface/5 rounded-md p-6 lg:p-8 text-center border border-on-surface/5 flex flex-col justify-between">
            <p className="font-label-caps text-[11px] text-on-surface-variant mb-2 tracking-wider">STREAK</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="font-data-display text-4xl text-primary-fixed-dim font-bold">{streak}</span>
              <span className="font-data-display text-2xl text-on-surface-variant/50">/ {highestStreak}</span>
            </div>
            <p className="font-label-caps text-[9px] text-on-surface-variant/60 mt-2 tracking-widest">CURRENT / BEST</p>
          </div>
          <div className="bg-on-surface/5 rounded-md p-6 lg:p-8 text-center border border-on-surface/5">
            <p className="font-label-caps text-[11px] text-on-surface-variant mb-2 tracking-wider">30-DAY EFFICIENCY</p>
            <p className="font-data-display text-4xl text-primary-fixed-dim font-bold">{efficiency}%</p>
            <p className="font-label-caps text-[9px] text-on-surface-variant/60 mt-2 tracking-widest">COMPLETION RATE</p>
          </div>
          <div className="bg-on-surface/5 rounded-md p-6 lg:p-8 text-center border border-on-surface/5">
            <p className="font-label-caps text-[11px] text-on-surface-variant mb-2 tracking-wider">TOTAL LOGS</p>
            <p className="font-data-display text-4xl text-primary-fixed-dim font-bold">{totalLogs}</p>
            <p className="font-label-caps text-[9px] text-on-surface-variant/60 mt-2 tracking-widest">ALL TIME</p>
          </div>
          <div className="bg-on-surface/5 rounded-md p-6 lg:p-8 text-center border border-on-surface/5">
            <p className="font-label-caps text-[11px] text-on-surface-variant mb-2 tracking-wider">STATUS</p>
            <p className={`font-data-display text-2xl font-bold mt-1 ${efficiency >= 80 ? 'text-primary-fixed-dim' : efficiency >= 50 ? 'text-secondary' : 'text-error'}`}>
              {efficiency >= 80 ? 'OPTIMAL' : efficiency >= 50 ? 'DEGRADED' : 'CRITICAL'}
            </p>
            <p className="font-label-caps text-[9px] text-on-surface-variant/60 mt-2 tracking-widest">ASSESSMENT</p>
          </div>
        </div>

        {/* 60-Day Habit Grid */}
        <div className="bg-on-surface/5 rounded-md p-6 lg:p-8 border border-on-surface/5">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline-sm text-2xl text-on-surface font-medium">Execution Matrix</h2>
            <span className="font-label-caps text-[11px] text-on-surface-variant tracking-wider">LAST 60 DAYS</span>
          </div>
          <div className="flex flex-wrap gap-[6px]">
            {pattern.map((active, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-[3px] transition-all duration-300 ${
                  active
                    ? 'bg-primary-fixed-dim'
                    : 'bg-on-surface/10 border border-on-surface/5'
                }`}
                title={`Day ${i + 1}: ${active ? 'Completed' : 'Missed'}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-6 pt-4 border-t border-on-surface/10">
            <span className="font-label-caps text-[9px] text-on-surface-variant/60 tracking-widest">60 DAYS AGO</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-[2px] bg-primary-fixed-dim"></div>
                <span className="font-label-caps text-[9px] text-on-surface-variant/60 tracking-widest">EXECUTED</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-[2px] bg-on-surface/10 border border-on-surface/5"></div>
                <span className="font-label-caps text-[9px] text-on-surface-variant/60 tracking-widest">MISSED</span>
              </div>
            </div>
            <span className="font-label-caps text-[9px] text-on-surface-variant/60 tracking-widest">TODAY</span>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          title="DELETE HABIT"
          message={`Permanently delete "${habit.title}" and all associated logs? This action cannot be undone.`}
          confirmLabel="DELETE"
          onConfirm={() => {
            deleteHabit(habit.id);
            navigate('/habits');
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {showEditModal && (
        <Suspense fallback={null}>
          <EditHabitModal
            habit={habit}
            onClose={() => setShowEditModal(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
