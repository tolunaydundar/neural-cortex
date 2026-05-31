/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { subDays, isSameDay, startOfDay } from 'date-fns';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useSync } from './SyncContext';

export interface Habit {
  id: string;
  title: string;
  icon: string;
  created_at: string;
  userId: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // ISO string
  userId: string;
}

interface HabitContextType {
  habits: Habit[];
  logs: HabitLog[];
  addHabit: (habit: Omit<Habit, 'id' | 'created_at' | 'userId'>) => Promise<void>;
  logHabit: (habitId: string, date?: Date) => Promise<void>;
  removeLog: (logId: string) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  getStreak: (habitId: string) => number;
  getEfficiency: (habitId: string, days?: number) => number;
  getPattern: (habitId: string, days?: number) => boolean[];
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { runSync } = useSync();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);

  useEffect(() => {
    if (!currentUser) {
      setTimeout(() => {
        setHabits([]);
        setLogs([]);
      }, 0);
      return;
    }

    const habitsQuery = query(
      collection(db, 'habits'),
      where('userId', '==', currentUser.uid)
    );
    
    const unsubscribeHabits = onSnapshot(habitsQuery, (snapshot) => {
      const fetchedHabits: Habit[] = [];
      snapshot.forEach((doc) => {
        fetchedHabits.push({ id: doc.id, ...doc.data() } as Habit);
      });
      // Sort by created_at ascending
      fetchedHabits.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setHabits(fetchedHabits);
    });

    const logsQuery = query(
      collection(db, 'habit_logs'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const fetchedLogs: HabitLog[] = [];
      snapshot.forEach((doc) => {
        fetchedLogs.push({ id: doc.id, ...doc.data() } as HabitLog);
      });
      setLogs(fetchedLogs);
    });

    return () => {
      unsubscribeHabits();
      unsubscribeLogs();
    };
  }, [currentUser]);

  const addHabit = (habit: Omit<Habit, 'id' | 'created_at' | 'userId'>) => runSync(async () => {
    if (!currentUser) return;
    await addDoc(collection(db, 'habits'), {
      ...habit,
      userId: currentUser.uid,
      created_at: new Date().toISOString()
    });
  });

  const logHabit = (habitId: string, date: Date = new Date()) => runSync(async () => {
    if (!currentUser) return;
    
    // Prevent duplicate logs for the same day (client side check)
    const existingLog = logs.find(log => log.habitId === habitId && isSameDay(new Date(log.date), date));
    if (existingLog) return;

    await addDoc(collection(db, 'habit_logs'), {
      habitId,
      userId: currentUser.uid,
      date: date.toISOString()
    });
  });

  const removeLog = (logId: string) => runSync(async () => {
    await deleteDoc(doc(db, 'habit_logs', logId));
  });

  const deleteHabit = (habitId: string) => runSync(async () => {
    // Delete the habit document
    await deleteDoc(doc(db, 'habits', habitId));
    
    // Query and delete all associated logs
    const logsQuery = query(
      collection(db, 'habit_logs'),
      where('habitId', '==', habitId)
    );
    const logsSnapshot = await getDocs(logsQuery);
    
    // Use a batch to delete all related logs efficiently
    const batch = writeBatch(db);
    logsSnapshot.forEach((logDoc) => {
      batch.delete(doc(db, 'habit_logs', logDoc.id));
    });
    await batch.commit();
  });

  const getStreak = (habitId: string): number => {
    const habitLogs = logs
      .filter(l => l.habitId === habitId)
      .map(l => startOfDay(new Date(l.date)).getTime())
      .sort((a, b) => b - a);

    if (habitLogs.length === 0) return 0;

    let streak = 0;
    const currentDate = startOfDay(new Date()).getTime();
    
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
