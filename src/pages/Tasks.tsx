import { useState, useMemo } from 'react';
import { useTasks, type Task } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import TaskDetailModal from '../components/TaskDetailModal';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DndContext, DragOverlay, closestCorners, MouseSensor, TouchSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { usePageTitle } from '../utils/usePageTitle';

type StatusFilter = 'all' | 'active' | 'done';
type SortMode = 'priority' | 'due_date' | 'created' | 'custom';

function getPriorityValue(priority: Task['priority']): number {
  switch (priority) {
    case 'critical': return 0;
    case 'high': return 1;
    case 'medium': return 2;
    case 'low': return 3;
  }
}

function DraggableTask({ task, onClick, onToggleComplete }: { task: Task; onClick: (t: Task) => void; onToggleComplete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, isDragging, transform, transition } = useSortable({
    id: task.id,
    data: { task }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    touchAction: 'none'
  };

  return (
    // SAFE: Spread operators required by @dnd-kit
    <div ref={setNodeRef} {...listeners} {...attributes} style={style as React.CSSProperties}>
      <TaskCard task={task} onToggleComplete={onToggleComplete} onClick={onClick} />
    </div>
  );
}

function DroppableColumn({ id, title, icon, tasks, onToggleComplete, onClick }: { id: string, title: string, icon: string, tasks: Task[], onToggleComplete: (id: string) => void, onClick: (t: Task) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const { t } = useTranslation();
  
  return (
    <div 
      ref={setNodeRef} 
      className={`flex-1 min-w-[85vw] sm:min-w-[320px] shrink-0 snap-center flex flex-col rounded-md p-6 transition-all duration-300 border ${isOver ? 'bg-primary-fixed-dim/5 border-primary-fixed-dim/30' : 'bg-on-surface/5 border-on-surface/5 hover:bg-surface-container/50'}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <span className="material-symbols-outlined text-primary-fixed-dim text-[20px]">{icon}</span>
        <h2 className="font-label-caps text-[11px] text-on-surface font-bold tracking-widest">{title} ({tasks.length})</h2>
      </div>
      <SortableContext id={id} items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4 flex-grow min-h-[150px]">
          {tasks.map(t => (
            <DraggableTask key={t.id} task={t} onClick={onClick} onToggleComplete={onToggleComplete} />
          ))}
          {tasks.length === 0 && (
            <div className="h-full w-full flex items-center justify-center border-2 border-dashed border-on-surface/10 rounded-sm text-on-surface-variant/40 font-label-caps text-[10px] min-h-[120px] transition-colors">
              {t('tasks.drop_here')}
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function Tasks() {
  usePageTitle('Tasks');
  const { tasks, moveStatus, updateTask, getOverdueTasks, getCompletionStats } = useTasks();
  const { openAddTaskModal } = useOutletContext<{ openAddTaskModal: () => void; openAddModal: () => void }>();
  const { t } = useTranslation();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [sortMode, setSortMode] = useState<SortMode>('priority');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);
  const { userPreferences, updateUserPreferences } = useAuth();
  const viewMode = userPreferences.tasksViewMode || 'list';
  const setViewMode = (newMode: 'kanban' | 'list') => updateUserPreferences({ tasksViewMode: newMode });

  const overdue = getOverdueTasks();
  const stats7d = getCompletionStats(7);
  const todayCount = tasks.filter(t => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date);
    const now = new Date();
    return d.toDateString() === now.toDateString() && t.status !== 'done';
  }).length;

  const categories = useMemo(() => {
    const cats = new Set(tasks.map(t => t.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (statusFilter === 'active') {
      result = result.filter(t => t.status !== 'done');
    } else if (statusFilter === 'done') {
      result = result.filter(t => t.status === 'done');
    }

    if (categoryFilter) {
      result = result.filter(t => t.category === categoryFilter);
    }

    result.sort((a, b) => {
      if (sortMode === 'custom') return 0; // Maintain context order which is order ascending
      if (sortMode === 'priority') return getPriorityValue(a.priority) - getPriorityValue(b.priority);
      if (sortMode === 'due_date') {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [tasks, statusFilter, categoryFilter, sortMode]);

  const queuedTasks = filteredTasks.filter(t => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress');
  const doneTasks = filteredTasks.filter(t => t.status === 'done');

  const handleToggleComplete = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    moveStatus(id, task.status === 'done' ? 'todo' : 'done');
  };

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) setActiveDragTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragTask(null);
    const { active, over } = event;
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    if (activeId === overId) return;

    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    let targetStatus = activeTask.status;
    if (['todo', 'in_progress', 'done'].includes(overId)) {
      targetStatus = overId as Task['status'];
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) {
        targetStatus = overTask.status;
      }
    }

    if (sortMode !== 'custom' && !['todo', 'in_progress', 'done'].includes(overId)) {
      setSortMode('custom');
    }

    const targetColumnTasks = filteredTasks.filter(t => t.status === targetStatus);
    const oldIndex = targetColumnTasks.findIndex(t => t.id === activeId);
    const newIndex = targetColumnTasks.findIndex(t => t.id === overId);

    if (['todo', 'in_progress', 'done'].includes(overId)) {
      // Dropped on an empty column
      if (activeTask.status !== targetStatus) {
        updateTask(activeId, { status: targetStatus });
      }
      return;
    }

    let newOrder: number;
    if (oldIndex !== -1 && newIndex !== -1 && oldIndex < newIndex) {
      // Shifting down
      const prevNote = targetColumnTasks[newIndex];
      const nextNote = targetColumnTasks[newIndex + 1];
      if (!nextNote) {
        newOrder = (prevNote.order ?? new Date(prevNote.created_at).getTime()) + 10000;
      } else {
        newOrder = ((prevNote.order ?? new Date(prevNote.created_at).getTime()) + (nextNote.order ?? new Date(nextNote.created_at).getTime())) / 2;
      }
    } else {
      // Shifting up or moving from a different column
      const nextNote = targetColumnTasks[newIndex];
      const prevNote = newIndex > 0 ? targetColumnTasks[newIndex - 1] : undefined;
      if (!prevNote) {
        newOrder = (nextNote.order ?? new Date(nextNote.created_at).getTime()) - 10000;
      } else {
        newOrder = ((prevNote.order ?? new Date(prevNote.created_at).getTime()) + (nextNote.order ?? new Date(nextNote.created_at).getTime())) / 2;
      }
    }

    if (activeTask.status !== targetStatus) {
      updateTask(activeId, { status: targetStatus, order: newOrder });
    } else {
      updateTask(activeId, { order: newOrder });
    }
  };

  const liveSelectedTask = selectedTask ? tasks.find(t => t.id === selectedTask.id) : null;

  return (
    <div className="flex-grow space-y-8 max-w-[1400px] mx-auto w-full pb-24">
      <div className="mb-8 pt-8 lg:pt-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <div>
          <h1 className="font-headline-lg text-4xl sm:text-6xl text-on-surface font-bold tracking-tight">Tasks</h1>
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center items-start gap-1.5 sm:gap-3 mt-4 sm:mt-5 font-label-caps text-[11px] sm:text-[13px] text-on-surface-variant/80 tracking-wider">
            <span>{todayCount} DUE TODAY</span>
            <span className="hidden sm:block w-1.5 h-1.5 rounded-full bg-on-surface-variant/30"></span>
            <span className={overdue.length > 0 ? 'text-error font-bold' : ''}>{overdue.length} OVERDUE</span>
            <span className="hidden sm:block w-1.5 h-1.5 rounded-full bg-on-surface-variant/30"></span>
            <span>{stats7d.rate}% 7-DAY COMPLETION RATE</span>
          </div>
        </div>
        <button
          onClick={openAddTaskModal}
          className="flex items-center gap-2 px-6 py-3 bg-primary-fixed-dim text-background font-label-caps text-[12px] font-bold hover:bg-[#6ff6ff] transition-all cursor-pointer hover:shadow-[0_0_30px_rgba(0,220,230,0.5)] rounded-sm w-fit"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>NEW TASK</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8 w-full">
        {/* Status Segmented Control */}
        <div className="flex w-full sm:w-auto bg-on-surface/5 p-1 rounded-md border border-on-surface/10">
          <button 
            onClick={() => setStatusFilter('all')} 
            className={`flex-1 sm:flex-none px-5 py-2 rounded-sm text-[11px] font-label-caps transition-all ${statusFilter === 'all' ? 'bg-primary-fixed-dim text-background font-bold shadow-sm' : 'text-on-surface hover:bg-on-surface/10'}`}
          >
            {t('tasks.all')}
          </button>
          <button 
            onClick={() => setStatusFilter('active')} 
            className={`flex-1 sm:flex-none px-5 py-2 rounded-sm text-[11px] font-label-caps transition-all ${statusFilter === 'active' ? 'bg-primary-fixed-dim text-background font-bold shadow-sm' : 'text-on-surface hover:bg-on-surface/10'}`}
          >
            {t('tasks.active')}
          </button>
          <button 
            onClick={() => setStatusFilter('done')} 
            className={`flex-1 sm:flex-none px-5 py-2 rounded-sm text-[11px] font-label-caps transition-all ${statusFilter === 'done' ? 'bg-primary-fixed-dim text-background font-bold shadow-sm' : 'text-on-surface hover:bg-on-surface/10'}`}
          >
            {t('tasks.done')}
          </button>
        </div>
        
        <div className="hidden sm:block w-px h-6 bg-on-surface/10" />

        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <button 
              onClick={() => setCategoryFilter('')} 
              className={`flex-shrink-0 px-4 py-2 rounded-full border text-[11px] font-label-caps transition-all ${!categoryFilter ? 'bg-on-surface-variant/20 border-on-surface-variant/30 text-on-surface font-bold' : 'border-on-surface/10 bg-on-surface/5 text-on-surface hover:bg-on-surface/10'}`}
            >
              {t('tasks.all_categories')}
            </button>
            {categories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setCategoryFilter(cat === categoryFilter ? '' : cat)} 
                className={`flex-shrink-0 px-4 py-2 rounded-full border text-[11px] font-label-caps transition-all ${categoryFilter === cat ? 'bg-on-surface-variant/20 border-on-surface-variant/30 text-on-surface font-bold' : 'border-on-surface/10 bg-on-surface/5 text-on-surface hover:bg-on-surface/10'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
        
        <div className="flex-grow hidden sm:block" />
        
        <div className="hidden lg:flex items-center bg-on-surface/5 rounded-md p-1 border border-on-surface/10">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-sm transition-all flex items-center justify-center ${viewMode === 'list' ? 'bg-primary-fixed-dim text-background shadow-sm' : 'text-on-surface hover:bg-on-surface/10'}`}
            title="List View"
          >
            <span className="material-symbols-outlined text-[16px]">view_list</span>
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 rounded-sm transition-all flex items-center justify-center ${viewMode === 'kanban' ? 'bg-primary-fixed-dim text-background shadow-sm' : 'text-on-surface hover:bg-on-surface/10'}`}
            title="Kanban View"
          >
            <span className="material-symbols-outlined text-[16px]">view_kanban</span>
          </button>
        </div>

        <div className="relative group w-full sm:w-auto">
          <select 
            value={sortMode} 
            onChange={(e) => setSortMode(e.target.value as SortMode)} 
            className="w-full appearance-none bg-on-surface/5 border border-on-surface/5 px-6 py-2.5 pr-10 rounded-sm text-[11px] font-label-caps text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-fixed-dim cursor-pointer transition-all hover:bg-on-surface/10"
          >
            <option value="custom">SORT: CUSTOM</option>
            <option value="priority">SORT: PRIORITY</option>
            <option value="due_date">SORT: DUE DATE</option>
            <option value="created">SORT: NEWEST</option>
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[16px] pointer-events-none text-on-surface-variant">
            expand_more
          </span>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-on-surface/5 rounded-md p-16 flex flex-col items-center justify-center gap-6 text-center border border-on-surface/5">
          <button onClick={openAddTaskModal} className="w-20 h-20 rounded-full bg-primary-fixed-dim/10 text-primary-fixed-dim flex items-center justify-center hover:bg-primary-fixed-dim/20 transition-all cursor-pointer hover:scale-110 active:scale-95">
            <span className="material-symbols-outlined text-[40px]">add</span>
          </button>
          <h3 className="font-headline-sm text-2xl text-on-surface">No Tasks Deployed</h3>
          <p className="text-on-surface-variant/70 max-w-md">Your task matrix is empty. Start by adding a new objective to begin tracking your progress.</p>
        </div>
      ) : (
        <>
          {/* Desktop Kanban View */}
          <div className={`hidden ${viewMode === 'kanban' ? 'lg:block' : ''}`}>
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="flex flex-row gap-4 sm:gap-6 items-stretch w-full overflow-x-auto pb-6 custom-scrollbar snap-x snap-mandatory">
                {['all', 'active'].includes(statusFilter) && (
                  <DroppableColumn id="todo" title="QUEUED" icon="radio_button_unchecked" tasks={queuedTasks} onToggleComplete={handleToggleComplete} onClick={setSelectedTask} />
                )}
                {['all', 'active'].includes(statusFilter) && (
                  <DroppableColumn id="in_progress" title="IN PROGRESS" icon="pending" tasks={inProgressTasks} onToggleComplete={handleToggleComplete} onClick={setSelectedTask} />
                )}
                {['all', 'done'].includes(statusFilter) && (
                  <DroppableColumn id="done" title="DONE" icon="check_circle" tasks={doneTasks} onToggleComplete={handleToggleComplete} onClick={setSelectedTask} />
                )}
              </div>
              <DragOverlay>
                {activeDragTask ? <div className="opacity-80 scale-105 rotate-2 transition-all"><TaskCard task={activeDragTask} onToggleComplete={() => {}} onClick={() => {}} /></div> : null}
              </DragOverlay>
            </DndContext>
          </div>

          {/* List View (Always on mobile, or on desktop if viewMode === 'list') */}
          <div className={`flex flex-col gap-3 w-full ${viewMode === 'kanban' ? 'lg:hidden' : ''}`}>
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant font-label-caps text-xs">No tasks match your filters.</div>
            ) : (
              filteredTasks.map(t => (
                <TaskCard key={t.id} task={t} onToggleComplete={handleToggleComplete} onClick={setSelectedTask} />
              ))
            )}
          </div>
        </>
      )}

      {liveSelectedTask && <TaskDetailModal task={liveSelectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}
