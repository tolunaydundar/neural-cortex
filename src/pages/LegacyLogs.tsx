import { useState, useMemo } from 'react';
import { useHabits } from '../context/HabitContext';
import { useTasks } from '../context/TaskContext';
import { isSameDay } from 'date-fns';

type TypeFilter = 'all' | 'habits' | 'tasks';
type TimelineEntry = {
  id: string;
  type: 'habit_log' | 'task_completed' | 'task_created';
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

    // Sort by date descending
    entries.sort((a, b) => b.date.getTime() - a.date.getTime());

    return entries;
  }, [logs, habits, tasks]);

  // Apply filters
  const filteredEntries = useMemo(() => {
    let result = allEntries;

    // Type filter
    if (typeFilter === 'habits') {
      result = result.filter(e => e.type === 'habit_log');
    } else if (typeFilter === 'tasks') {
      result = result.filter(e => e.type === 'task_completed' || e.type === 'task_created');
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
    }
  };

  const getEntryColor = (type: TimelineEntry['type']) => {
    switch (type) {
      case 'habit_log': return 'text-primary-fixed-dim';
      case 'task_completed': return 'text-primary-fixed-dim';
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
    <div className="flex-grow space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg text-primary-fixed-dim">Legacy Logs</h1>
        <p className="text-on-surface-variant font-label-caps text-[10px] mt-1">COMPREHENSIVE ACTIVITY ARCHIVE</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-panel p-3 lg:p-4 text-center">
          <p className="font-label-caps text-[9px] text-on-surface-variant mb-1">TOTAL ENTRIES</p>
          <p className="font-data-display text-xl lg:text-2xl text-primary-fixed-dim">{allEntries.length}</p>
        </div>
        <div className="glass-panel p-3 lg:p-4 text-center">
          <p className="font-label-caps text-[9px] text-on-surface-variant mb-1">HABITS LOGGED</p>
          <p className="font-data-display text-xl lg:text-2xl text-primary-fixed-dim">{habitLogCount}</p>
        </div>
        <div className="glass-panel p-3 lg:p-4 text-center">
          <p className="font-label-caps text-[9px] text-on-surface-variant mb-1">TASKS COMPLETED</p>
          <p className="font-data-display text-xl lg:text-2xl text-primary-fixed-dim">{taskCompletedCount}</p>
        </div>
        <div className="glass-panel p-3 lg:p-4 text-center">
          <p className="font-label-caps text-[9px] text-on-surface-variant mb-1">TRACKING SINCE</p>
          <p className="font-data-display text-sm lg:text-base text-primary-fixed-dim">
            {earliestDate ? earliestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase() : '—'}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Type filter */}
        <button
          onClick={() => setTypeFilter('all')}
          className={`filter-pill ${typeFilter === 'all' ? 'active' : ''}`}
        >ALL</button>
        <button
          onClick={() => setTypeFilter('habits')}
          className={`filter-pill ${typeFilter === 'habits' ? 'active' : ''}`}
        >HABITS</button>
        <button
          onClick={() => setTypeFilter('tasks')}
          className={`filter-pill ${typeFilter === 'tasks' ? 'active' : ''}`}
        >TASKS</button>

        <div className="w-px h-4 bg-white/10 mx-1" />

        {/* Date range */}
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-surface-container-lowest border border-white/10 px-2 py-1 text-[10px] font-label-caps text-on-surface-variant focus:outline-none focus:border-primary-fixed-dim cursor-pointer rounded-sm [color-scheme:dark] w-28"
            placeholder="From"
          />
          <span className="text-on-surface-variant/30 text-xs">→</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-surface-container-lowest border border-white/10 px-2 py-1 text-[10px] font-label-caps text-on-surface-variant focus:outline-none focus:border-primary-fixed-dim cursor-pointer rounded-sm [color-scheme:dark] w-28"
            placeholder="To"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="text-on-surface-variant/50 hover:text-error transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
        </div>

        <div className="flex-grow" />

        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant/30 text-[14px]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="bg-surface-container-lowest border border-white/10 pl-7 pr-3 py-1 text-xs text-on-surface focus:outline-none focus:border-primary-fixed-dim rounded-sm w-36 lg:w-48"
          />
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="font-label-caps text-[9px] text-on-surface-variant/60">
          SHOWING {visibleEntries.length} OF {filteredEntries.length} ENTRIES
        </p>
      </div>

      {/* Timeline */}
      {filteredEntries.length === 0 ? (
        <div className="glass-panel p-12 flex flex-col items-center justify-center gap-4 text-center">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/20">history</span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface-variant">NO ENTRIES FOUND</h3>
          <p className="text-sm text-on-surface-variant/60 max-w-md">
            {allEntries.length === 0
              ? 'Start logging habits and completing tasks to see your activity history here.'
              : 'No entries match the current filters. Try adjusting your search or date range.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedEntries.map(group => (
            <div key={group.date.toISOString()}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 bg-primary-fixed-dim/40 rounded-full" />
                <h3 className="font-label-caps text-[10px] text-primary-fixed-dim/70 tracking-widest">
                  {formatDateHeader(group.date)}
                </h3>
                <div className="flex-grow h-px bg-white/5" />
                <span className="font-label-caps text-[9px] text-on-surface-variant/40">
                  {group.entries.length} {group.entries.length === 1 ? 'ENTRY' : 'ENTRIES'}
                </span>
              </div>

              {/* Entries */}
              <div className="space-y-1 ml-1 border-l border-white/5 pl-4">
                {group.entries.map(entry => (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-3 py-2.5 px-3 hover:bg-white/3 transition-colors rounded-sm ${
                      entry.type === 'task_created' ? 'opacity-50' : ''
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[16px] ${getEntryColor(entry.type)}`}
                      style={entry.type === 'task_completed' || entry.type === 'habit_log' ? {fontVariationSettings: "'FILL' 1"} : undefined}
                    >
                      {entry.icon}
                    </span>
                    <span className="text-sm text-on-surface flex-grow truncate">{entry.title}</span>
                    {entry.category && (
                      <span className="category-chip hidden sm:inline-flex">{entry.category}</span>
                    )}
                    {entry.priority && entry.type === 'task_completed' && (
                      <div className={`w-2 h-2 rounded-full priority-dot-${entry.priority} hidden sm:block`} />
                    )}
                    <span className={`font-label-caps text-[8px] tracking-wider ${getEntryColor(entry.type)}`}>
                      {getEntryLabel(entry.type)}
                    </span>
                    <span className="font-data-display text-[10px] text-on-surface-variant/40 w-14 text-right">
                      {entry.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="text-center py-4">
              <button
                onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                className="px-6 py-2 border border-primary-fixed-dim/30 text-primary-fixed-dim font-label-caps text-[10px] hover:bg-primary-fixed-dim/10 transition-colors cursor-pointer tracking-widest"
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
