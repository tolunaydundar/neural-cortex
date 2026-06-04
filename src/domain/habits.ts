export interface Habit {
  id: string;
  title: string;
  description?: string;
  icon: string;
  created_at: string;
  userId: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  userId: string;
}

export function sortHabitsByCreatedAt(habits: Habit[]): Habit[] {
  return [...habits].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}
