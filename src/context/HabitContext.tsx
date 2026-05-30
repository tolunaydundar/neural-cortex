import { createContext, useContext, useState, useEffect } from 'react';
import { subDays, isSameDay, startOfDay } from 'date-fns';

export interface Habit {
  id: string;
  title: string;
  icon: string;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // ISO string
}

interface HabitContextType {
  habits: Habit[];
  logs: HabitLog[];
  addHabit: (habit: Omit<Habit, 'id' | 'created_at'>) => void;
  logHabit: (habitId: string, date?: Date) => void;
  removeLog: (logId: string) => void;
  deleteHabit: (habitId: string) => void;
  getStreak: (habitId: string) => number;
  getEfficiency: (habitId: string, days?: number) => number;
  getPattern: (habitId: string, days?: number) => boolean[];
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

const DEFAULT_HABITS: Habit[] = [
  { id: '1', title: 'Neural Link (Meditation)', icon: 'psychology', created_at: new Date().toISOString() },
  { id: '2', title: 'Physical Optimization (Gym)', icon: 'fitness_center', created_at: new Date().toISOString() },
  { id: '3', title: 'Deep Code (Focus Work)', icon: 'terminal', created_at: new Date().toISOString() },
];

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [habits, setHabits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('nexus_habits');
    return saved ? JSON.parse(saved) : DEFAULT_HABITS;
  });

  const [logs, setLogs] = useState<HabitLog[]>(() => {
    const saved = localStorage.getItem('nexus_logs');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('nexus_habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('nexus_logs', JSON.stringify(logs));
  }, [logs]);

  const addHabit = (habit: Omit<Habit, 'id' | 'created_at'>) => {
    const newHabit = {
      ...habit,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    setHabits(prev => [...prev, newHabit]);
  };

  const logHabit = (habitId: string, date: Date = new Date()) => {
    // Prevent duplicate logs for the same day
    const existingLog = logs.find(log => log.habitId === habitId && isSameDay(new Date(log.date), date));
    if (existingLog) return;

    const newLog: HabitLog = {
      id: crypto.randomUUID(),
      habitId,
      date: date.toISOString()
    };
    setLogs(prev => [...prev, newLog]);
  };

  const removeLog = (logId: string) => {
    setLogs(prev => prev.filter(log => log.id !== logId));
  };

  const deleteHabit = (habitId: string) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));
    setLogs(prev => prev.filter(l => l.habitId !== habitId));
  };

  const getStreak = (habitId: string): number => {
    const habitLogs = logs
      .filter(l => l.habitId === habitId)
      .map(l => startOfDay(new Date(l.date)).getTime())
      .sort((a, b) => b - a);

    if (habitLogs.length === 0) return 0;

    let streak = 0;
    let currentDate = startOfDay(new Date()).getTime();
    
    // Check if logged today or yesterday to continue streak
    if (habitLogs[0] !== currentDate && habitLogs[0] !== currentDate - 86400000) {
      return 0;
    }

    let expectedDate = habitLogs[0];
    
    for (let i = 0; i < habitLogs.length; i++) {
      if (habitLogs[i] === expectedDate) {
        streak++;
        expectedDate -= 86400000; // Subtract one day
      } else {
        break;
      }
    }

    return streak;
  };

  const getPattern = (habitId: string, days: number = 30): boolean[] => {
    const pattern = [];
    const today = startOfDay(new Date());
    
    for (let i = days - 1; i >= 0; i--) {
      const dateToCheck = subDays(today, i);
      const isLogged = logs.some(l => l.habitId === habitId && isSameDay(new Date(l.date), dateToCheck));
      pattern.push(isLogged);
    }
    return pattern;
  };

  const getEfficiency = (habitId: string, days: number = 30): number => {
    const pattern = getPattern(habitId, days);
    const completedDays = pattern.filter(Boolean).length;
    return Math.round((completedDays / days) * 100);
  };

  return (
    <HabitContext.Provider value={{ habits, logs, addHabit, logHabit, removeLog, deleteHabit, getStreak, getEfficiency, getPattern }}>
      {children}
    </HabitContext.Provider>
  );
};

export const useHabits = () => {
  const context = useContext(HabitContext);
  if (context === undefined) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return context;
};
