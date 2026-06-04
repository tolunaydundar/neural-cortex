/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { subDays, isSameDay, startOfDay } from 'date-fns';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, where, getDocs, writeBatch, setDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useSync } from './SyncContext';
import { assertOwnedDocument } from '../utils/firestoreOwnership';
import { sortHabitsByCreatedAt, type Habit, type HabitLog } from '../domain/habits';

export type { Habit, HabitLog } from '../domain/habits';

interface HabitContextType {
  habits: Habit[];
  logs: HabitLog[];
  addHabit: (habit: Omit<Habit, 'id' | 'created_at' | 'userId'>) => Promise<void>;
  updateHabit: (habitId: string, updates: Partial<Omit<Habit, 'id' | 'created_at' | 'userId'>>) => Promise<void>;
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
      setHabits(sortHabitsByCreatedAt(fetchedHabits));
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

  const addHabit = useCallback((habit: Omit<Habit, 'id' | 'created_at' | 'userId'>) => runSync(async () => {
    if (!currentUser) return;
    await addDoc(collection(db, 'habits'), {
      ...habit,
      userId: currentUser.uid,
      created_at: new Date().toISOString()
    });
  }), [currentUser, runSync]);

  const updateHabit = useCallback((habitId: string, updates: Partial<Omit<Habit, 'id' | 'created_at' | 'userId'>>) => runSync(async () => {
    if (!currentUser) return;
    await assertOwnedDocument('habits', habitId, currentUser.uid);
    await setDoc(doc(db, 'habits', habitId), updates, { merge: true });
  }), [currentUser, runSync]);

  const logHabit = useCallback((habitId: string, date: Date = new Date()) => runSync(async () => {
    if (!currentUser) return;

    // Prevent duplicate logs for the same day (client side check)
    const existingLog = logs.find(log => log.habitId === habitId && isSameDay(new Date(log.date), date));
    if (existingLog) return;

    const day = startOfDay(date);
    const dateKey = day.toISOString().slice(0, 10);
    const logId = `${currentUser.uid}_${habitId}_${dateKey}`;

    await setDoc(doc(db, 'habit_logs', logId), {
      habitId,
      userId: currentUser.uid,
      date: day.toISOString(),
    });
  }), [currentUser, logs, runSync]);

  const removeLog = useCallback((logId: string) => runSync(async () => {
    if (!currentUser) return;
    await assertOwnedDocument('habit_logs', logId, currentUser.uid);
    await deleteDoc(doc(db, 'habit_logs', logId));
  }), [currentUser, runSync]);

  const deleteHabit = useCallback((habitId: string) => runSync(async () => {
    if (!currentUser) return;
    await assertOwnedDocument('habits', habitId, currentUser.uid);
    await deleteDoc(doc(db, 'habits', habitId));

    const logsQuery = query(
      collection(db, 'habit_logs'),
      where('habitId', '==', habitId),
      where('userId', '==', currentUser.uid)
    );
    const logsSnapshot = await getDocs(logsQuery);

    // Use a batch to delete all related logs efficiently
    const batch = writeBatch(db);
    logsSnapshot.forEach((logDoc) => {
      batch.delete(doc(db, 'habit_logs', logDoc.id));
    });
    await batch.commit();
  }), [currentUser, runSync]);

  const getStreak = useCallback((habitId: string): number => {
    const uniqueLogDates = Array.from(new Set(
      logs
        .filter(l => l.habitId === habitId)
        .map(l => startOfDay(new Date(l.date)).getTime())
    )).sort((a, b) => b - a);

    if (uniqueLogDates.length === 0) return 0;

    let streak = 0;
    const currentDate = startOfDay(new Date()).getTime();

    // Check if logged today or yesterday to continue streak
    if (uniqueLogDates[0] !== currentDate && uniqueLogDates[0] !== currentDate - 86400000) {
      return 0;
    }

    let expectedDate = uniqueLogDates[0];

    for (const date of uniqueLogDates) {
      if (date === expectedDate) {
        streak++;
        expectedDate -= 86400000; // Subtract one day
      } else {
        break;
      }
    }

    return streak;
  }, [logs]);

  const getPattern = useCallback((habitId: string, days: number = 30): boolean[] => {
    const pattern = [];
    const today = startOfDay(new Date());

    for (let i = days - 1; i >= 0; i--) {
      const dateToCheck = subDays(today, i);
      const isLogged = logs.some(l => l.habitId === habitId && isSameDay(new Date(l.date), dateToCheck));
      pattern.push(isLogged);
    }
    return pattern;
  }, [logs]);

  const getEfficiency = useCallback((habitId: string, days: number = 30): number => {
    const pattern = getPattern(habitId, days);
    const completedDays = pattern.filter(Boolean).length;
    return Math.round((completedDays / days) * 100);
  }, [getPattern]);

  const value = useMemo(() => ({
    habits, logs, addHabit, updateHabit, logHabit, removeLog, deleteHabit, getStreak, getEfficiency, getPattern
  }), [habits, logs, addHabit, updateHabit, logHabit, removeLog, deleteHabit, getStreak, getEfficiency, getPattern]);

  return (
    <HabitContext.Provider value={value}>
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
