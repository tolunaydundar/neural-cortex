import { db } from '../firebase';
import { collection, writeBatch, doc, query, where, limit, getDocs } from 'firebase/firestore';
import type { User } from 'firebase/auth';

export async function importDataToCloud(currentUser: User, importedData: Record<string, string>): Promise<boolean> {
  if (!importedData) {
    throw new Error("No data provided to import.");
  }

  try {
    const batch = writeBatch(db);
    
    const parse = (key: 'nexus_habits' | 'nexus_logs' | 'nexus_tasks' | 'nexus_notes' | 'nexus_folders') => {
      let val: string | undefined;
      switch (key) {
        case 'nexus_habits': val = importedData.nexus_habits; break;
        case 'nexus_logs': val = importedData.nexus_logs; break;
        case 'nexus_tasks': val = importedData.nexus_tasks; break;
        case 'nexus_notes': val = importedData.nexus_notes; break;
        case 'nexus_folders': val = importedData.nexus_folders; break;
      }
      if (val) return JSON.parse(val);
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
    
    localHabits.forEach((habit: Record<string, unknown>) => {
      const ref = doc(db, 'habits', habit.id as string);
      batch.set(ref, { ...habit, userId: currentUser.uid });
    });

    localLogs.forEach((log: Record<string, unknown>) => {
      const ref = doc(db, 'habit_logs', log.id as string);
      batch.set(ref, { ...log, userId: currentUser.uid });
    });

    localTasks.forEach((task: Record<string, unknown>) => {
      const ref = doc(db, 'tasks', task.id as string);
      batch.set(ref, { ...task, userId: currentUser.uid });
    });

    localNotes.forEach((note: Record<string, unknown>) => {
      const ref = doc(db, 'notes', note.id as string);
      batch.set(ref, { ...note, userId: currentUser.uid });
    });

    localFolders.forEach((folder: Record<string, unknown>) => {
      const ref = doc(db, 'folders', folder.id as string);
      batch.set(ref, { ...folder, userId: currentUser.uid });
    });

    await batch.commit();
    return true;
  } catch (err) {
    console.error("Failed to import data to cloud:", err);
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
