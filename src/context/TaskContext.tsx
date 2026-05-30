import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { startOfDay, isSameDay, subDays } from 'date-fns';

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
}

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'completed_at'>) => void;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'created_at'>>) => void;
  deleteTask: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  removeSubtask: (taskId: string, subtaskId: string) => void;
  moveStatus: (id: string, status: Task['status']) => void;
  getOverdueTasks: () => Task[];
  getTodayTasks: () => Task[];
  getCompletionStats: (days: number) => { completed: number; total: number; rate: number };
  getCategories: () => string[];
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('nexus_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('nexus_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (task: Omit<Task, 'id' | 'created_at' | 'completed_at'>) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      completed_at: null,
    };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = (id: string, updates: Partial<Omit<Task, 'id' | 'created_at'>>) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, ...updates };
      // Auto-set completed_at when moving to done
      if (updates.status === 'done' && !t.completed_at) {
        updated.completed_at = new Date().toISOString();
      }
      // Clear completed_at if moving back from done
      if (updates.status && updates.status !== 'done') {
        updated.completed_at = null;
      }
      return updated;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: t.subtasks.map(st =>
          st.id === subtaskId ? { ...st, done: !st.done } : st
        ),
      };
    }));
  };

  const addSubtask = (taskId: string, title: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: [...t.subtasks, { id: crypto.randomUUID(), title, done: false }],
      };
    }));
  };

  const removeSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        subtasks: t.subtasks.filter(st => st.id !== subtaskId),
      };
    }));
  };

  const moveStatus = (id: string, status: Task['status']) => {
    updateTask(id, { status });
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
