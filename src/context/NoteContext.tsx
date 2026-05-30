import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ═══════════════════════════════════════════════════════
//  Types
// ═══════════════════════════════════════════════════════

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
}

export interface Folder {
  id: string;
  name: string;
  icon: string;
  created_at: string;
}

interface NoteContextType {
  // Notes
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => void;
  updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'created_at'>>) => void;
  deleteNote: (id: string) => void;
  togglePin: (id: string) => void;
  duplicateNote: (id: string) => void;
  moveToFolder: (noteId: string, folderId: string | null) => void;
  reorderNotes: (activeId: string, overId: string) => void;

  // Folders
  folders: Folder[];
  addFolder: (name: string, icon: string) => string;
  updateFolder: (id: string, updates: Partial<Omit<Folder, 'id' | 'created_at'>>) => void;
  deleteFolder: (id: string) => void;

  // Derived
  getAllTags: () => string[];
  getNotesByFolder: (folderId: string | null) => Note[];
  getNotesCount: () => number;
}

const NoteContext = createContext<NoteContextType | undefined>(undefined);

// ═══════════════════════════════════════════════════════
//  Data Migration — handle legacy notes with `category`
// ═══════════════════════════════════════════════════════

interface LegacyNote {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  folder_id?: string | null;
  color?: NoteColor;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

function migrateNotes(raw: LegacyNote[]): Note[] {
  return raw.map(n => ({
    id: n.id,
    title: n.title,
    content: n.content,
    tags: n.tags ?? (n.category ? [n.category] : []),
    folder_id: n.folder_id ?? null,
    color: n.color ?? 'default',
    pinned: n.pinned,
    created_at: n.created_at,
    updated_at: n.updated_at,
  }));
}

// ═══════════════════════════════════════════════════════
//  Provider
// ═══════════════════════════════════════════════════════

export const NoteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('nexus_notes');
    if (!saved) return [];
    try {
      return migrateNotes(JSON.parse(saved));
    } catch {
      return [];
    }
  });

  const [folders, setFolders] = useState<Folder[]>(() => {
    const saved = localStorage.getItem('nexus_folders');
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('nexus_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('nexus_folders', JSON.stringify(folders));
  }, [folders]);

  // ── Note CRUD ──

  const addNote = (note: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newNote: Note = {
      ...note,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };
    setNotes(prev => [newNote, ...prev]);
  };

  const updateNote = (id: string, updates: Partial<Omit<Note, 'id' | 'created_at'>>) => {
    setNotes(prev => prev.map(n => {
      if (n.id !== id) return n;
      return { ...n, ...updates, updated_at: new Date().toISOString() };
    }));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const togglePin = (id: string) => {
    setNotes(prev => prev.map(n => {
      if (n.id !== id) return n;
      return { ...n, pinned: !n.pinned, updated_at: new Date().toISOString() };
    }));
  };

  const duplicateNote = (id: string) => {
    const original = notes.find(n => n.id === id);
    if (!original) return;
    const now = new Date().toISOString();
    const copy: Note = {
      ...original,
      id: crypto.randomUUID(),
      title: `${original.title} (Copy)`,
      pinned: false,
      created_at: now,
      updated_at: now,
    };
    setNotes(prev => [copy, ...prev]);
  };

  const moveToFolder = (noteId: string, folderId: string | null) => {
    updateNote(noteId, { folder_id: folderId });
  };

  const reorderNotes = (activeId: string, overId: string) => {
    setNotes(prev => {
      const oldIndex = prev.findIndex(n => n.id === activeId);
      const newIndex = prev.findIndex(n => n.id === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newNotes = [...prev];
        const [removed] = newNotes.splice(oldIndex, 1);
        newNotes.splice(newIndex, 0, removed);
        return newNotes;
      }
      return prev;
    });
  };

  // ── Folder CRUD ──

  const addFolder = (name: string, icon: string) => {
    const newFolder: Folder = {
      id: crypto.randomUUID(),
      name,
      icon: icon || 'folder',
      created_at: new Date().toISOString(),
    };
    setFolders(prev => [...prev, newFolder]);
    return newFolder.id;
  };

  const updateFolder = (id: string, updates: Partial<Omit<Folder, 'id' | 'created_at'>>) => {
    setFolders(prev => prev.map(f => {
      if (f.id !== id) return f;
      return { ...f, ...updates };
    }));
  };

  const deleteFolder = (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    // Move orphaned notes to uncategorized
    setNotes(prev => prev.map(n =>
      n.folder_id === id ? { ...n, folder_id: null } : n
    ));
  };

  // ── Derived ──

  const getAllTags = useCallback((): string[] => {
    const tagSet = new Set<string>();
    notes.forEach(n => n.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [notes]);

  const getNotesByFolder = useCallback((folderId: string | null): Note[] => {
    return notes.filter(n => n.folder_id === folderId);
  }, [notes]);

  const getNotesCount = useCallback((): number => notes.length, [notes]);

  return (
    <NoteContext.Provider value={{
      notes, addNote, updateNote, deleteNote, togglePin, duplicateNote, moveToFolder, reorderNotes,
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
