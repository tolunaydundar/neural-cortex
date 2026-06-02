import { useState, useRef, useEffect } from 'react';
import { type Note, useNotes } from '../context/NoteContext';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';

interface NoteCardProps {
  note: Note;
  onClick: (note: Note) => void;
}

function stripHtmlAndWordCount(text: string) {
  let plainText = '';
  if (typeof window !== 'undefined' && window.DOMParser) {
    const doc = new DOMParser().parseFromString(text, 'text/html');
    plainText = doc.body.textContent || '';
  } else {
    plainText = text.replace(/<[^>]*>?/gm, '');
  }
  const words = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
  return { plainText, words };
}

export default function NoteCard({ note, onClick }: NoteCardProps) {
  const { togglePin, duplicateNote, deleteNote, folders, moveToFolder } = useNotes();
  const { t } = useTranslation();
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

  const { plainText, words } = stripHtmlAndWordCount(note.content);
  const snippetText = plainText.length > 140
    ? plainText.substring(0, 140) + '…'
    : plainText;

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
      className={`bg-surface-container hover:bg-surface-container-high rounded-xl flex flex-col cursor-pointer group transition-all duration-300 relative note-color-${note.color} overflow-hidden shadow-sm hover:shadow-md border border-on-surface/10 hover:border-on-surface/20`}
    >
      {note.cover_image && (
        <div className="w-full h-32 overflow-hidden border-b border-on-surface/10">
          <img src={note.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      
      <div className="p-4 flex flex-col gap-3 flex-grow">
        {/* Header: title + menu */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-start gap-2 min-w-0 flex-grow pt-1">
            {note.pinned && (
              <span className="material-symbols-outlined text-primary-fixed-dim text-[16px] flex-shrink-0 mt-0.5" style={{fontVariationSettings: "'FILL' 1"}}>push_pin</span>
            )}
            {note.icon && (
              <span className="text-[18px] flex-shrink-0 leading-none">{note.icon}</span>
            )}
            <h3 className="font-headline-sm text-[16px] text-on-surface line-clamp-2 min-w-0 font-bold group-hover:text-primary-fixed-dim transition-colors leading-tight">
              {note.title || 'Untitled Note'}
            </h3>
          </div>
          <button
            ref={btnRef}
            onClick={handleMenuClick}
            className="material-symbols-outlined text-[18px] text-on-surface-variant/60 hover:bg-on-surface/5 rounded p-0.5 group-hover:text-on-surface-variant transition-colors flex-shrink-0 cursor-pointer"
          >
            more_vert
          </button>
        </div>

        {/* Content snippet */}
        {snippetText ? (
          <p className="text-[13px] text-on-surface-variant/70 line-clamp-3 flex-grow whitespace-pre-wrap leading-relaxed">
            {snippetText}
          </p>
        ) : (
          <p className="text-[13px] text-on-surface-variant/70 italic line-clamp-3 flex-grow leading-relaxed">
            {t('notes.empty_note')}
          </p>
        )}

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {note.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded bg-on-surface/5 text-[10px] font-label-caps text-on-surface-variant/80 tracking-wide">#{tag}</span>
            ))}
            {note.tags.length > 3 && (
              <span className="px-2 py-0.5 rounded bg-on-surface/5 text-[10px] font-label-caps text-on-surface-variant/80 tracking-wide">+{note.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-2 pt-3 border-t border-on-surface/10">
          <div className="flex items-center gap-2">
            {folder && (
              <span className="flex items-center gap-1 font-label-caps text-[9px] text-on-surface-variant/60 tracking-wider">
                <span className="material-symbols-outlined text-[12px]">{folder.icon}</span>
                {folder.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-label-caps text-[9px] text-on-surface-variant/70 tracking-wider">{words}W</span>
            <span className="font-label-caps text-[9px] text-on-surface-variant/80 tracking-wider">
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {showMenu && (
        <div ref={menuRef} className="absolute z-50 bg-surface-container-highest border border-on-surface/20 rounded-lg shadow-xl p-1 min-w-[160px] flex flex-col gap-1" style={{ top: '40px', right: '12px' }} onClick={e => e.stopPropagation()}>
          <button className="flex items-center gap-2 px-3 py-2 hover:bg-on-surface/5 rounded text-sm text-on-surface-variant transition-colors text-left" onClick={(e) => { e.stopPropagation(); togglePin(note.id); setShowMenu(false); }}>
            <span className="material-symbols-outlined text-[16px]">{note.pinned ? 'push_pin' : 'keep'}</span>
            {note.pinned ? 'Unpin' : 'Pin to Top'}
          </button>
          <button className="flex items-center gap-2 px-3 py-2 hover:bg-on-surface/5 rounded text-sm text-on-surface-variant transition-colors text-left" onClick={(e) => { e.stopPropagation(); duplicateNote(note.id); setShowMenu(false); }}>
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
            Duplicate
          </button>
          {folders.length > 0 && (
            <button className="flex items-center gap-2 px-3 py-2 hover:bg-on-surface/5 rounded text-sm text-on-surface-variant transition-colors text-left" onClick={(e) => { e.stopPropagation(); setShowMoveMenu(!showMoveMenu); }}>
              <span className="material-symbols-outlined text-[16px]">folder_move</span>
              Move to Folder
              <span className="material-symbols-outlined text-[14px] ml-auto">chevron_right</span>
            </button>
          )}
          {showMoveMenu && (
            <div className="pl-6 pr-2 py-1 flex flex-col gap-1 border-l-2 border-on-surface/10 ml-4 mt-1">
              <button
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-on-surface/5 rounded text-xs text-on-surface-variant transition-colors text-left"
                onClick={(e) => { e.stopPropagation(); moveToFolder(note.id, null); setShowMenu(false); }}
              >
                <span className="material-symbols-outlined text-[14px]">folder_off</span>
                No Folder
              </button>
              {folders.map(f => (
                <button
                  key={f.id}
                  className={`flex items-center gap-2 px-2 py-1.5 hover:bg-on-surface/5 rounded text-xs transition-colors text-left ${note.folder_id === f.id ? 'text-primary-fixed-dim font-bold' : 'text-on-surface-variant'}`}
                  onClick={(e) => { e.stopPropagation(); moveToFolder(note.id, f.id); setShowMenu(false); }}
                >
                  <span className="material-symbols-outlined text-[14px]">{f.icon}</span>
                  {f.name}
                </button>
              ))}
            </div>
          )}
          <div className="w-full h-px bg-on-surface/10 my-1" />
          <button className="flex items-center gap-2 px-3 py-2 hover:bg-error/20 hover:text-error rounded text-sm text-on-surface-variant transition-colors text-left" onClick={(e) => { e.stopPropagation(); deleteNote(note.id); setShowMenu(false); }}>
            <span className="material-symbols-outlined text-[16px]">delete</span>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
