/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { startOfDay, isSameDay, subDays } from 'date-fns';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useSync } from './SyncContext';
import { assertOwnedDocument } from '../utils/firestoreOwnership';
import { sortTasksByOrder, type Task } from '../domain/tasks';

export type { Subtask, Task } from '../domain/tasks';

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'completed_at' | 'userId'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'created_at' | 'userId'>>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  addSubtask: (taskId: string, title: string) => Promise<void>;
  removeSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  moveStatus: (id: string, status: Task['status']) => Promise<void>;
  getOverdueTasks: () => Task[];
  getTodayTasks: () => Task[];
  getCompletionStats: (days: number) => { completed: number; total: number; rate: number };
  getCategories: () => string[];
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { runSync } = useSync();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!currentUser) {
      setTimeout(() => {
        setTasks([]);
      }, 0);
      return;
    }

    const tasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      const fetchedTasks: Task[] = [];
      snapshot.forEach((doc) => {
        fetchedTasks.push({ id: doc.id, ...doc.data() } as Task);
      });
      setTasks(sortTasksByOrder(fetchedTasks));
    });

    return () => unsubscribe();
  }, [currentUser]);

  const addTask = useCallback((task: Omit<Task, 'id' | 'created_at' | 'completed_at' | 'userId'>) => runSync(async () => {
    if (!currentUser) return;
    const now = new Date().toISOString();
    await addDoc(collection(db, 'tasks'), {
      ...task,
      userId: currentUser.uid,
      created_at: now,
      completed_at: null,
      order: Date.now(),
    });
  }), [currentUser, runSync]);

  const updateTask = useCallback((id: string, updates: Partial<Omit<Task, 'id' | 'created_at' | 'userId'>>) => runSync(async () => {
    if (!currentUser) return;
    await assertOwnedDocument('tasks', id, currentUser.uid);
    const taskRef = doc(db, 'tasks', id);
    const updatedData: Record<string, unknown> = { ...updates };
    
    // Auto-set completed_at when moving to done
    if (updates.status === 'done') {
      updatedData.completed_at = new Date().toISOString();
    }
    // Clear completed_at if moving back from done
    if (updates.status && updates.status !== 'done') {
      updatedData.completed_at = null;
    }

    await updateDoc(taskRef, updatedData);
  }), [currentUser, runSync]);

  const deleteTask = useCallback((id: string) => runSync(async () => {
    if (!currentUser) return;
    await assertOwnedDocument('tasks', id, currentUser.uid);
    await deleteDoc(doc(db, 'tasks', id));
  }), [currentUser, runSync]);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => runSync(async () => {
    if (!currentUser) return;
    await assertOwnedDocument('tasks', taskId, currentUser.uid);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updatedSubtasks = task.subtasks.map(st => 
      st.id === subtaskId ? { ...st, done: !st.done } : st
    );
    await updateDoc(doc(db, 'tasks', taskId), { subtasks: updatedSubtasks });
  }), [currentUser, runSync, tasks]);

  const addSubtask = useCallback((taskId: string, title: string) => runSync(async () => {
    if (!currentUser) return;
    await assertOwnedDocument('tasks', taskId, currentUser.uid);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newSubtask = { id: crypto.randomUUID(), title, done: false };
    await updateDoc(doc(db, 'tasks', taskId), { subtasks: [...task.subtasks, newSubtask] });
  }), [currentUser, runSync, tasks]);

  const removeSubtask = useCallback((taskId: string, subtaskId: string) => runSync(async () => {
    if (!currentUser) return;
    await assertOwnedDocument('tasks', taskId, currentUser.uid);
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updatedSubtasks = task.subtasks.filter(st => st.id !== subtaskId);
    await updateDoc(doc(db, 'tasks', taskId), { subtasks: updatedSubtasks });
  }), [currentUser, runSync, tasks]);

  const moveStatus = useCallback((id: string, status: Task['status']) => runSync(async () => {
    await updateTask(id, { status });
  }), [runSync, updateTask]);

  const getOverdueTasks = useCallback((): Task[] => {
    const now = startOfDay(new Date());
    return tasks.filter(t =>
      t.status !== 'done' && t.due_date && new Date(t.due_date) < now
    );
  }, [tasks]);

  const getTodayTasks = useCallback((): Task[] => {
    const today = startOfDay(new Date());
    return tasks.filter(t =>
      t.due_date && isSameDay(new Date(t.due_date), today)
    );
  }, [tasks]);

  const getCompletionStats = useCallback((days: number) => {
    const cutoff = subDays(new Date(), days);
    const recentTasks = tasks.filter(t => new Date(t.created_at) >= cutoff || (t.completed_at && new Date(t.completed_at) >= cutoff));
    const completed = recentTasks.filter(t => t.status === 'done').length;
    const total = recentTasks.length;
    return {
      completed,
      total,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [tasks]);

  const getCategories = useCallback((): string[] => {
    const cats = new Set(tasks.map(t => t.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [tasks]);

  const value = useMemo(() => ({
    tasks, addTask, updateTask, deleteTask,
    toggleSubtask, addSubtask, removeSubtask, moveStatus,
    getOverdueTasks, getTodayTasks, getCompletionStats, getCategories,
  }), [tasks, addTask, updateTask, deleteTask, toggleSubtask, addSubtask, removeSubtask, moveStatus, getOverdueTasks, getTodayTasks, getCompletionStats, getCategories]);

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
