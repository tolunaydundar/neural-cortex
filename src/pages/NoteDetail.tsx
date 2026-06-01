import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotes, type Note, type NoteColor } from '../context/NoteContext';
import TipTapEditor from '../components/TipTapEditor';
import ConfirmModal from '../components/ConfirmModal';
import FolderEditorModal from '../components/FolderEditorModal';
import { uploadFile } from '../utils/storage';
import { useAuth } from '../context/AuthContext';

const COLORS: NoteColor[] = ['default', 'red', 'orange', 'yellow', 'green', 'blue', 'purple'];

function wordCount(text: string): number {
  const stripped = text.replace(/(<([^>]+)>)/gi, "");
  return stripped.trim() ? stripped.trim().split(/\s+/).length : 0;
}

export default function NoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notes, folders, updateNote, deleteNote, addNote } = useNotes();
  const { currentUser } = useAuth();
  
  const isNew = id === 'new';
  const existingNote = notes.find(n => n.id === id);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [color, setColor] = useState<NoteColor>('default');
  const [pinned, setPinned] = useState(false);
  const [icon, setIcon] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize state from note
  useEffect(() => {
    if (!isNew && existingNote && !initialized) {
      setTitle(existingNote.title || '');
      setContent(existingNote.content || '');
      setTags(existingNote.tags || []);
      setFolderId(existingNote.folder_id || null);
      setColor(existingNote.color || 'default');
      setPinned(existingNote.pinned || false);
      setIcon(existingNote.icon || null);
      setCoverImage(existingNote.cover_image || null);
      setInitialized(true);
    } else if (isNew && !initialized) {
      setInitialized(true);
    }
  }, [existingNote, isNew, initialized]);

  // Autosave logic
  const saveNote = useCallback(async () => {
    if (!initialized) return;
    
    // Only save if there's actual content or title
    const cleanTitle = title.trim();
    if (!cleanTitle && !content.trim()) return;

    if (isNew) {
      // Create it and then redirect to the real ID
      // Actually, addNote doesn't return the ID right now. 
      // We need to modify addNote to return the ID. Let's assume we just save when user clicks a Save button for new notes,
      // or we handle auto-save by creating it immediately.
      // For now, let's just make the user save explicitly if it's "new", or we let them navigate away.
    } else if (existingNote) {
      updateNote(existingNote.id, {
        title: cleanTitle,
        content,
        tags,
        folder_id: folderId,
        color,
        pinned,
        icon,
        cover_image: coverImage,
        format: 'html'
      });
    }
  }, [initialized, title, content, isNew, existingNote, tags, folderId, color, pinned, icon, coverImage, updateNote]);

  // Ctrl+S
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveNote();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [saveNote]);

  const handleManualSave = async () => {
    if (isNew) {
      const cleanTitle = title.trim();
      if (!cleanTitle && !content.trim()) {
        navigate('/notes');
        return;
      }
      const newId = await addNote({
        title: cleanTitle,
        content,
        tags,
        folder_id: folderId,
        color,
        pinned,
        icon,
        cover_image: coverImage,
        format: 'html'
      });
      navigate(`/notes`);
    } else {
      await saveNote();
      navigate('/notes');
    }
  };

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
      handleAddTag(e as unknown as React.FormEvent);
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(prev => prev.slice(0, -1));
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setIsUploading(true);
    try {
      const path = `users/${currentUser.uid}/covers/${Date.now()}_${file.name}`;
      const url = await uploadFile(file, path);
      setCoverImage(url);
    } catch (err) {
      console.error('Failed to upload cover', err);
    } finally {
      setIsUploading(false);
    }
  };

  const words = wordCount(content);

  if (!initialized && !isNew) return null;

  return (
    <div className={`flex-grow flex flex-col note-color-${color} bg-background min-h-[calc(100vh-64px)] pb-12`}>
      {/* Top bar internal */}
      <div className="flex items-center justify-between py-4 border-b border-white/5 sticky top-0 bg-background/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/notes')} className="flex items-center gap-1 text-on-surface-variant hover:text-primary-fixed-dim transition-colors text-sm font-label-caps">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            BACK
          </button>
          
          <div className="hidden sm:flex items-center gap-2 border-l border-white/10 pl-4">
            <span className="material-symbols-outlined text-sm text-on-surface-variant">folder</span>
            <select
              value={folderId || ''}
              onChange={(e) => setFolderId(e.target.value || null)}
              className="bg-transparent text-[10px] font-label-caps text-on-surface-variant focus:outline-none focus:text-primary-fixed-dim cursor-pointer"
            >
              <option value="">No Folder</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isUploading && <span className="text-[10px] text-on-surface-variant">Uploading...</span>}
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
            onClick={handleManualSave}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-fixed-dim text-background font-label-caps text-[10px] hover:bg-[#6ff6ff] transition-colors cursor-pointer rounded-sm"
          >
            <span className="material-symbols-outlined text-[14px]">save</span>
            SAVE
          </button>
        </div>
      </div>

      <div className="max-w-4xl w-full mx-auto flex flex-col flex-grow relative pt-6 px-4 sm:px-8">
        
        {/* Cover Image Section */}
        {coverImage ? (
          <div className="relative w-full h-48 sm:h-64 rounded-xl overflow-hidden mb-8 group">
            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <label className="bg-black/50 hover:bg-black/80 text-white px-3 py-1.5 rounded text-[10px] font-label-caps cursor-pointer backdrop-blur-sm transition-colors">
                CHANGE
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
              </label>
              <button 
                onClick={() => setCoverImage(null)}
                className="bg-black/50 hover:bg-red-500/80 text-white px-3 py-1.5 rounded text-[10px] font-label-caps cursor-pointer backdrop-blur-sm transition-colors"
              >
                REMOVE
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-6 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity flex gap-4">
            <label className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary-fixed-dim text-[11px] font-label-caps cursor-pointer transition-colors">
              <span className="material-symbols-outlined text-[16px]">image</span>
              ADD COVER
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            </label>
            <button 
              onClick={() => {
                const newIcon = window.prompt("Enter an emoji or icon name", "📄");
                if (newIcon) setIcon(newIcon);
              }}
              className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary-fixed-dim text-[11px] font-label-caps cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">sentiment_satisfied</span>
              ADD ICON
            </button>
          </div>
        )}

        {/* Icon & Title */}
        <div className="flex items-end gap-4 mb-6">
          {icon && (
            <div className="relative group">
              <span className="text-5xl sm:text-7xl">{icon}</span>
              <button 
                onClick={() => setIcon(null)}
                className="absolute -top-2 -right-2 bg-surface-container border border-white/10 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant hover:text-error"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          )}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Note"
            className="font-headline-lg text-4xl sm:text-5xl text-on-surface bg-transparent border-none outline-none w-full placeholder:text-on-surface-variant/30"
          />
        </div>

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
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
          
          <div className="w-px h-4 bg-white/10" />

          <div className="flex flex-wrap items-center gap-1.5">
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
                className="bg-transparent border-none outline-none font-label-caps text-[10px] text-on-surface-variant w-24 placeholder:text-on-surface-variant/30"
              />
            </form>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-grow flex flex-col min-h-[500px]">
          <TipTapEditor 
            content={content} 
            onChange={setContent} 
            placeholder="Type '/' for commands or start writing..."
          />
        </div>
        
        {/* Footer info */}
        <div className="py-4 text-center mt-8">
          <span className="font-label-caps text-[9px] text-on-surface-variant/40">
            {words} WORDS • LAST EDITED {existingNote ? new Date(existingNote.updated_at).toLocaleString() : 'NOW'}
          </span>
        </div>
      </div>
    </div>
  );
}
