import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { startOfDay, isSameDay, subDays } from 'date-fns';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { useAuth } from './AuthContext';

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'done';
  category: string;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
  subtasks: Subtask[];
  userId: string;
}

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
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!currentUser) {
      setTasks([]);
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
      // Sort in memory by created_at ascending (or descending, depends on preference, let's keep original ordering which wasn't strictly enforced, but let's do descending)
      fetchedTasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTasks(fetchedTasks);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const addTask = async (task: Omit<Task, 'id' | 'created_at' | 'completed_at' | 'userId'>) => {
    if (!currentUser) return;
    const now = new Date().toISOString();
    await addDoc(collection(db, 'tasks'), {
      ...task,
      userId: currentUser.uid,
      created_at: now,
      completed_at: null,
    });
  };

  const updateTask = async (id: string, updates: Partial<Omit<Task, 'id' | 'created_at' | 'userId'>>) => {
    const taskRef = doc(db, 'tasks', id);
    const updatedData: any = { ...updates };
    
    // Auto-set completed_at when moving to done
    if (updates.status === 'done') {
      updatedData.completed_at = new Date().toISOString();
    }
    // Clear completed_at if moving back from done
    if (updates.status && updates.status !== 'done') {
      updatedData.completed_at = null;
    }

    await updateDoc(taskRef, updatedData);
  };

  const deleteTask = async (id: string) => {
    await deleteDoc(doc(db, 'tasks', id));
  };

  const toggleSubtask = async (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updatedSubtasks = task.subtasks.map(st => 
      st.id === subtaskId ? { ...st, done: !st.done } : st
    );
    await updateDoc(doc(db, 'tasks', taskId), { subtasks: updatedSubtasks });
  };

  const addSubtask = async (taskId: string, title: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newSubtask = { id: crypto.randomUUID(), title, done: false };
    await updateDoc(doc(db, 'tasks', taskId), { subtasks: [...task.subtasks, newSubtask] });
  };

  const removeSubtask = async (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const updatedSubtasks = task.subtasks.filter(st => st.id !== subtaskId);
    await updateDoc(doc(db, 'tasks', taskId), { subtasks: updatedSubtasks });
  };

  const moveStatus = async (id: string, status: Task['status']) => {
    await updateTask(id, { status });
  };

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

  return (
    <TaskContext.Provider value={{
      tasks, addTask, updateTask, deleteTask,
      toggleSubtask, addSubtask, removeSubtask, moveStatus,
      getOverdueTasks, getTodayTasks, getCompletionStats, getCategories,
    }}>
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
