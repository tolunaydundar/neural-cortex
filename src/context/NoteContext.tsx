import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { 
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where 
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

export type NoteColor = 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folder_id: string | null;
  color: NoteColor;
  pinned: boolean;
  created_at: string;
  updated_at: string;
  userId: string;
}

export interface Folder {
  id: string;
  name: string;
  icon: string;
  created_at: string;
  userId: string;
}

interface NoteContextType {
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'created_at' | 'updated_at' | 'userId'>) => Promise<void>;
  updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'created_at' | 'userId'>>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  duplicateNote: (id: string) => Promise<void>;
  moveToFolder: (noteId: string, folderId: string | null) => Promise<void>;
  
  folders: Folder[];
  addFolder: (name: string, icon: string) => Promise<string>;
  updateFolder: (id: string, updates: Partial<Omit<Folder, 'id' | 'created_at' | 'userId'>>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  getAllTags: () => string[];
  getNotesByFolder: (folderId: string | null) => Note[];
  getNotesCount: () => number;
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

export const NoteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);

  useEffect(() => {
    if (!currentUser) {
      setNotes([]);
      setFolders([]);
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
      // Sort in memory since we didn't create a composite index for orderBy yet
      fetchedNotes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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

  const addNote = async (note: Omit<Note, 'id' | 'created_at' | 'updated_at' | 'userId'>) => {
    if (!currentUser) return;
    const now = new Date().toISOString();
    await addDoc(collection(db, 'notes'), {
      ...note,
      userId: currentUser.uid,
      created_at: now,
      updated_at: now,
    });
  };

  const updateNote = async (id: string, updates: Partial<Omit<Note, 'id' | 'created_at' | 'userId'>>) => {
    const noteRef = doc(db, 'notes', id);
    await updateDoc(noteRef, { ...updates, updated_at: new Date().toISOString() });
  };

  const deleteNote = async (id: string) => {
    await deleteDoc(doc(db, 'notes', id));
  };

  const togglePin = async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    await updateDoc(doc(db, 'notes', id), { 
      pinned: !note.pinned, 
      updated_at: new Date().toISOString() 
    });
  };

  const duplicateNote = async (id: string) => {
    const original = notes.find(n => n.id === id);
    if (!original || !currentUser) return;
    const now = new Date().toISOString();
    const { id: _, ...originalData } = original;
    
    await addDoc(collection(db, 'notes'), {
      ...originalData,
      title: `${original.title} (Copy)`,
      pinned: false,
      created_at: now,
      updated_at: now,
    });
  };

  const moveToFolder = async (noteId: string, folderId: string | null) => {
    await updateNote(noteId, { folder_id: folderId });
  };

  // ── Folder CRUD ──

  const addFolder = async (name: string, icon: string): Promise<string> => {
    if (!currentUser) return '';
    const newFolder = {
      name,
      icon: icon || 'folder',
      userId: currentUser.uid,
      created_at: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, 'folders'), newFolder);
    return docRef.id;
  };

  const updateFolder = async (id: string, updates: Partial<Omit<Folder, 'id' | 'created_at' | 'userId'>>) => {
    await updateDoc(doc(db, 'folders', id), updates);
  };

  const deleteFolder = async (id: string) => {
    await deleteDoc(doc(db, 'folders', id));
    // Move orphaned notes to uncategorized
    const orphanedNotes = notes.filter(n => n.folder_id === id);
    for (const note of orphanedNotes) {
      await updateDoc(doc(db, 'notes', note.id), { folder_id: null });
    }
  };

  // ── Derived ──

  const getAllTags = useCallback((): string[] => {
    const tagSet = new Set<string>();
    notes.forEach(n => n.tags?.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [notes]);

  const getNotesByFolder = useCallback((folderId: string | null): Note[] => {
    return notes.filter(n => n.folder_id === folderId);
  }, [notes]);

  const getNotesCount = useCallback((): number => notes.length, [notes]);

  return (
    <NoteContext.Provider value={{
      notes, addNote, updateNote, deleteNote, togglePin, duplicateNote, moveToFolder,
      folders, addFolder, updateFolder, deleteFolder,
      getAllTags, getNotesByFolder, getNotesCount,
    }}>
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
