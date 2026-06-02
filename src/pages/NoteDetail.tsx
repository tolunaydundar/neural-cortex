import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotes, type NoteColor } from '../context/NoteContext';
import TipTapEditor, { type HeadingItem } from '../components/TipTapEditor';
import FolderEditorModal from '../components/FolderEditorModal';
import { uploadFile } from '../utils/storage';
import { useAuth } from '../context/AuthContext';

const COLORS: NoteColor[] = ['default', 'red', 'orange', 'yellow', 'green', 'blue', 'purple'];
const COLOR_MAP: Record<NoteColor, string> = {
  default: 'bg-on-surface-variant/40',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500'
};

function wordCount(text: string): number {
  const stripped = text.replace(/(<([^>]+)>)/gi, "");
  return stripped.trim() ? stripped.trim().split(/\s+/).length : 0;
}

export default function NoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notes, folders, updateNote, addNote } = useNotes();
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
  
  const [isUploading, setIsUploading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  
  const [focusMode, setFocusMode] = useState(false);
  const [headings, setHeadings] = useState<HeadingItem[]>([]);

  // Initialize state from note
  useEffect(() => {
    if (!isNew && existingNote && !initialized) {
      // Hydrate the editor draft once after the note arrives from Firestore.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    
    const cleanTitle = title.trim();
    if (!cleanTitle && !content.trim()) return;

    if (existingNote) {
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
  }, [initialized, title, content, existingNote, tags, folderId, color, pinned, icon, coverImage, updateNote]);

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
      await addNote({
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

  const scrollToHeading = (index: number) => {
    const headingElements = document.querySelectorAll('.ProseMirror h1, .ProseMirror h2, .ProseMirror h3');
    const target = headingElements[index];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const words = wordCount(content);

  if (!initialized && !isNew) return null;

  return (
    <div className={`flex-grow flex flex-col note-color-${color} bg-background min-h-[calc(100vh-64px)] transition-all duration-500`}>
      {/* Top bar internal */}
      <div className={`flex items-center justify-between py-3 px-6 sticky top-0 bg-background/90 backdrop-blur-md z-30 transition-all duration-300 ${focusMode ? '-translate-y-full opacity-0 absolute' : 'border-b border-on-surface/10'}`}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/notes')} className="flex items-center gap-1 text-on-surface-variant hover:text-primary-fixed-dim transition-colors text-xs font-label-caps tracking-widest">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            BACK
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setFocusMode(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-on-surface-variant hover:text-primary-fixed-dim transition-colors cursor-pointer rounded-sm font-label-caps text-[10px]"
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            FOCUS
          </button>
          {isUploading && <span className="text-[10px] text-on-surface-variant">Uploading...</span>}
          <button
            onClick={() => setPinned(!pinned)}
            className={`material-symbols-outlined text-xl transition-colors cursor-pointer p-1.5 ${
              pinned ? 'text-primary-fixed-dim' : 'text-on-surface-variant/70 hover:text-on-surface-variant'
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

      {/* Floating Focus Toggle when in focus mode */}
      {focusMode && (
        <button
          onClick={() => setFocusMode(false)}
          className="fixed top-4 right-4 z-50 bg-surface-container/50 hover:bg-surface-container-high border border-on-surface/20 backdrop-blur-md text-on-surface-variant p-2 rounded-full transition-all group"
          title="Exit Focus Mode"
        >
          <span className="material-symbols-outlined group-hover:text-primary-fixed-dim transition-colors">close_fullscreen</span>
        </button>
      )}

      {/* Main Content Area */}
      <div className="flex flex-grow relative w-full overflow-hidden">
        
        {/* Editor Center Area */}
        <div className={`flex-grow overflow-y-auto custom-scrollbar flex flex-col items-center transition-all duration-500 pb-24 ${focusMode ? 'px-4 sm:px-12' : 'px-4 sm:px-12'}`}>
          <div className="max-w-[760px] w-full flex flex-col relative pt-8">
            
            {/* Cover Image */}
            {coverImage ? (
              <div className="relative w-full h-48 sm:h-64 rounded-sm overflow-hidden mb-12 group">
                <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                <div className={`absolute top-4 right-4 transition-opacity flex gap-2 ${focusMode ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                  <label className="bg-black/40 hover:bg-black/70 text-on-surface px-3 py-1.5 rounded-md text-[10px] font-label-caps cursor-pointer backdrop-blur-md transition-colors border border-on-surface/20">
                    CHANGE
                    <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                  </label>
                  <button 
                    onClick={() => setCoverImage(null)}
                    className="bg-black/40 hover:bg-red-500/70 text-on-surface px-3 py-1.5 rounded-md text-[10px] font-label-caps cursor-pointer backdrop-blur-md transition-colors border border-on-surface/20"
                  >
                    REMOVE
                  </button>
                </div>
              </div>
            ) : (
              <div className={`mb-8 transition-opacity flex gap-4 ${focusMode ? 'opacity-0 pointer-events-none hidden' : 'opacity-0 hover:opacity-100 focus-within:opacity-100'}`}>
                <label className="flex items-center gap-1.5 text-on-surface-variant/80 hover:text-primary-fixed-dim text-[11px] font-label-caps cursor-pointer transition-colors">
                  <span className="material-symbols-outlined text-[16px]">image</span>
                  ADD COVER
                  <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                </label>
                {!icon && (
                  <button 
                    onClick={() => {
                      const newIcon = window.prompt("Enter an emoji or icon name", "📄");
                      if (newIcon) setIcon(newIcon);
                    }}
                    className="flex items-center gap-1.5 text-on-surface-variant/80 hover:text-primary-fixed-dim text-[11px] font-label-caps cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">sentiment_satisfied</span>
                    ADD ICON
                  </button>
                )}
              </div>
            )}

            {/* Icon & Title */}
            <div className={`flex flex-col relative ${coverImage ? '-mt-24 pl-8 mb-6 z-10' : 'mb-6'}`}>
              {icon && (
                <div className="relative group w-fit mb-4">
                  <div className="text-6xl sm:text-[80px] leading-none drop-shadow-xl select-none">{icon}</div>
                  <button 
                    onClick={() => setIcon(null)}
                    className={`absolute -top-2 -right-2 bg-surface-container border border-on-surface/20 rounded-full w-6 h-6 flex items-center justify-center transition-opacity text-on-surface-variant hover:text-error ${focusMode ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}
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
                className="font-headline-lg text-4xl sm:text-6xl text-on-surface bg-transparent border-none outline-none w-full placeholder:text-on-surface-variant/80 font-bold"
              />
            </div>

            {/* Metadata row */}
            <div className={`flex flex-wrap items-center gap-4 mb-12 transition-all duration-300 ${focusMode ? 'opacity-0 h-0 overflow-hidden mb-0' : 'opacity-100 h-auto'}`}>
              <div className="flex items-center gap-2 bg-on-surface/5 border border-on-surface/10 rounded-md px-3 py-1.5">
                <span className="material-symbols-outlined text-[14px] text-on-surface-variant">folder</span>
                <select
                  value={folderId || ''}
                  onChange={(e) => setFolderId(e.target.value || null)}
                  className="bg-transparent text-[11px] font-label-caps text-on-surface-variant focus:outline-none focus:text-primary-fixed-dim cursor-pointer"
                >
                  <option value="">No Folder</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowNewFolderModal(true)}
                  className="material-symbols-outlined text-[14px] text-on-surface-variant/80 hover:text-primary-fixed-dim transition-colors cursor-pointer"
                  title="New Folder"
                >
                  add_circle
                </button>
              </div>

              <div className="flex items-center gap-2 bg-on-surface/5 border border-on-surface/10 rounded-md px-3 py-1.5">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-4 h-4 rounded-full border border-on-surface/20 transition-all ${COLOR_MAP[c]} ${color === c ? 'ring-2 ring-offset-2 ring-on-surface ring-offset-background scale-110 opacity-100' : 'opacity-40 hover:opacity-100'}`}
                    title={c.charAt(0).toUpperCase() + c.slice(1)}
                  />
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 bg-on-surface/5 border border-on-surface/10 rounded-md px-3 py-1.5">
                <span className="material-symbols-outlined text-[14px] text-on-surface-variant mr-1">sell</span>
                {tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded-sm bg-surface-container text-[10px] font-label-caps text-on-surface-variant flex items-center gap-1">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="hover:text-error">×</button>
                  </span>
                ))}
                <form onSubmit={handleAddTag} className="inline-flex">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder={tags.length === 0 ? "Add tags..." : "+"}
                    className="bg-transparent border-none outline-none font-label-caps text-[10px] text-on-surface-variant/80 w-24 placeholder:text-on-surface-variant/60"
                  />
                </form>
              </div>
            </div>

            {/* Editor */}
            <div className="w-full">
              <TipTapEditor 
                content={content} 
                onChange={setContent}
                onHeadingsUpdate={setHeadings}
                placeholder="Start writing or type '/' for commands..."
              />
            </div>
            
            {/* Footer info */}
            <div className={`py-8 text-center mt-12 border-t border-on-surface/10 transition-opacity ${focusMode ? 'opacity-0' : 'opacity-100'}`}>
              <span className="font-label-caps text-[9px] text-on-surface-variant/60 tracking-widest">
                {words} WORDS • LAST EDITED {existingNote ? new Date(existingNote.updated_at).toLocaleString() : 'NOW'}
              </span>
            </div>
          </div>
        </div>

        {/* Outline / Table of Contents Sidebar */}
        <div className={`hidden xl:block w-64 flex-shrink-0 border-l border-on-surface/10 bg-background transition-all duration-500 overflow-y-auto custom-scrollbar ${focusMode ? 'translate-x-full absolute right-0 opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}>
          <div className="p-6 sticky top-0">
            <h3 className="font-label-caps text-[10px] tracking-widest text-on-surface-variant/80 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">format_list_bulleted</span>
              OUTLINE
            </h3>
            {headings.length === 0 ? (
              <p className="text-[11px] text-on-surface-variant/60 font-body-md italic">
                Add headings to your note to see the outline here.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {headings.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => scrollToHeading(h.originalIndex)}
                    className="text-left font-body-md text-[13px] text-on-surface-variant hover:text-primary-fixed-dim transition-colors truncate"
                    style={{ paddingLeft: `${(h.level - 1) * 12}px` }}
                    title={h.text}
                  >
                    {h.text}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {showNewFolderModal && (
        <FolderEditorModal
          folderId={null}
          onClose={() => setShowNewFolderModal(false)}
          onSuccess={(newId) => setFolderId(newId)}
        />
      )}
    </div>
  );
}
