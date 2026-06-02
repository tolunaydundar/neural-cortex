import { useState, useEffect, useRef, useCallback } from 'react';
import { useNotes, type Note, type NoteColor } from '../context/NoteContext';
import ConfirmModal from './ConfirmModal';
import FolderEditorModal from './FolderEditorModal';
import { useFocusTrap } from '../utils/useFocusTrap';
import TipTapEditor from './TipTapEditor';
import { useNavigate } from 'react-router-dom';

interface NoteEditorModalProps {
  initialNote?: Note | null;
  onClose: () => void;
}

const COLORS: NoteColor[] = ['default', 'red', 'orange', 'yellow', 'green', 'blue', 'purple'];

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function NoteEditorModal({ initialNote, onClose }: NoteEditorModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const titleId = 'note-editor-title';
  const { addNote, updateNote, deleteNote, duplicateNote, folders } = useNotes();
  const [title, setTitle] = useState(initialNote?.title || '');
  const [content, setContent] = useState(initialNote?.content || '');
  const [tags, setTags] = useState<string[]>(initialNote?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [folderId, setFolderId] = useState<string | null>(initialNote?.folder_id ?? null);
  const [color, setColor] = useState<NoteColor>(initialNote?.color || 'default');
  const [pinned, setPinned] = useState(initialNote?.pinned || false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);

  useFocusTrap(modalRef);

  // Focus textarea on open for new notes (handled by TipTap if needed, or we just rely on its autofocus)
  useEffect(() => {
    // Focus can be handled by TipTap autofocus if desired
  }, [initialNote]);

  const hasChanges =
    title !== (initialNote?.title || '') ||
    content !== (initialNote?.content || '') ||
    JSON.stringify(tags) !== JSON.stringify(initialNote?.tags || []) ||
    folderId !== (initialNote?.folder_id ?? null) ||
    color !== (initialNote?.color || 'default') ||
    pinned !== (initialNote?.pinned || false);
  const handleAttemptClose = useCallback(() => {
    if (hasChanges) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  }, [hasChanges, onClose]);

  // Escape — with unsaved changes warning
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleAttemptClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleAttemptClose]);

  const handleSave = useCallback(() => {
    if (initialNote) {
      updateNote(initialNote.id, {
        title: title.trim(),
        content,
        tags,
        folder_id: folderId,
        color,
        pinned,
      });
    } else {
      if (title.trim() || content.trim()) {
        addNote({
          title: title.trim(),
          content,
          tags,
          folder_id: folderId,
          color,
          pinned,
        });
      }
    }
    onClose();
  }, [initialNote, title, content, tags, folderId, color, pinned, updateNote, addNote, onClose]);

  // Ctrl+S save shortcut
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleSave]);

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags(prev => [...prev, tag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tag = tagInput.trim();
      if (tag && !tags.includes(tag)) {
        setTags(prev => [...prev, tag]);
      }
      setTagInput('');
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(prev => prev.slice(0, -1));
    }
  };

  const words = wordCount(content.replace(/(<([^>]+)>)/gi, ""));
  const chars = content.replace(/(<([^>]+)>)/gi, "").length;

  const handleOpenFullpage = () => {
    // Save current changes to the note if any before navigating
    // Or we could just discard and navigate. Let's auto-save if it has changes and we have an ID, or create it.
    handleSave();
    if (initialNote) {
      navigate(`/notes/${initialNote.id}`);
    } else {
      // In a real app we'd need the new ID, but handleSave just adds it.
      // We can just navigate to /notes/new with some state, but for now navigate there.
      navigate('/notes/new');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 lg:p-8" onClick={handleAttemptClose}>
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={`glass-panel p-6 lg:p-8 w-full max-w-5xl h-full lg:h-auto lg:max-h-[90vh] flex flex-col relative rounded-lg border-primary-fixed-dim/30 overflow-hidden note-color-${color}`}
          onClick={e => e.stopPropagation()}
        >
          <h2 id={titleId} className="sr-only">Note editor</h2>
          {/* Header: Title + Actions */}
          <div className="flex items-center justify-between mb-3 flex-shrink-0 gap-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note Title"
              className="font-headline-md text-headline-sm text-primary-fixed-dim bg-transparent border-none outline-none w-full flex-grow placeholder:text-primary-fixed-dim/30"
            />
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPinned(!pinned)}
                className={`material-symbols-outlined text-xl transition-colors cursor-pointer p-2 ${
                  pinned ? 'text-primary-fixed-dim' : 'text-on-surface-variant/30 hover:text-on-surface-variant'
                }`}
                style={pinned ? {fontVariationSettings: "'FILL' 1"} : undefined}
                title={pinned ? "Unpin" : "Pin"}
              >
                push_pin
              </button>
              <button
                onClick={handleAttemptClose}
                className="text-on-surface-variant hover:text-primary-fixed-dim transition-colors cursor-pointer p-2"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          {/* Timestamps */}
          <div className="font-label-caps text-[10px] text-on-surface-variant/60 mb-4 flex-shrink-0 flex items-center gap-4">
            {initialNote && (
              <>
                <span>CREATED {new Date(initialNote.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>UPDATED {new Date(initialNote.updated_at).toLocaleString()}</span>
              </>
            )}
          </div>

          {/* Metadata row: Folder + Color */}
          <div className="flex flex-wrap items-center gap-4 mb-4 flex-shrink-0">
            {/* Folder selector */}
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-on-surface-variant">folder</span>
              <select
                value={folderId || ''}
                onChange={(e) => setFolderId(e.target.value || null)}
                className="bg-surface-container-lowest border border-white/10 px-2 py-1.5 font-label-caps text-[10px] text-on-surface-variant focus:outline-none focus:border-primary-fixed-dim cursor-pointer rounded-sm"
              >
                <option value="">No Folder</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <button
                onClick={() => setShowNewFolderModal(true)}
                className="material-symbols-outlined text-[16px] text-on-surface-variant/50 hover:text-primary-fixed-dim transition-colors cursor-pointer"
                title="New Folder"
              >
                add_circle
              </button>
            </div>

            {/* Color picker */}
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-on-surface-variant">palette</span>
              <div className="flex items-center gap-1.5">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`note-color-dot note-color-dot-${c} ${color === c ? 'selected' : ''}`}
                    title={c.charAt(0).toUpperCase() + c.slice(1)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mb-4 flex-shrink-0">
            <span className="material-symbols-outlined text-sm text-on-surface-variant mr-1">sell</span>
            {tags.map(tag => (
              <span key={tag} className="note-tag-chip">
                {tag}
                <button onClick={() => handleRemoveTag(tag)} className="remove-tag ml-1">×</button>
              </span>
            ))}
            <form onSubmit={handleAddTag} className="inline-flex">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={tags.length === 0 ? "Add tags..." : "+"}
                className="bg-transparent border-none outline-none font-label-caps text-[10px] text-on-surface-variant w-20 placeholder:text-on-surface-variant/30"
              />
            </form>
          </div>

          {/* Content area */}
          <div className="flex-grow flex flex-col min-h-0 relative mb-4">
            <TipTapEditor 
              content={content} 
              onChange={setContent} 
              placeholder="Start typing your note here (Markdown supported)..."
            />
          </div>

          {/* Footer: Stats + Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/5 flex-shrink-0">
            {/* Writing stats */}
            <div className="flex items-center gap-3 mr-auto">
              <span className="font-label-caps text-[9px] text-on-surface-variant/50">
                {words} {words === 1 ? 'WORD' : 'WORDS'}
              </span>
              <span className="font-label-caps text-[9px] text-on-surface-variant/30">•</span>
              <span className="font-label-caps text-[9px] text-on-surface-variant/50">
                {chars} {chars === 1 ? 'CHAR' : 'CHARS'}
              </span>
            </div>

            {/* Action buttons */}
            <button
              onClick={handleOpenFullpage}
              className="flex items-center gap-1.5 px-3 py-2 border border-white/10 text-on-surface-variant font-label-caps text-[10px] hover:bg-white/5 hover:text-primary-fixed-dim transition-colors cursor-pointer mr-auto"
              title="Open fullpage"
            >
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              FULLPAGE
            </button>
            {initialNote && (
              <>
                <button
                  onClick={() => { duplicateNote(initialNote.id); onClose(); }}
                  className="flex items-center gap-1.5 px-3 py-2 border border-white/10 text-on-surface-variant font-label-caps text-[10px] hover:bg-white/5 hover:text-primary-fixed-dim transition-colors cursor-pointer"
                  title="Duplicate note"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                  DUPLICATE
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-error/40 text-error font-label-caps text-[10px] hover:bg-error/10 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  DELETE
                </button>
              </>
            )}
            <button
              onClick={handleSave}
              disabled={!hasChanges && !!initialNote}
              className="flex items-center gap-2 px-6 py-2 bg-primary-fixed-dim text-background font-label-caps text-[10px] hover:bg-[#6ff6ff] transition-colors cursor-pointer tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
              title="Ctrl+S"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              SAVE
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && initialNote && (
        <ConfirmModal
          title="DELETE NOTE"
          message={`Permanently delete "${initialNote.title || 'this note'}"? This action cannot be undone.`}
          confirmLabel="DELETE"
          onConfirm={() => { deleteNote(initialNote.id); onClose(); }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {showDiscardConfirm && (
        <ConfirmModal
          title="UNSAVED CHANGES"
          message="You have unsaved changes. Are you sure you want to discard them?"
          confirmLabel="DISCARD"
          onConfirm={onClose}
          onCancel={() => setShowDiscardConfirm(false)}
        />
      )}

      {showNewFolderModal && (
        <FolderEditorModal
          folderId={null}
          onClose={() => setShowNewFolderModal(false)}
          onSuccess={(id) => setFolderId(id)}
        />
      )}
    </>
  );
}
