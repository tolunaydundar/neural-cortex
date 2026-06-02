export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: string;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
  subtasks: Subtask[];
  userId: string;
  order?: number;
}

export function getPriorityValue(priority: TaskPriority): number {
  switch (priority) {
    case 'critical': return 0;
    case 'high': return 1;
    case 'medium': return 2;
    case 'low': return 3;
  }
}

export function getTaskOrder(task: Pick<Task, 'order' | 'created_at'>): number {
  return task.order ?? new Date(task.created_at).getTime();
}

export function sortTasksByOrder(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}
