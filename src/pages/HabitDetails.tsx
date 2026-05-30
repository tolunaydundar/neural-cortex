import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHabits } from '../context/HabitContext';
import ConfirmModal from '../components/ConfirmModal';

export default function HabitDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { habits, getStreak, getEfficiency, getPattern, deleteHabit, logHabit, logs } = useHabits();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const habit = habits.find(h => h.id === id);
  
  if (!habit) return (
    <div className="flex-grow flex flex-col items-center justify-center gap-4">
      <span className="material-symbols-outlined text-6xl text-error/40">error</span>
      <p className="font-headline-sm text-error">PROTOCOL NOT FOUND</p>
      <button onClick={() => navigate('/')} className="text-primary-fixed-dim font-label-caps hover:underline cursor-pointer">
        RETURN TO CORE
      </button>
    </div>
  );

  const pattern = getPattern(habit.id, 60);
  const streak = getStreak(habit.id);
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
    <div className="flex-grow">
      <button onClick={() => navigate(-1)} className="text-on-surface-variant hover:text-primary-fixed-dim mb-8 flex items-center gap-2 cursor-pointer transition-colors">
        <span className="material-symbols-outlined">arrow_back</span>
        <span className="font-label-caps">RETURN</span>
      </button>
      
      <div className="glass-panel p-4 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-white/10 pb-6 mb-6">
          <div>
            <h1 className="font-headline-lg text-primary-fixed-dim flex items-center gap-4">
              <span className="material-symbols-outlined text-4xl">{habit.icon}</span>
              {habit.title}
            </h1>
            <p className="font-label-caps text-on-surface-variant mt-2">CREATED: {new Date(habit.created_at).toLocaleDateString()}</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={() => {
                if (!loggedToday) logHabit(habit.id);
              }}
              disabled={loggedToday}
              className={`flex items-center gap-2 px-4 py-2 font-label-caps transition-colors cursor-pointer ${
                loggedToday 
                  ? 'border border-primary-fixed-dim/20 text-primary-fixed-dim/40 cursor-not-allowed'
                  : 'border border-primary-fixed-dim text-primary-fixed-dim hover:bg-primary-fixed-dim/10'
              }`}
            >
              <span className="material-symbols-outlined text-sm" style={loggedToday ? {fontVariationSettings: "'FILL' 1"} : undefined}>
                {loggedToday ? 'check_circle' : 'add_circle'}
              </span>
              {loggedToday ? 'LOGGED TODAY' : 'LOG TODAY'}
            </button>
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="border border-error text-error hover:bg-error/10 px-4 py-2 font-label-caps transition-colors cursor-pointer"
            >
              DELETE
            </button>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-8">
          <div className="glass-panel p-4 lg:p-6 text-center">
            <p className="font-label-caps text-[10px] text-on-surface-variant mb-2">CURRENT STREAK</p>
            <p className="font-data-display text-2xl lg:text-3xl text-primary-fixed-dim">{streak}</p>
            <p className="font-label-caps text-[8px] text-on-surface-variant/60 mt-1">DAYS</p>
          </div>
          <div className="glass-panel p-4 lg:p-6 text-center">
            <p className="font-label-caps text-[10px] text-on-surface-variant mb-2">30-DAY EFFICIENCY</p>
            <p className="font-data-display text-2xl lg:text-3xl text-primary-fixed-dim">{efficiency}%</p>
            <p className="font-label-caps text-[8px] text-on-surface-variant/60 mt-1">COMPLETION RATE</p>
          </div>
          <div className="glass-panel p-4 lg:p-6 text-center">
            <p className="font-label-caps text-[10px] text-on-surface-variant mb-2">TOTAL LOGS</p>
            <p className="font-data-display text-2xl lg:text-3xl text-primary-fixed-dim">{totalLogs}</p>
            <p className="font-label-caps text-[8px] text-on-surface-variant/60 mt-1">ALL TIME</p>
          </div>
          <div className="glass-panel p-4 lg:p-6 text-center">
            <p className="font-label-caps text-[10px] text-on-surface-variant mb-2">STATUS</p>
            <p className={`font-data-display text-xl ${efficiency >= 80 ? 'text-primary-fixed-dim' : efficiency >= 50 ? 'text-secondary' : 'text-error'}`}>
              {efficiency >= 80 ? 'OPTIMAL' : efficiency >= 50 ? 'DEGRADED' : 'CRITICAL'}
            </p>
            <p className="font-label-caps text-[8px] text-on-surface-variant/60 mt-1">ASSESSMENT</p>
          </div>
        </div>

        {/* 60-Day Habit Grid */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-headline-sm text-headline-sm text-primary-fixed-dim">EXECUTION MATRIX</h2>
            <span className="font-label-caps text-[10px] text-on-surface-variant">LAST 60 DAYS</span>
          </div>
          <div className="flex flex-wrap gap-[4px]">
            {pattern.map((active, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-[1px] transition-all duration-300 ${
                  active
                    ? 'bg-primary-fixed-dim shadow-[0_0_6px_rgba(0,220,230,0.5)]'
                    : 'bg-outline-variant/20 border border-white/5'
                }`}
                title={`Day ${i + 1}: ${active ? 'Completed' : 'Missed'}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-3">
            <span className="font-label-caps text-[8px] text-on-surface-variant/50">60 DAYS AGO</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-primary-fixed-dim shadow-[0_0_4px_#00dce6]"></div>
                <span className="font-label-caps text-[8px] text-on-surface-variant/50">EXECUTED</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-outline-variant/20 border border-white/5"></div>
                <span className="font-label-caps text-[8px] text-on-surface-variant/50">MISSED</span>
              </div>
            </div>
            <span className="font-label-caps text-[8px] text-on-surface-variant/50">TODAY</span>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          title="DELETE PROTOCOL"
          message={`Permanently delete "${habit.title}" and all associated logs? This action cannot be undone.`}
          confirmLabel="DELETE"
          onConfirm={() => {
            deleteHabit(habit.id);
            navigate('/');
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
