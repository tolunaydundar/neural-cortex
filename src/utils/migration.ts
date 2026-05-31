import { db } from '../firebase';
import { collection, writeBatch, doc, query, where, limit, getDocs } from 'firebase/firestore';
import type { User } from 'firebase/auth';

export async function migrateDataToCloud(currentUser: User, importedData?: any): Promise<boolean> {
  try {
    const batch = writeBatch(db);
    
    // Use importedData if provided, otherwise fallback to localStorage
    const parse = (key: string) => {
      if (importedData && importedData[key]) return JSON.parse(importedData[key]);
      if (!importedData) return JSON.parse(localStorage.getItem(key) || '[]');
      return [];
    };

    const localHabits = parse('nexus_habits');
    const localLogs = parse('nexus_logs');
    const localTasks = parse('nexus_tasks');
    const localNotes = parse('nexus_notes');
    const localFolders = parse('nexus_folders');
    
    // If there is no data to migrate, just return false
    if (!localHabits.length && !localLogs.length && !localTasks.length && !localNotes.length && !localFolders.length) {
      return false;
    }
    
    localHabits.forEach((habit: any) => {
      const ref = doc(db, 'habits', habit.id);
      batch.set(ref, { ...habit, userId: currentUser.uid });
    });

    localLogs.forEach((log: any) => {
      const ref = doc(db, 'habit_logs', log.id);
      batch.set(ref, { ...log, userId: currentUser.uid });
    });

    localTasks.forEach((task: any) => {
      const ref = doc(db, 'tasks', task.id);
      batch.set(ref, { ...task, userId: currentUser.uid });
    });

    localNotes.forEach((note: any) => {
      const ref = doc(db, 'notes', note.id);
      batch.set(ref, { ...note, userId: currentUser.uid });
    });

    localFolders.forEach((folder: any) => {
      const ref = doc(db, 'folders', folder.id);
      batch.set(ref, { ...folder, userId: currentUser.uid });
    });

    await batch.commit();

    // Always clear localStorage after a successful cloud migration (whether from import or local auto-migration)
    localStorage.removeItem('nexus_habits');
    localStorage.removeItem('nexus_logs');
    localStorage.removeItem('nexus_tasks');
    localStorage.removeItem('nexus_notes');
    localStorage.removeItem('nexus_folders');
    
    return true;
  } catch (err) {
    console.error("Failed to migrate data to cloud:", err);
    throw err;
  }
}

export async function checkHasCloudData(currentUser: User): Promise<boolean> {
  try {
    const tasksRef = collection(db, 'tasks');
    const qTasks = query(tasksRef, where('userId', '==', currentUser.uid), limit(1));
    const tasksSnap = await getDocs(qTasks);
    
    if (!tasksSnap.empty) return true;

    const habitsRef = collection(db, 'habits');
    const qHabits = query(habitsRef, where('userId', '==', currentUser.uid), limit(1));
    const habitsSnap = await getDocs(qHabits);
    if (!habitsSnap.empty) return true;

    const notesRef = collection(db, 'notes');
    const qNotes = query(notesRef, where('userId', '==', currentUser.uid), limit(1));
    const notesSnap = await getDocs(qNotes);

    return !notesSnap.empty;
  } catch (err) {
    console.error("Failed to check cloud data:", err);
    return false;
  }
}

export function checkHasLocalData(): boolean {
  const localHabits = JSON.parse(localStorage.getItem('nexus_habits') || '[]');
  const localTasks = JSON.parse(localStorage.getItem('nexus_tasks') || '[]');
  const localNotes = JSON.parse(localStorage.getItem('nexus_notes') || '[]');
  return localHabits.length > 0 || localTasks.length > 0 || localNotes.length > 0;
}
