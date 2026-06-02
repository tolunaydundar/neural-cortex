import { useState, useMemo } from 'react';
import { useHabits } from '../context/HabitContext';
import { useTasks } from '../context/TaskContext';
import { useNotes } from '../context/NoteContext';
import { isSameDay } from 'date-fns';

type TypeFilter = 'all' | 'habits' | 'tasks' | 'notes';
type TimelineEntry = {
  id: string;
  type: 'habit_log' | 'task_completed' | 'task_created' | 'note_created';
  title: string;
  icon: string;
  date: Date;
  priority?: string;
  category?: string;
};

const PAGE_SIZE = 30;

export default function LegacyLogs() {
  const { logs, habits } = useHabits();
  const { tasks } = useTasks();
  const { notes } = useNotes();

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Build combined timeline
  const allEntries = useMemo((): TimelineEntry[] => {
    const entries: TimelineEntry[] = [];

    // Habit log entries
    logs.forEach(log => {
      const habit = habits.find(h => h.id === log.habitId);
      entries.push({
        id: `h-${log.id}`,
        type: 'habit_log',
        title: habit?.title || 'Unknown Habit',
        icon: habit?.icon || 'check_circle',
        date: new Date(log.date),
      });
    });

    // Task completion entries
    tasks.forEach(task => {
      if (task.completed_at) {
        entries.push({
          id: `tc-${task.id}`,
          type: 'task_completed',
          title: task.title,
          icon: 'task_alt',
          date: new Date(task.completed_at),
          priority: task.priority,
          category: task.category,
        });
      }

      // Task creation entries
      entries.push({
        id: `tn-${task.id}`,
        type: 'task_created',
        title: task.title,
        icon: 'add_circle',
        date: new Date(task.created_at),
        priority: task.priority,
        category: task.category,
      });
    });

    // Note creation entries
    notes.forEach(note => {
      entries.push({
        id: `n-${note.id}`,
        type: 'note_created',
        title: note.title || 'Untitled Note',
        icon: 'edit_document',
        date: new Date(note.created_at),
        category: note.tags?.[0] || 'Uncategorized',
      });
    });

    // Sort by date descending
    entries.sort((a, b) => b.date.getTime() - a.date.getTime());

    return entries;
  }, [logs, habits, tasks, notes]);

  // Apply filters
  const filteredEntries = useMemo(() => {
    let result = allEntries;

    // Type filter
    if (typeFilter === 'habits') {
      result = result.filter(e => e.type === 'habit_log');
    } else if (typeFilter === 'tasks') {
      result = result.filter(e => e.type === 'task_completed' || e.type === 'task_created');
    } else if (typeFilter === 'notes') {
      result = result.filter(e => e.type === 'note_created');
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => e.title.toLowerCase().includes(q));
    }

    // Date range
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter(e => e.date >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(e => e.date <= to);
    }

    return result;
  }, [allEntries, typeFilter, searchQuery, dateFrom, dateTo]);

  const visibleEntries = filteredEntries.slice(0, visibleCount);
  const hasMore = visibleCount < filteredEntries.length;

  // Stats
  const habitLogCount = allEntries.filter(e => e.type === 'habit_log').length;
  const taskCompletedCount = allEntries.filter(e => e.type === 'task_completed').length;
  const noteCreatedCount = allEntries.filter(e => e.type === 'note_created').length;
  const allDates = allEntries.map(e => e.date.getTime());
  const earliestDate = allDates.length > 0 ? new Date(Math.min(...allDates)) : null;

  // Group entries by date for timeline display
  const groupedEntries = useMemo(() => {
    const groups: { date: Date; entries: TimelineEntry[] }[] = [];
    let currentGroup: { date: Date; entries: TimelineEntry[] } | null = null;

    visibleEntries.forEach(entry => {
      if (!currentGroup || !isSameDay(currentGroup.date, entry.date)) {
        currentGroup = { date: entry.date, entries: [] };
        groups.push(currentGroup);
      }
      currentGroup.entries.push(entry);
    });

    return groups;
  }, [visibleEntries]);

  const getEntryLabel = (type: TimelineEntry['type']) => {
    switch (type) {
      case 'habit_log': return 'LOGGED';
      case 'task_completed': return 'COMPLETED';
      case 'task_created': return 'CREATED';
      case 'note_created': return 'CREATED';
    }
  };

  const getEntryColor = (type: TimelineEntry['type']) => {
    switch (type) {
      case 'habit_log': return 'text-primary-fixed-dim';
      case 'task_completed': return 'text-primary-fixed-dim';
      case 'note_created': return 'text-primary-fixed-dim';
      case 'task_created': return 'text-on-surface-variant/60';
    }
  };

  const formatDateHeader = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diff = Math.round((today.getTime() - target.getTime()) / 86400000);

    if (diff === 0) return 'TODAY';
    if (diff === 1) return 'YESTERDAY';
    if (diff < 7) return `${diff} DAYS AGO`;
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
  };

  return (
    <div className="flex-grow space-y-8 max-w-[1200px] mx-auto w-full pb-24">
      {/* Massive Header */}
      <div className="mb-8 pt-8 lg:pt-12">
        <h1 className="font-headline-lg text-4xl sm:text-6xl text-on-surface font-bold tracking-tight">Timeline</h1>
        <div className="flex flex-wrap items-center gap-3 mt-5 font-label-caps text-[11px] sm:text-[13px] text-on-surface-variant/80 tracking-wider">
          <span>{allEntries.length} TOTAL ENTRIES</span>
          <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/30"></span>
          <span>{habitLogCount} HABITS LOGGED</span>
          <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/30"></span>
          <span>{taskCompletedCount} TASKS DONE</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-on-surface/5 rounded-md p-6 lg:p-8 text-center border border-on-surface/5">
          <p className="font-label-caps text-[11px] text-on-surface-variant mb-2">HABITS LOGGED</p>
          <p className="font-data-display text-4xl text-primary-fixed-dim">{habitLogCount}</p>
        </div>
        <div className="bg-on-surface/5 rounded-md p-6 lg:p-8 text-center border border-on-surface/5">
          <p className="font-label-caps text-[11px] text-on-surface-variant mb-2">TASKS COMPLETED</p>
          <p className="font-data-display text-4xl text-primary-fixed-dim">{taskCompletedCount}</p>
        </div>
        <div className="bg-on-surface/5 rounded-md p-6 lg:p-8 text-center border border-on-surface/5">
          <p className="font-label-caps text-[11px] text-on-surface-variant mb-2">NOTES CREATED</p>
          <p className="font-data-display text-4xl text-primary-fixed-dim">{noteCreatedCount}</p>
        </div>
        <div className="bg-on-surface/5 rounded-md p-6 lg:p-8 text-center border border-on-surface/5">
          <p className="font-label-caps text-[11px] text-on-surface-variant mb-2">TRACKING SINCE</p>
          <p className="font-data-display text-2xl lg:text-3xl text-on-surface font-bold mt-2">
            {earliestDate ? earliestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase() : '—'}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <button
          onClick={() => setTypeFilter('all')}
          className={`px-5 py-2.5 rounded-sm text-[11px] font-label-caps transition-all ${typeFilter === 'all' ? 'bg-primary-fixed-dim text-background font-bold' : 'bg-on-surface/5 text-on-surface hover:bg-on-surface/10'}`}
        >ALL</button>
        <button
          onClick={() => setTypeFilter('habits')}
          className={`px-5 py-2.5 rounded-sm text-[11px] font-label-caps transition-all ${typeFilter === 'habits' ? 'bg-primary-fixed-dim text-background font-bold' : 'bg-on-surface/5 text-on-surface hover:bg-on-surface/10'}`}
        >HABITS</button>
        <button
          onClick={() => setTypeFilter('tasks')}
          className={`px-5 py-2.5 rounded-sm text-[11px] font-label-caps transition-all ${typeFilter === 'tasks' ? 'bg-primary-fixed-dim text-background font-bold' : 'bg-on-surface/5 text-on-surface hover:bg-on-surface/10'}`}
        >TASKS</button>
        <button
          onClick={() => setTypeFilter('notes')}
          className={`px-5 py-2.5 rounded-sm text-[11px] font-label-caps transition-all ${typeFilter === 'notes' ? 'bg-primary-fixed-dim text-background font-bold' : 'bg-on-surface/5 text-on-surface hover:bg-on-surface/10'}`}
        >NOTES</button>

        <div className="w-px h-6 bg-on-surface/10 mx-2" />

        {/* Date range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="appearance-none bg-on-surface/5 border border-on-surface/5 px-4 py-2.5 rounded-sm text-[11px] font-label-caps text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-fixed-dim cursor-pointer transition-all hover:bg-on-surface/10 [color-scheme:dark] w-32"
            placeholder="From"
          />
          <span className="text-on-surface-variant/30 text-xs">→</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="appearance-none bg-on-surface/5 border border-on-surface/5 px-4 py-2.5 rounded-sm text-[11px] font-label-caps text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-fixed-dim cursor-pointer transition-all hover:bg-on-surface/10 [color-scheme:dark] w-32"
            placeholder="To"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="w-10 h-10 rounded-sm bg-error/10 text-error flex items-center justify-center hover:bg-error/20 transition-colors cursor-pointer ml-1"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        <div className="flex-grow" />

        {/* Search */}
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[18px]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search timeline..."
            className="bg-on-surface/5 border border-on-surface/5 pl-12 pr-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-fixed-dim rounded-sm w-48 lg:w-64 transition-all hover:bg-on-surface/10 placeholder:text-on-surface-variant/50"
          />
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-2">
        <p className="font-label-caps text-[10px] text-on-surface-variant/60 tracking-wider">
          SHOWING {visibleEntries.length} OF {filteredEntries.length} ENTRIES
        </p>
      </div>

      {/* Timeline */}
      {filteredEntries.length === 0 ? (
        <div className="bg-on-surface/5 rounded-md p-16 flex flex-col items-center justify-center gap-6 text-center border border-on-surface/5">
          <span className="material-symbols-outlined text-[60px] text-on-surface-variant/20">history</span>
          <h3 className="font-headline-sm text-2xl text-on-surface">No Entries Found</h3>
          <p className="text-on-surface-variant/70 max-w-md">
            {allEntries.length === 0
              ? 'Start logging habits and completing tasks to see your activity history here.'
              : 'No entries match the current filters. Try adjusting your search or date range.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-8 bg-on-surface/5 rounded-md p-6 lg:p-8 border border-on-surface/5">
          {groupedEntries.map((group, groupIdx) => (
            <div key={group.date.toISOString()} className={groupIdx !== 0 ? 'pt-6 border-t border-on-surface/10' : ''}>
              {/* Date header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-2.5 h-2.5 bg-primary-fixed-dim rounded-full" />
                <h3 className="font-label-caps text-[11px] text-on-surface font-bold tracking-widest uppercase">
                  {formatDateHeader(group.date)}
                </h3>
                <div className="flex-grow h-px bg-on-surface/10" />
                <span className="font-label-caps text-[10px] text-on-surface-variant/60">
                  {group.entries.length} {group.entries.length === 1 ? 'ENTRY' : 'ENTRIES'}
                </span>
              </div>

              {/* Entries */}
              <div className="space-y-1.5 ml-1.5 border-l border-on-surface/10 pl-6">
                {group.entries.map(entry => (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-4 py-3 px-4 hover:bg-on-surface/5 transition-colors rounded-sm ${
                      entry.type === 'task_created' ? 'opacity-50' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-on-surface/5 ${
                      entry.type === 'task_completed' || entry.type === 'habit_log' || entry.type === 'note_created' 
                        ? 'text-primary-fixed-dim bg-primary-fixed-dim/10' 
                        : 'text-on-surface-variant'
                    }`}>
                      <span className="material-symbols-outlined text-[16px]"
                        style={entry.type === 'task_completed' || entry.type === 'habit_log' || entry.type === 'note_created' ? {fontVariationSettings: "'FILL' 1"} : undefined}
                      >
                        {entry.icon}
                      </span>
                    </div>
                    
                    <span className="text-base font-medium text-on-surface flex-grow truncate">{entry.title}</span>
                    
                    <div className="hidden md:flex items-center gap-3">
                      {entry.category && (
                        <span className="px-2 py-1 bg-on-surface/5 rounded-md text-[10px] font-label-caps text-on-surface-variant">{entry.category}</span>
                      )}
                      {entry.priority && entry.type === 'task_completed' && (
                        <div className={`w-2 h-2 rounded-full priority-dot-${entry.priority}`} />
                      )}
                    </div>
                    
                    <span className={`font-label-caps text-[9px] tracking-wider w-20 text-right ${getEntryColor(entry.type)}`}>
                      {getEntryLabel(entry.type)}
                    </span>
                    <span className="font-data-display text-[11px] font-bold text-on-surface-variant/60 w-16 text-right">
                      {entry.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="text-center pt-8 border-t border-on-surface/10">
              <button
                onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                className="px-8 py-3 bg-primary-fixed-dim/10 text-primary-fixed-dim font-label-caps text-[11px] font-bold rounded-sm hover:bg-primary-fixed-dim/20 transition-all cursor-pointer tracking-widest"
              >
                LOAD MORE ({filteredEntries.length - visibleCount} REMAINING)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
