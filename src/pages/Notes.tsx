import { useState, useMemo, useEffect } from 'react';
import { useNotes, type Note } from '../context/NoteContext';
import NoteCard from '../components/NoteCard';
import NoteEditorModal from '../components/NoteEditorModal';
import FolderEditorModal from '../components/FolderEditorModal';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

type SortMode = 'updated' | 'created' | 'alpha' | 'custom';
type ViewMode = 'grid' | 'list';
type SidebarFilter = 'all' | 'pinned' | { type: 'folder'; id: string } | { type: 'tag'; tag: string };

export default function Notes() {
  const { notes, folders, getAllTags, reorderNotes } = useNotes();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>(() => {
    return (localStorage.getItem('nexus_notes_sort_mode') as SortMode) || 'updated';
  });
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem('nexus_notes_view_mode') as ViewMode) || 'grid';
  });

  useEffect(() => {
    localStorage.setItem('nexus_notes_sort_mode', sortMode);
  }, [sortMode]);

  useEffect(() => {
    localStorage.setItem('nexus_notes_view_mode', viewMode);
  }, [viewMode]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarFilter, setSidebarFilter] = useState<SidebarFilter>('all');
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const allTags = getAllTags();
  const pinnedCount = notes.filter(n => n.pinned).length;

  const handleOpenEditor = (note?: Note) => {
    setSelectedNote(note || null);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setSelectedNote(null);
    setIsEditorOpen(false);
  };

  const handleEditFolder = (id: string) => {
    setEditingFolderId(id);
    setIsFolderModalOpen(true);
  };

  const handleNewFolder = () => {
    setEditingFolderId(null);
    setIsFolderModalOpen(true);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      if (sortMode !== 'custom') {
        setSortMode('custom');
      }
      reorderNotes(active.id as string, over.id as string);
    }
  };

  // ── Filtering ──

  const filteredNotes = useMemo(() => {
    let result = [...notes];

    // Sidebar filter
    if (sidebarFilter === 'pinned') {
      result = result.filter(n => n.pinned);
    } else if (typeof sidebarFilter === 'object' && sidebarFilter.type === 'folder') {
      result = result.filter(n => n.folder_id === sidebarFilter.id);
    } else if (typeof sidebarFilter === 'object' && sidebarFilter.type === 'tag') {
      result = result.filter(n => n.tags.includes(sidebarFilter.tag));
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      // Pinned notes always first (except when filtering by pinned)
      if (sidebarFilter !== 'pinned') {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
      }
      if (sortMode === 'updated') {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
      if (sortMode === 'created') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortMode === 'alpha') {
        return a.title.localeCompare(b.title);
      }
      return 0; // 'custom' mode
    });

    return result;
  }, [notes, sidebarFilter, sortMode, searchQuery]);

  const pinnedNotes = filteredNotes.filter(n => n.pinned);
  const unpinnedNotes = filteredNotes.filter(n => !n.pinned);
  const showPinnedSection = sidebarFilter !== 'pinned' && pinnedNotes.length > 0;

  // Active sidebar filter label
  const filterLabel = (() => {
    if (sidebarFilter === 'all') return 'All Notes';
    if (sidebarFilter === 'pinned') return 'Pinned';
    if (typeof sidebarFilter === 'object' && sidebarFilter.type === 'folder') {
      const f = folders.find(f => f.id === sidebarFilter.id);
      return f?.name || 'Folder';
    }
    if (typeof sidebarFilter === 'object' && sidebarFilter.type === 'tag') {
      return `#${sidebarFilter.tag}`;
    }
    return 'Notes';
  })();

  // ── Sidebar Content ──
  const sidebarContent = (
    <div className="flex flex-col h-full py-2">
      {/* Main filters */}
      <button
        onClick={() => { setSidebarFilter('all'); setMobileSidebarOpen(false); }}
        className={`note-sidebar-item ${sidebarFilter === 'all' ? 'active' : ''}`}
      >
        <span className="material-symbols-outlined text-[18px]">notes</span>
        <span className="flex-grow">All Notes</span>
        <span className="font-data-display text-[11px] opacity-50">{notes.length}</span>
      </button>
      <button
        onClick={() => { setSidebarFilter('pinned'); setMobileSidebarOpen(false); }}
        className={`note-sidebar-item ${sidebarFilter === 'pinned' ? 'active' : ''}`}
      >
        <span className="material-symbols-outlined text-[18px]">push_pin</span>
        <span className="flex-grow">Pinned</span>
        <span className="font-data-display text-[11px] opacity-50">{pinnedCount}</span>
      </button>

      {/* Folders */}
      <div className="note-sidebar-section-title flex items-center justify-between">
        <span>Folders</span>
        <button
          onClick={handleNewFolder}
          className="material-symbols-outlined text-[14px] cursor-pointer hover:text-primary-fixed-dim transition-colors opacity-70 hover:opacity-100"
          title="New Folder"
        >
          add
        </button>
      </div>

      {folders.length === 0 ? (
        <div className="px-4 py-2">
          <p className="text-[10px] text-on-surface-variant/40 italic">No folders yet</p>
        </div>
      ) : (
        folders.map(f => {
          const count = notes.filter(n => n.folder_id === f.id).length;
          const isActive = typeof sidebarFilter === 'object' && sidebarFilter.type === 'folder' && sidebarFilter.id === f.id;
          return (
            <div key={f.id} className="group flex items-center">
              <button
                onClick={() => { setSidebarFilter({ type: 'folder', id: f.id }); setMobileSidebarOpen(false); }}
                className={`note-sidebar-item flex-grow ${isActive ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined text-[18px]">{f.icon}</span>
                <span className="flex-grow truncate">{f.name}</span>
                <span className="font-data-display text-[11px] opacity-50">{count}</span>
              </button>
              <button
                onClick={() => handleEditFolder(f.id)}
                className="material-symbols-outlined text-[14px] text-on-surface-variant/20 hover:text-primary-fixed-dim transition-colors cursor-pointer pr-3 opacity-0 group-hover:opacity-100"
                title="Edit folder"
              >
                edit
              </button>
            </div>
          );
        })
      )}

      {/* Tags */}
      {allTags.length > 0 && (
        <>
          <div className="note-sidebar-section-title">Tags</div>
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {allTags.map(tag => {
              const isActive = typeof sidebarFilter === 'object' && sidebarFilter.type === 'tag' && sidebarFilter.tag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => {
                    setSidebarFilter(isActive ? 'all' : { type: 'tag', tag });
                    setMobileSidebarOpen(false);
                  }}
                  className={`note-tag-chip interactive ${isActive ? 'bg-primary-fixed-dim/20 border-primary-fixed-dim/40' : ''}`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );

  // ── Note Grid/List Rendering ──
  const renderNotes = (noteList: Note[]) => {
    const strategy = viewMode === 'grid' ? rectSortingStrategy : verticalListSortingStrategy;
    const containerClass = viewMode === 'grid' 
      ? "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4" 
      : "space-y-2";

    return (
      <SortableContext items={noteList.map(n => n.id)} strategy={strategy}>
        <div className={containerClass}>
          {noteList.map(note => (
            <NoteCard key={note.id} note={note} onClick={handleOpenEditor} />
          ))}
        </div>
      </SortableContext>
    );
  };

  return (
    <div className="flex-grow flex flex-col space-y-6 lg:space-y-8 h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg text-primary-fixed-dim">Notebook</h1>
          <p className="text-on-surface-variant font-label-caps text-[10px] mt-1">KNOWLEDGE BASE & NEURAL ARCHIVES</p>
        </div>
        <button
          onClick={() => handleOpenEditor()}
          className="flex justify-center items-center gap-2 px-4 py-2 bg-primary-fixed-dim text-background font-label-caps text-xs hover:bg-[#6ff6ff] transition-colors cursor-pointer shadow-[0_0_15px_rgba(0,220,230,0.4)] hover:shadow-[0_0_20px_rgba(0,220,230,0.6)] rounded-sm w-full sm:w-fit"
        >
          <span className="material-symbols-outlined text-sm">edit_square</span>
          <span>NEW NOTE</span>
        </button>
      </div>

      {/* Stats ribbon */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-panel p-3 lg:p-4 text-center">
          <p className="font-label-caps text-[9px] text-on-surface-variant mb-1">TOTAL NOTES</p>
          <p className="font-data-display text-xl lg:text-2xl text-primary-fixed-dim">{notes.length}</p>
        </div>
        <div className="glass-panel p-3 lg:p-4 text-center">
          <p className="font-label-caps text-[9px] text-on-surface-variant mb-1">PINNED</p>
          <p className="font-data-display text-xl lg:text-2xl text-primary-fixed-dim">{pinnedCount}</p>
        </div>
        <div className="glass-panel p-3 lg:p-4 text-center">
          <p className="font-label-caps text-[9px] text-on-surface-variant mb-1">FOLDERS</p>
          <p className="font-data-display text-xl lg:text-2xl text-primary-fixed-dim">{folders.length}</p>
        </div>
      </div>

      {/* Main layout: Sidebar + Content */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-grow min-h-0">

        {/* Desktop Sidebar */}
        <div className="note-sidebar hidden lg:block glass-panel custom-scrollbar rounded-sm">
          {sidebarContent}
        </div>

        {/* Mobile Sidebar Area */}
        <div className="lg:hidden flex flex-col gap-2">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="flex items-center justify-between w-full px-3 py-2 border border-white/10 text-on-surface-variant font-label-caps text-[10px] hover:bg-white/5 transition-colors cursor-pointer rounded-sm"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">folder_open</span>
              {filterLabel}
            </div>
            <span className="material-symbols-outlined text-[14px]">{mobileSidebarOpen ? 'expand_less' : 'expand_more'}</span>
          </button>

          {mobileSidebarOpen && (
            <div className="glass-panel rounded-sm max-h-[60vh] overflow-y-auto custom-scrollbar">
              {sidebarContent}
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="flex-grow flex flex-col gap-4 min-w-0">

          {/* Controls: Search, Sort, View */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
              <input
                type="text"
                placeholder="Search notes, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container-lowest border border-white/10 pl-9 pr-3 py-2 font-body-md text-sm text-on-surface focus:outline-none focus:border-primary-fixed-dim transition-all rounded-sm"
              />
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="bg-surface-container-lowest border border-white/10 px-2 py-1 text-[10px] font-label-caps text-on-surface-variant focus:outline-none focus:border-primary-fixed-dim cursor-pointer rounded-sm"
              >
                <option value="custom">SORT: CUSTOM</option>
                <option value="updated">SORT: RECENT</option>
                <option value="created">SORT: CREATED</option>
                <option value="alpha">SORT: A-Z</option>
              </select>

              <div className="flex border border-white/10 rounded-sm overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-primary-fixed-dim/15 text-primary-fixed-dim' : 'text-on-surface-variant/50 hover:text-on-surface-variant'}`}
                  title="Grid view"
                >
                  <span className="material-symbols-outlined text-[16px]">grid_view</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-primary-fixed-dim/15 text-primary-fixed-dim' : 'text-on-surface-variant/50 hover:text-on-surface-variant'}`}
                  title="List view"
                >
                  <span className="material-symbols-outlined text-[16px]">view_list</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active filter label on desktop */}
          {sidebarFilter !== 'all' && (
            <div className="hidden lg:flex items-center gap-2">
              <span className="font-label-caps text-[10px] text-primary-fixed-dim tracking-widest">{filterLabel.toUpperCase()}</span>
              <button
                onClick={() => setSidebarFilter('all')}
                className="material-symbols-outlined text-[14px] text-on-surface-variant/40 hover:text-primary-fixed-dim transition-colors cursor-pointer"
              >
                close
              </button>
            </div>
          )}

          {/* Note Grid */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            {notes.length === 0 ? (
              <div className="glass-panel p-12 flex flex-col items-center justify-center gap-4 text-center flex-grow">
                <button
                  onClick={() => handleOpenEditor()}
                  className="material-symbols-outlined text-6xl text-primary-fixed-dim/20 hover:text-primary-fixed-dim transition-colors cursor-pointer outline-none focus:outline-none hover:scale-110 active:scale-95"
                >
                  edit_document
                </button>
                <h3 className="font-headline-sm text-headline-sm text-on-surface-variant">NO NOTES ARCHIVED</h3>
                <p className="text-sm text-on-surface-variant/60 max-w-md">
                  Initialize a new document in your knowledge base to start archiving your thoughts and ideas.
                </p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant/60 flex-grow">
                <span className="material-symbols-outlined text-4xl mb-2 block">search_off</span>
                <p className="font-label-caps text-sm">No notes match current criteria</p>
              </div>
            ) : (
              <div className="space-y-6 pb-8">
                {showPinnedSection && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-primary-fixed-dim text-[16px]" style={{fontVariationSettings: "'FILL' 1"}}>push_pin</span>
                      <h2 className="font-label-caps text-[10px] text-primary-fixed-dim tracking-widest">PINNED ({pinnedNotes.length})</h2>
                    </div>
                    {renderNotes(pinnedNotes)}
                  </div>
                )}

                {unpinnedNotes.length > 0 && (
                  <div>
                    {showPinnedSection && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-on-surface-variant text-[16px]">notes</span>
                        <h2 className="font-label-caps text-[10px] text-on-surface-variant tracking-widest">NOTES ({unpinnedNotes.length})</h2>
                      </div>
                    )}
                    {renderNotes(unpinnedNotes)}
                  </div>
                )}

                {/* Show pinned notes in pinned filter */}
                {sidebarFilter === 'pinned' && pinnedNotes.length > 0 && (
                  <div>{renderNotes(pinnedNotes)}</div>
                )}
              </div>
            )}
          </DndContext>
        </div>
      </div>

      {/* Modals */}
      {isEditorOpen && (
        <NoteEditorModal
          initialNote={selectedNote}
          onClose={handleCloseEditor}
        />
      )}

      {isFolderModalOpen && (
        <FolderEditorModal
          folderId={editingFolderId}
          onClose={() => { setIsFolderModalOpen(false); setEditingFolderId(null); }}
        />
      )}
    </div>
  );
}
