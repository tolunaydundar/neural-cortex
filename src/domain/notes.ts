export type NoteColor = 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple';
export type NotesSortMode = 'updated' | 'created' | 'alpha' | 'custom';
export type NotesViewMode = 'grid' | 'list' | 'table';
export type NotesEditorMode = 'full' | 'modal';

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folder_id: string | null;
  parent_id?: string | null;
  cover_image?: string | null;
  icon?: string | null;
  format?: 'markdown' | 'html';
  color: NoteColor;
  pinned: boolean;
  order?: number;
  created_at: string;
  updated_at: string;
  userId: string;
  is_deleted?: boolean;
}

export interface Folder {
  id: string;
  name: string;
  icon: string;
  parent_id?: string | null;
  created_at: string;
  userId: string;
  is_deleted?: boolean;
}

export function getNoteOrder(note: Pick<Note, 'order' | 'created_at'>): number {
  return note.order ?? new Date(note.created_at).getTime();
}

export function sortNotes(notes: Note[], mode: NotesSortMode): Note[] {
  return [...notes].sort((a, b) => {
    if (mode === 'updated') return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    if (mode === 'created') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (mode === 'alpha') return a.title.localeCompare(b.title);
    return getNoteOrder(b) - getNoteOrder(a);
  });
}

export function getAllNoteTags(notes: Note[]): string[] {
  const tagSet = new Set<string>();
  notes.forEach(note => note.tags?.forEach(tag => tagSet.add(tag)));
  return Array.from(tagSet).sort();
}
