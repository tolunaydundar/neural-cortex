import { useState, useRef, useEffect } from 'react';
import { type Note, useNotes } from '../context/NoteContext';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface NoteCardProps {
  note: Note;
  onClick: (note: Note) => void;
}

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function NoteCard({ note, onClick }: NoteCardProps) {
  const { togglePin, duplicateNote, deleteNote, folders, moveToFolder } = useNotes();
  const [showMenu, setShowMenu] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const formattedDate = new Date(note.updated_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : (showMenu ? 50 : 0),
  };

  const words = wordCount(note.content);
  const snippet = note.content.length > 140
    ? note.content.substring(0, 140) + '…'
    : note.content;

  const folder = note.folder_id ? folders.find(f => f.id === note.folder_id) : null;

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowMoveMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
    setShowMoveMenu(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(note)}
      className={`glass-panel p-4 flex flex-col gap-2.5 cursor-pointer group hover:border-primary-fixed-dim/50 transition-all duration-300 relative note-color-${note.color}`}
    >
      {/* Header: title + menu */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-grow">
          {note.pinned && (
            <span className="material-symbols-outlined text-primary-fixed-dim text-[14px] flex-shrink-0" style={{fontVariationSettings: "'FILL' 1"}}>push_pin</span>
          )}
          <h3 className="font-headline-sm text-headline-sm text-primary-fixed-dim line-clamp-1 min-w-0">
            {note.title || 'Untitled Note'}
          </h3>
        </div>
        <button
          ref={btnRef}
          onClick={handleMenuClick}
          className="material-symbols-outlined text-lg text-on-surface-variant/30 group-hover:text-on-surface-variant transition-colors flex-shrink-0 cursor-pointer"
        >
          more_vert
        </button>
      </div>

      {/* Content snippet */}
      <p className="text-sm text-on-surface-variant/70 line-clamp-3 flex-grow whitespace-pre-wrap leading-relaxed">
        {snippet || <span className="italic opacity-50">Empty note</span>}
      </p>

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {note.tags.slice(0, 3).map(tag => (
            <span key={tag} className="note-tag-chip">{tag}</span>
          ))}
          {note.tags.length > 3 && (
            <span className="note-tag-chip">+{note.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/5">
        <div className="flex items-center gap-2">
          {folder && (
            <span className="flex items-center gap-1 font-label-caps text-[9px] text-on-surface-variant/60">
              <span className="material-symbols-outlined text-[11px]">{folder.icon}</span>
              {folder.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-label-caps text-[9px] text-on-surface-variant/40">{words}w</span>
          <span className="font-label-caps text-[9px] text-on-surface-variant/50 tracking-wider">
            {formattedDate}
          </span>
        </div>
      </div>

      {/* Context Menu */}
      {showMenu && (
        <div ref={menuRef} className="note-context-menu" style={{ top: '36px', right: '8px' }} onClick={e => e.stopPropagation()}>
          <button className="note-context-menu-item w-full" onClick={(e) => { e.stopPropagation(); togglePin(note.id); setShowMenu(false); }}>
            <span className="material-symbols-outlined text-[16px]">push_pin</span>
            {note.pinned ? 'Unpin' : 'Pin to Top'}
          </button>
          <button className="note-context-menu-item w-full" onClick={(e) => { e.stopPropagation(); duplicateNote(note.id); setShowMenu(false); }}>
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
            Duplicate
          </button>
          {folders.length > 0 && (
            <button className="note-context-menu-item w-full" onClick={(e) => { e.stopPropagation(); setShowMoveMenu(!showMoveMenu); }}>
              <span className="material-symbols-outlined text-[16px]">drive_file_move</span>
              Move to Folder
              <span className="material-symbols-outlined text-[12px] ml-auto">chevron_right</span>
            </button>
          )}
          {showMoveMenu && (
            <div className="px-2 pb-1">
              <button
                className="note-context-menu-item w-full text-[9px]"
                onClick={(e) => { e.stopPropagation(); moveToFolder(note.id, null); setShowMenu(false); }}
              >
                <span className="material-symbols-outlined text-[14px]">folder_off</span>
                No Folder
              </button>
              {folders.map(f => (
                <button
                  key={f.id}
                  className={`note-context-menu-item w-full text-[9px] ${note.folder_id === f.id ? 'text-primary-fixed-dim' : ''}`}
                  onClick={(e) => { e.stopPropagation(); moveToFolder(note.id, f.id); setShowMenu(false); }}
                >
                  <span className="material-symbols-outlined text-[14px]">{f.icon}</span>
                  {f.name}
                </button>
              ))}
            </div>
          )}
          <div className="note-context-menu-divider" />
          <button className="note-context-menu-item danger w-full" onClick={(e) => { e.stopPropagation(); deleteNote(note.id); setShowMenu(false); }}>
            <span className="material-symbols-outlined text-[16px]">delete</span>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
