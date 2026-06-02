import { db } from '../firebase';
import { collection, writeBatch, doc, query, where, limit, getDocs, getDoc, updateDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { validateBackupPayload } from './backupSchema';

export async function importDataToCloud(currentUser: User, importedData: Record<string, unknown>): Promise<boolean> {
  if (!importedData) {
    throw new Error("No data provided to import.");
  }

  try {
    const batch = writeBatch(db);
    const { collections, preferences } = validateBackupPayload(importedData);
    const localHabits = collections.nexus_habits;
    const localLogs = collections.nexus_logs;
    const localTasks = collections.nexus_tasks;
    const localNotes = collections.nexus_notes;
    const localFolders = collections.nexus_folders;

    const hasCollectionData = localHabits.length || localLogs.length || localTasks.length || localNotes.length || localFolders.length;

    // If there is no data to migrate at all, just return false
    if (!hasCollectionData && !preferences) {
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

    // Restore user preferences to the user profile doc (outside batch since it's a different pattern)
    if (preferences) {
      const userRef = doc(db, 'users', currentUser.uid);
      const prefsUpdate: Record<string, unknown> = {};
      if (preferences.operatorName) prefsUpdate.operatorName = preferences.operatorName;
      if (preferences.theme === 'dark' || preferences.theme === 'light') prefsUpdate.theme = preferences.theme;
      if (preferences.notesSortMode) prefsUpdate.notesSortMode = preferences.notesSortMode;
      if (preferences.notesViewMode) prefsUpdate.notesViewMode = preferences.notesViewMode;

      if (Object.keys(prefsUpdate).length > 0) {
        await updateDoc(userRef, prefsUpdate);
      }
    }

    return true;
  } catch (err) {
    console.error("Failed to import data to cloud:", err);
    throw err;
  }
}

export async function checkHasCloudData(currentUser: User): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', currentUser.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists() && userSnap.data().hasOnboarded) {
      return true;
    }

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
export async function purgeCloudData(currentUser: User): Promise<void> {
  const deleteFromCollection = async (collName: string): Promise<string[]> => {
    const q = query(collection(db, collName), where('userId', '==', currentUser.uid));
    const snap = await getDocs(q);
    return snap.docs.map(doc => `${collName}/${doc.id}`);
  };

  const results = await Promise.all([
    deleteFromCollection('habits'),
    deleteFromCollection('habit_logs'),
    deleteFromCollection('tasks'),
    deleteFromCollection('notes'),
    deleteFromCollection('folders')
  ]);

  const allPaths = results.flat();
  
  // Also reset the user profile flag so they see the onboarding modal again
  const userRef = doc(db, 'users', currentUser.uid);
  await updateDoc(userRef, { hasOnboarded: false, operatorName: 'OPERATOR' }).catch(() => {});

  if (allPaths.length === 0) return;

  // Chunk array into sizes of 500
  const chunkSize = 500;
  for (let i = 0; i < allPaths.length; i += chunkSize) {
    const chunk = allPaths.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach(path => {
      const parts = path.split('/');
      const ref = doc(db, parts[0], parts[1]);
      batch.delete(ref);
    });
    await batch.commit();
  }
}
