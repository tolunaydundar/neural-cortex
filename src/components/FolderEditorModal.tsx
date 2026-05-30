import { useState, useEffect } from 'react';
import { useNotes } from '../context/NoteContext';
import ConfirmModal from './ConfirmModal';

interface FolderEditorModalProps {
  folderId?: string | null;
  onClose: () => void;
}

const FOLDER_ICONS = [
  'folder', 'work', 'school', 'science', 'code', 'terminal',
  'lightbulb', 'bookmark', 'favorite', 'star', 'psychology',
  'draw', 'brush', 'music_note', 'fitness_center', 'rocket_launch',
  'travel_explore', 'savings', 'receipt_long', 'inventory_2',
];

export default function FolderEditorModal({ folderId, onClose }: FolderEditorModalProps) {
  const { folders, addFolder, updateFolder, deleteFolder } = useNotes();
  const existing = folderId ? folders.find(f => f.id === folderId) : null;

  const [name, setName] = useState(existing?.name || '');
  const [icon, setIcon] = useState(existing?.icon || 'folder');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSave = () => {
    if (!name.trim()) return;
    if (existing) {
      updateFolder(existing.id, { name: name.trim(), icon });
    } else {
      addFolder(name.trim(), icon);
    }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="glass-panel p-6 lg:p-8 w-full max-w-md mx-4 rounded-lg border-primary-fixed-dim/30 shadow-[0_0_30px_rgba(0,220,230,0.1)]" onClick={e => e.stopPropagation()}>
          <h2 className="font-headline-md text-headline-sm text-primary-fixed-dim mb-6">
            {existing ? 'Edit Folder' : 'New Folder'}
          </h2>

          {/* Name input */}
          <div className="mb-5">
            <label className="font-label-caps text-[10px] text-on-surface-variant block mb-2">FOLDER NAME</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Work, Research, Ideas"
              autoFocus
              className="w-full bg-surface-container-lowest border border-white/10 p-3 font-body-md text-sm text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-all rounded-sm"
            />
          </div>

          {/* Icon picker */}
          <div className="mb-6">
            <label className="font-label-caps text-[10px] text-on-surface-variant block mb-2">ICON</label>
            <div className="flex flex-wrap gap-1.5">
              {FOLDER_ICONS.map(ic => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`w-9 h-9 flex items-center justify-center rounded-sm transition-all cursor-pointer ${
                    icon === ic
                      ? 'bg-primary-fixed-dim/15 text-primary-fixed-dim border border-primary-fixed-dim/30'
                      : 'bg-surface-container-lowest text-on-surface-variant/60 border border-white/5 hover:border-white/15 hover:text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{ic}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/5">
            {existing && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 border border-error/40 text-error font-label-caps text-[10px] hover:bg-error/10 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                DELETE
              </button>
            )}
            <div className="flex-grow" />
            <button
              onClick={onClose}
              className="px-4 py-2 border border-white/20 text-on-surface font-label-caps text-[10px] hover:bg-white/5 transition-colors cursor-pointer"
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-primary-fixed-dim text-background font-label-caps text-[10px] hover:bg-[#6ff6ff] transition-colors cursor-pointer tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {existing ? 'SAVE' : 'CREATE'}
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && existing && (
        <ConfirmModal
          title="DELETE FOLDER"
          message={`Delete "${existing.name}"? Notes inside will be moved to uncategorized.`}
          confirmLabel="DELETE"
          onConfirm={() => { deleteFolder(existing.id); onClose(); }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
}
