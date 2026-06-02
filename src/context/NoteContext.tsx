/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../firebase';
import { 
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where, writeBatch 
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useSync } from './SyncContext';
import { assertOwnedDocument } from '../utils/firestoreOwnership';
import { getAllNoteTags, getNoteOrder, type Folder, type Note } from '../domain/notes';

export type { Folder, Note, NoteColor } from '../domain/notes';

interface NoteContextType {
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'created_at' | 'updated_at' | 'userId'>) => Promise<string>;
  updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'created_at' | 'userId'>>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  duplicateNote: (id: string) => Promise<void>;
  moveToFolder: (noteId: string, folderId: string | null) => Promise<void>;
  
  folders: Folder[];
  addFolder: (name: string, icon: string, parent_id?: string | null) => Promise<string>;
  updateFolder: (id: string, updates: Partial<Omit<Folder, 'id' | 'created_at' | 'userId'>>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  getAllTags: () => string[];
  getNotesByFolder: (folderId: string | null) => Note[];
  getNotesCount: () => number;
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

export const NoteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { runSync } = useSync();
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);

  useEffect(() => {
    if (!currentUser) {
      setTimeout(() => {
        setNotes([]);
        setFolders([]);
      }, 0);
      return;
    }

    // Subscribe to notes
    const notesQuery = query(
      collection(db, 'notes'), 
      where('userId', '==', currentUser.uid)
    );
    const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
      const fetchedNotes: Note[] = [];
      snapshot.forEach((doc) => {
        fetchedNotes.push({ id: doc.id, ...doc.data() } as Note);
      });
      // Sort in memory using order field (fallback to created_at)
      fetchedNotes.sort((a, b) => {
        return getNoteOrder(b) - getNoteOrder(a);
      });
      setNotes(fetchedNotes);
    });

    // Subscribe to folders
    const foldersQuery = query(
      collection(db, 'folders'),
      where('userId', '==', currentUser.uid)
    );
    const unsubscribeFolders = onSnapshot(foldersQuery, (snapshot) => {
      const fetchedFolders: Folder[] = [];
      snapshot.forEach((doc) => {
        fetchedFolders.push({ id: doc.id, ...doc.data() } as Folder);
      });
      setFolders(fetchedFolders);
    });

    return () => {
      unsubscribeNotes();
      unsubscribeFolders();
    };
  }, [currentUser]);

  // ── Note CRUD ──

  const addNote = useCallback((note: Omit<Note, 'id' | 'created_at' | 'updated_at' | 'userId'>): Promise<string> => runSync(async () => {
    if (!currentUser) return '';
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, 'notes'), {
      ...note,
      order: Date.now(),
      userId: currentUser.uid,
      created_at: now,
      updated_at: now,
    });
    return docRef.id;
  }), [currentUser, runSync]);

  const updateNote = useCallback((id: string, updates: Partial<Omit<Note, 'id' | 'created_at' | 'userId'>>) => runSync(async () => {
    if (!currentUser) return;
    await assertOwnedDocument('notes', id, currentUser.uid);
    const noteRef = doc(db, 'notes', id);
    await updateDoc(noteRef, { ...updates, updated_at: new Date().toISOString() });
  }), [currentUser, runSync]);

  const deleteNote = useCallback((id: string) => runSync(async () => {
    if (!currentUser) return;
    await assertOwnedDocument('notes', id, currentUser.uid);
    await deleteDoc(doc(db, 'notes', id));
  }), [currentUser, runSync]);

  const togglePin = useCallback((id: string) => runSync(async () => {
    if (!currentUser) return;
    await assertOwnedDocument('notes', id, currentUser.uid);
    const note = notes.find(n => n.id === id);
    if (!note) return;
    await updateDoc(doc(db, 'notes', id), { 
      pinned: !note.pinned, 
      updated_at: new Date().toISOString() 
    });
  }), [currentUser, notes, runSync]);

  const duplicateNote = useCallback((id: string) => runSync(async () => {
    const original = notes.find(n => n.id === id);
    if (!original || !currentUser) return;
    await assertOwnedDocument('notes', id, currentUser.uid);
    const now = new Date().toISOString();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, ...originalData } = original;
    
    await addDoc(collection(db, 'notes'), {
      ...originalData,
      title: `${original.title} (Copy)`,
      pinned: false,
      order: Date.now(),
      created_at: now,
      updated_at: now,
    });
  }), [currentUser, notes, runSync]);

  const moveToFolder = useCallback((noteId: string, folderId: string | null) => runSync(async () => {
    await updateNote(noteId, { folder_id: folderId });
  }), [runSync, updateNote]);

  // ── Folder CRUD ──

  const addFolder = useCallback((name: string, icon: string, parent_id: string | null = null): Promise<string> => runSync(async () => {
    if (!currentUser) return '';
    const newFolder = {
      name,
      icon: icon || 'folder',
      parent_id,
      userId: currentUser.uid,
      created_at: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, 'folders'), newFolder);
    return docRef.id;
  }), [currentUser, runSync]);

  const updateFolder = useCallback((id: string, updates: Partial<Omit<Folder, 'id' | 'created_at' | 'userId'>>) => runSync(async () => {
    if (!currentUser) return;
    await assertOwnedDocument('folders', id, currentUser.uid);
    await updateDoc(doc(db, 'folders', id), updates);
  }), [currentUser, runSync]);

  const deleteFolder = useCallback((id: string) => runSync(async () => {
    if (!currentUser) return;
    await assertOwnedDocument('folders', id, currentUser.uid);
    const batch = writeBatch(db);
    batch.delete(doc(db, 'folders', id));
    const orphanedNotes = notes.filter(n => n.folder_id === id);
    for (const note of orphanedNotes) {
      batch.update(doc(db, 'notes', note.id), { folder_id: null, updated_at: new Date().toISOString() });
    }
    await batch.commit();
  }), [currentUser, notes, runSync]);

  // ── Derived ──

  const getAllTags = useCallback((): string[] => {
    return getAllNoteTags(notes);
  }, [notes]);

  const getNotesByFolder = useCallback((folderId: string | null): Note[] => {
    return notes.filter(n => n.folder_id === folderId);
  }, [notes]);

  const getNotesCount = useCallback((): number => notes.length, [notes]);

  const value = useMemo(() => ({
    notes, folders, addNote, updateNote, deleteNote, duplicateNote, togglePin,
    addFolder, updateFolder, deleteFolder, moveToFolder,
    getAllTags, getNotesByFolder, getNotesCount,
  }), [notes, folders, addNote, updateNote, deleteNote, duplicateNote, togglePin, addFolder, updateFolder, deleteFolder, moveToFolder, getAllTags, getNotesByFolder, getNotesCount]);

  return (
    <NoteContext.Provider value={value}>
      {children}
    </NoteContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NoteContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NoteProvider');
  }
  return context;
};
