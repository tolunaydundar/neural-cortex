import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNotes, type Note } from '../context/NoteContext';
import { useAuth } from '../context/AuthContext';
import NoteCard from '../components/NoteCard';
import NoteEditorModal from '../components/NoteEditorModal';
import FolderEditorModal from '../components/FolderEditorModal';
import FolderTree from '../components/FolderTree';
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
  arrayMove,
} from '@dnd-kit/sortable';
import { usePageTitle } from '../utils/usePageTitle';
import { useNavigate } from 'react-router-dom';

type SortMode = 'updated' | 'created' | 'alpha' | 'custom';
type ViewMode = 'grid' | 'list' | 'table';
type SidebarFilter = 'all' | 'pinned' | { type: 'folder'; id: string } | { type: 'tag'; tag: string };

export default function Notes() {
  usePageTitle('Notes');
  const navigate = useNavigate();
  const { notes, folders, getAllTags, updateNote } = useNotes();
  const { userPreferences, updateUserPreferences } = useAuth();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [sortMode, setSortModeLocal] = useState<SortMode>(
    (userPreferences.notesSortMode as SortMode) || 'updated'
  );
  const [viewMode, setViewModeLocal] = useState<ViewMode>(
    (userPreferences.notesViewMode as ViewMode) || 'grid'
  );

  useEffect(() => {
    if (userPreferences.notesSortMode) {
      setSortModeLocal(userPreferences.notesSortMode as SortMode);
    }
    if (userPreferences.notesViewMode) {
      setViewModeLocal(userPreferences.notesViewMode as ViewMode);
    }
  }, [userPreferences.notesSortMode, userPreferences.notesViewMode]);

  const setSortMode = useCallback((mode: SortMode) => {
    setSortModeLocal(mode);
    updateUserPreferences({ notesSortMode: mode });
  }, [updateUserPreferences]);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeLocal(mode);
    updateUserPreferences({ notesViewMode: mode });
  }, [updateUserPreferences]);

  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarFilter, setSidebarFilter] = useState<SidebarFilter>('all');
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const allTags = getAllTags();
  const pinnedCount = notes.filter(n => n.pinned).length;

  const handleOpenEditor = (note?: Note) => {
    if (userPreferences.notesEditorMode === 'full') {
      if (note) {
        navigate(`/notes/${note.id}`);
      } else {
        navigate(`/notes/new`);
      }
    } else {
      setSelectedNote(note || null);
      setIsEditorOpen(true);
    }
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

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      if (sortMode !== 'custom') {
        setSortMode('custom');
      }
      
      const activeNote = notes.find(n => n.id === active.id);
      if (!activeNote) return;

      const list = activeNote.pinned ? notes.filter(n => n.pinned) : notes.filter(n => !n.pinned);
      const oldIndex = list.findIndex(n => n.id === active.id);
      const newIndex = list.findIndex(n => n.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newArray = arrayMove(list, oldIndex, newIndex);
        const prevNote = newArray.at(newIndex - 1);
        const nextNote = newArray.at(newIndex + 1);

        let newOrder: number;
        if (!prevNote && !nextNote) {
          newOrder = Date.now();
        } else if (!prevNote) {
          newOrder = (nextNote!.order ?? new Date(nextNote!.created_at).getTime()) + 10000;
        } else if (!nextNote) {
          newOrder = (prevNote!.order ?? new Date(prevNote!.created_at).getTime()) - 10000;
        } else {
          const prevOrder = prevNote!.order ?? new Date(prevNote!.created_at).getTime();
          const nextOrder = nextNote!.order ?? new Date(nextNote!.created_at).getTime();
          newOrder = (prevOrder + nextOrder) / 2;
        }

        updateNote(active.id as string, { order: newOrder });
      }
    }
  }, [sortMode, notes, updateNote]);

  const filteredNotes = useMemo(() => {
    let result = [...notes];

    if (sidebarFilter === 'pinned') {
      result = result.filter(n => n.pinned);
    } else if (typeof sidebarFilter === 'object' && sidebarFilter.type === 'folder') {
      result = result.filter(n => n.folder_id === sidebarFilter.id);
    } else if (typeof sidebarFilter === 'object' && sidebarFilter.type === 'tag') {
      result = result.filter(n => n.tags.includes(sidebarFilter.tag));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
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
      return 0;
    });

    return result;
  }, [notes, sidebarFilter, sortMode, searchQuery]);

  const pinnedNotes = filteredNotes.filter(n => n.pinned);
  const unpinnedNotes = filteredNotes.filter(n => !n.pinned);
  const showPinnedSection = sidebarFilter !== 'pinned' && pinnedNotes.length > 0;

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

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Main filters */}
      <button
        onClick={() => { setSidebarFilter('all'); setMobileSidebarOpen(false); }}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors text-sm ${sidebarFilter === 'all' ? 'bg-primary-fixed-dim/10 text-primary-fixed-dim font-bold' : 'text-on-surface-variant hover:bg-on-surface/5'}`}
      >
        <span className="material-symbols-outlined text-[18px]">notes</span>
        <span className="flex-grow text-left">All Notes</span>
        <span className="font-data-display text-[11px] opacity-50">{notes.length}</span>
      </button>
      <button
        onClick={() => { setSidebarFilter('pinned'); setMobileSidebarOpen(false); }}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors text-sm ${sidebarFilter === 'pinned' ? 'bg-primary-fixed-dim/10 text-primary-fixed-dim font-bold' : 'text-on-surface-variant hover:bg-on-surface/5'}`}
      >
        <span className="material-symbols-outlined text-[18px]">push_pin</span>
        <span className="flex-grow text-left">Pinned</span>
        <span className="font-data-display text-[11px] opacity-50">{pinnedCount}</span>
      </button>

      {/* Folders */}
      <div className="flex items-center justify-between mt-6 mb-2 px-4">
        <span className="font-label-caps text-[10px] text-on-surface-variant/80 tracking-widest">FOLDERS</span>
        <button
          onClick={handleNewFolder}
          className="material-symbols-outlined text-[14px] cursor-pointer hover:text-primary-fixed-dim transition-colors text-on-surface-variant/80"
          title="New Folder"
        >
          add
        </button>
      </div>

      {folders.length === 0 ? (
        <div className="px-4 py-2">
          <p className="text-[11px] text-on-surface-variant/60 italic">No folders yet</p>
        </div>
      ) : (
        <div className="px-2">
          <FolderTree
            folders={folders}
            parentId={null}
            activeFilter={sidebarFilter}
            onSelect={(id) => { setSidebarFilter({ type: 'folder', id }); setMobileSidebarOpen(false); }}
            onEdit={handleEditFolder}
            getNoteCount={(folderId) => notes.filter(n => n.folder_id === folderId).length}
          />
        </div>
      )}

      {/* Tags */}
      {allTags.length > 0 && (
        <>
          <div className="mt-6 mb-3 px-4">
            <span className="font-label-caps text-[10px] text-on-surface-variant/80 tracking-widest">TAGS</span>
          </div>
          <div className="px-4 pb-4 flex flex-wrap gap-1.5">
            {allTags.map(tag => {
              const isActive = typeof sidebarFilter === 'object' && sidebarFilter.type === 'tag' && sidebarFilter.tag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => {
                    setSidebarFilter(isActive ? 'all' : { type: 'tag', tag });
                    setMobileSidebarOpen(false);
                  }}
                  className={`px-2 py-1 rounded text-[11px] font-label-caps tracking-wide transition-all ${isActive ? 'bg-primary-fixed-dim/20 text-primary-fixed-dim border border-primary-fixed-dim/40' : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant border border-on-surface/10'}`}
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

  const renderNotes = (noteList: Note[]) => {
    const strategy = viewMode === 'grid' ? rectSortingStrategy : verticalListSortingStrategy;
    const containerClass = viewMode === 'grid' 
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6" 
      : "flex flex-col gap-3";

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
    <div className="flex-grow flex flex-col space-y-6 lg:space-y-8 h-full max-w-7xl mx-auto w-full px-2 sm:px-4 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-4xl lg:text-5xl text-on-surface mb-2 tracking-tight">Notebook</h1>
          <div className="flex items-center gap-4 text-on-surface-variant font-label-caps text-[10px] tracking-widest opacity-80">
            <span>{notes.length} NOTES</span>
            <span className="w-1 h-1 rounded-full bg-on-surface/20" />
            <span>{pinnedCount} PINNED</span>
            <span className="w-1 h-1 rounded-full bg-on-surface/20" />
            <span>{folders.length} FOLDERS</span>
          </div>
        </div>
        <button
          onClick={() => handleOpenEditor()}
          className="flex justify-center items-center gap-2 px-5 py-2.5 bg-primary-fixed-dim text-background font-label-caps text-xs hover:bg-[#6ff6ff] transition-all cursor-pointer shadow-[0_0_15px_rgba(0,220,230,0.3)] hover:shadow-[0_0_25px_rgba(0,220,230,0.5)] hover:scale-[1.02] active:scale-[0.98] rounded-md w-full sm:w-fit"
        >
          <span className="material-symbols-outlined text-sm">edit_square</span>
          <span>NEW NOTE</span>
        </button>
      </div>

      {/* Main layout: Sidebar + Content */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 flex-grow min-h-0 items-start">

        {/* Desktop Sidebar */}
        <div className="hidden lg:flex flex-col w-64 flex-shrink-0 sticky top-4 h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar pr-2">
          {sidebarContent}
        </div>

        {/* Mobile Sidebar Area */}
        <div className="lg:hidden flex flex-col gap-2 w-full">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="flex items-center justify-between w-full px-4 py-3 bg-surface-container rounded-lg border border-on-surface/10 text-on-surface font-label-caps text-[11px] tracking-wider transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">folder_open</span>
              {filterLabel}
            </div>
            <span className="material-symbols-outlined text-[16px]">{mobileSidebarOpen ? 'expand_less' : 'expand_more'}</span>
          </button>

          {mobileSidebarOpen && (
            <div className="bg-surface-container-lowest border border-on-surface/10 p-2 rounded-lg max-h-[60vh] overflow-y-auto custom-scrollbar shadow-xl z-10 relative">
              {sidebarContent}
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="flex-grow flex flex-col gap-6 w-full min-w-0">

          {/* Controls: Search, Sort, View */}
          <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between bg-surface-container p-2 sm:p-3 rounded-lg border border-on-surface/10">
            <div className="relative w-full xl:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/80 text-sm">search</span>
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container-highest border border-transparent pl-9 pr-3 py-2 font-body-md text-sm text-on-surface focus:outline-none focus:border-on-surface/20 focus:bg-surface-container-lowest transition-all rounded-md placeholder:text-on-surface-variant/70"
              />
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0">
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="bg-transparent border-none px-2 py-1.5 text-[11px] font-label-caps text-on-surface-variant hover:text-on-surface focus:outline-none cursor-pointer tracking-wider flex-shrink-0"
              >
                <option value="custom">SORT: CUSTOM</option>
                <option value="updated">SORT: RECENT</option>
                <option value="created">SORT: CREATED</option>
                <option value="alpha">SORT: A-Z</option>
              </select>

              <div className="w-px h-4 bg-on-surface/10 hidden sm:block flex-shrink-0" />

              <select
                value={userPreferences.notesEditorMode || 'modal'}
                onChange={(e) => updateUserPreferences({ notesEditorMode: e.target.value as 'full' | 'modal' })}
                className="bg-transparent border-none px-2 py-1.5 text-[11px] font-label-caps text-on-surface-variant hover:text-on-surface focus:outline-none cursor-pointer tracking-wider flex-shrink-0"
              >
                <option value="modal">MODE: MODAL</option>
                <option value="full">MODE: FULLPAGE</option>
              </select>

              <div className="w-px h-4 bg-on-surface/10 hidden sm:block flex-shrink-0" />

              <div className="flex bg-surface-container-highest rounded-md p-0.5 flex-shrink-0">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-surface-container-lowest text-primary-fixed-dim shadow-sm' : 'text-on-surface-variant/80 hover:text-on-surface-variant'}`}
                  title="Grid view"
                >
                  <span className="material-symbols-outlined text-[16px]">grid_view</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-surface-container-lowest text-primary-fixed-dim shadow-sm' : 'text-on-surface-variant/80 hover:text-on-surface-variant'}`}
                  title="List view"
                >
                  <span className="material-symbols-outlined text-[16px]">view_list</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-surface-container-lowest text-primary-fixed-dim shadow-sm' : 'text-on-surface-variant/80 hover:text-on-surface-variant'}`}
                  title="Table view"
                >
                  <span className="material-symbols-outlined text-[16px]">table_rows</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active filter label on desktop */}
          {sidebarFilter !== 'all' && (
            <div className="hidden lg:flex items-center gap-2 px-2">
              <span className="font-label-caps text-[10px] text-on-surface-variant/60 tracking-widest">FILTERING BY:</span>
              <span className="font-label-caps text-[10px] text-primary-fixed-dim tracking-widest bg-primary-fixed-dim/10 px-2 py-0.5 rounded">{filterLabel.toUpperCase()}</span>
              <button
                onClick={() => setSidebarFilter('all')}
                className="material-symbols-outlined text-[14px] text-on-surface-variant/70 hover:text-primary-fixed-dim transition-colors cursor-pointer ml-1"
              >
                close
              </button>
            </div>
          )}

          {/* Note Grid */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            {notes.length === 0 ? (
              <div className="border border-on-surface/10 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-4 text-center flex-grow mt-4">
                <button
                  onClick={() => handleOpenEditor()}
                  className="material-symbols-outlined text-[80px] text-on-surface-variant/70 hover:text-primary-fixed-dim/50 transition-colors cursor-pointer"
                >
                  edit_document
                </button>
                <h3 className="font-headline-sm text-xl text-on-surface-variant mt-2">Notebook Empty</h3>
                <p className="text-sm text-on-surface-variant/80 max-w-sm">
                  Initialize a new document to start archiving your thoughts and ideas.
                </p>
                <button
                  onClick={() => handleOpenEditor()}
                  className="mt-4 px-6 py-2 bg-on-surface/5 hover:bg-on-surface/10 text-on-surface font-label-caps text-[11px] rounded-full transition-colors"
                >
                  CREATE NOTE
                </button>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-20 text-on-surface-variant/70 flex-grow">
                <span className="material-symbols-outlined text-5xl mb-3 block">search_off</span>
                <p className="font-label-caps text-[11px] tracking-widest">NO MATCHES FOUND</p>
              </div>
            ) : viewMode === 'table' ? (
              <div className="w-full overflow-x-auto bg-surface-container rounded-xl border border-on-surface/10">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-on-surface/20 bg-surface-container-high font-label-caps text-[10px] text-on-surface-variant/60 tracking-wider">
                      <th className="py-4 px-5 font-normal">Title</th>
                      <th className="py-4 px-5 font-normal">Folder</th>
                      <th className="py-4 px-5 font-normal">Tags</th>
                      <th className="py-4 px-5 font-normal text-right">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNotes.map(note => {
                      const folder = folders.find(f => f.id === note.folder_id);
                      return (
                        <tr 
                          key={note.id}
                          onClick={() => handleOpenEditor(note)}
                          className={`border-b border-on-surface/10 hover:bg-on-surface/5 cursor-pointer transition-colors group note-color-${note.color}`}
                        >
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              {note.cover_image ? (
                                <img src={note.cover_image} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />
                              ) : note.icon ? (
                                <span className="text-[18px] leading-none flex-shrink-0">{note.icon}</span>
                              ) : (
                                <span className="material-symbols-outlined text-[18px] text-on-surface-variant/60 flex-shrink-0">description</span>
                              )}
                              <span className="font-body-md text-[14px] text-on-surface group-hover:text-primary-fixed-dim transition-colors font-medium truncate">
                                {note.title || 'Untitled Note'}
                              </span>
                              {note.pinned && <span className="material-symbols-outlined text-[14px] text-primary-fixed-dim flex-shrink-0" style={{fontVariationSettings: "'FILL' 1"}}>push_pin</span>}
                            </div>
                          </td>
                          <td className="py-4 px-5">
                            {folder ? (
                              <div className="flex items-center gap-1.5 text-[12px] text-on-surface-variant/80">
                                <span className="material-symbols-outlined text-[14px] opacity-70">{folder.icon}</span>
                                <span className="truncate">{folder.name}</span>
                              </div>
                            ) : (
                              <span className="text-[12px] text-on-surface-variant/60 italic">None</span>
                            )}
                          </td>
                          <td className="py-4 px-5">
                            <div className="flex flex-wrap gap-1.5">
                              {note.tags.slice(0, 2).map(t => (
                                <span key={t} className="px-1.5 py-0.5 rounded bg-surface-container-highest border border-on-surface/10 text-[9px] font-label-caps tracking-wider text-on-surface-variant whitespace-nowrap">#{t}</span>
                              ))}
                              {note.tags.length > 2 && (
                                <span className="px-1.5 py-0.5 rounded bg-surface-container-highest border border-on-surface/10 text-[9px] font-label-caps tracking-wider text-on-surface-variant whitespace-nowrap">+{note.tags.length - 2}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-5 text-right">
                            <span className="text-[11px] text-on-surface-variant/60 font-data-display tracking-widest whitespace-nowrap">
                              {new Date(note.updated_at).toLocaleDateString()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-10 pb-12">
                {showPinnedSection && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="material-symbols-outlined text-primary-fixed-dim text-[18px]" style={{fontVariationSettings: "'FILL' 1"}}>push_pin</span>
                      <h2 className="font-label-caps text-[11px] text-primary-fixed-dim tracking-widest font-bold">PINNED</h2>
                      <span className="text-[10px] text-primary-fixed-dim/50 ml-1">({pinnedNotes.length})</span>
                    </div>
                    {renderNotes(pinnedNotes)}
                  </div>
                )}

                {unpinnedNotes.length > 0 && (
                  <div>
                    {showPinnedSection && (
                      <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-on-surface-variant/80 text-[18px]">notes</span>
                        <h2 className="font-label-caps text-[11px] text-on-surface-variant/80 tracking-widest font-bold">ALL NOTES</h2>
                        <span className="text-[10px] text-on-surface-variant/70 ml-1">({unpinnedNotes.length})</span>
                      </div>
                    )}
                    {renderNotes(unpinnedNotes)}
                  </div>
                )}

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
