import { useState, useMemo } from 'react';
import { useTasks, type Task } from '../context/TaskContext';
import TaskCard from '../components/TaskCard';
import TaskDetailModal from '../components/TaskDetailModal';
import { useOutletContext } from 'react-router-dom';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';

type StatusFilter = 'all' | 'active' | 'done';
type SortMode = 'priority' | 'due_date' | 'created';

function getPriorityValue(priority: Task['priority']): number {
  switch (priority) {
    case 'critical': return 0;
    case 'high': return 1;
    case 'medium': return 2;
    case 'low': return 3;
  }
}

function DraggableTask({ task, onClick, onToggleComplete }: { task: Task; onClick: (t: Task) => void; onToggleComplete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task }
  });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={{ opacity: isDragging ? 0.4 : 1, touchAction: 'none' }}>
      <TaskCard task={task} onToggleComplete={onToggleComplete} onClick={onClick} />
    </div>
  );
}

function DroppableColumn({ id, title, icon, tasks, onToggleComplete, onClick }: { id: string, title: string, icon: string, tasks: Task[], onToggleComplete: (id: string) => void, onClick: (t: Task) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  
  return (
    <div 
      ref={setNodeRef} 
      className={`flex-1 min-w-[300px] flex flex-col rounded-xl p-4 transition-colors duration-200 border ${isOver ? 'bg-primary-fixed-dim/10 border-primary-fixed-dim/30' : 'bg-surface-container/20 border-outline/10'}`}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary-fixed-dim text-[16px]">{icon}</span>
        <h2 className="font-label-caps text-[10px] text-primary-fixed-dim tracking-widest">{title} ({tasks.length})</h2>
      </div>
      <div className="space-y-3 flex-grow min-h-[150px]">
        {tasks.map(t => (
          <DraggableTask key={t.id} task={t} onClick={onClick} onToggleComplete={onToggleComplete} />
        ))}
        {tasks.length === 0 && (
          <div className="h-full w-full flex items-center justify-center border-2 border-dashed border-outline/10 rounded-lg text-on-surface-variant/40 font-label-caps text-[9px] min-h-[100px]">
            DROP HERE
          </div>
        )}
      </div>
    </div>
  );
}

export default function Tasks() {
  const { tasks, moveStatus, getOverdueTasks, getCompletionStats } = useTasks();
  const { openAddTaskModal } = useOutletContext<{ openAddTaskModal: () => void; openAddModal: () => void }>();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [sortMode, setSortMode] = useState<SortMode>('priority');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);

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
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
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
    
    const taskId = active.id as string;
    const newStatus = over.id as Task['status'];
    
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      moveStatus(taskId, newStatus);
    }
  };

  const liveSelectedTask = selectedTask ? tasks.find(t => t.id === selectedTask.id) : null;

  return (
    <div className="flex-grow space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile lg:text-headline-lg text-primary-fixed-dim">Task Matrix</h1>
          <p className="text-on-surface-variant font-label-caps text-[10px] mt-1">MISSION CONTROL & OBJECTIVE MANAGEMENT</p>
        </div>
        <button
          onClick={openAddTaskModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary-fixed-dim text-background font-label-caps text-xs hover:bg-[#6ff6ff] transition-colors cursor-pointer shadow-[0_0_15px_rgba(0,220,230,0.4)] hover:shadow-[0_0_20px_rgba(0,220,230,0.6)] rounded-sm w-fit"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          <span>NEW TASK</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="glass-panel p-3 lg:p-4 text-center">
          <p className="font-label-caps text-[9px] text-on-surface-variant mb-1">TODAY'S TASKS</p>
          <p className="font-data-display text-xl lg:text-2xl text-primary-fixed-dim">{todayCount}</p>
        </div>
        <div className="glass-panel p-3 lg:p-4 text-center">
          <p className="font-label-caps text-[9px] text-on-surface-variant mb-1">OVERDUE</p>
          <p className={`font-data-display text-xl lg:text-2xl ${overdue.length > 0 ? 'text-error' : 'text-primary-fixed-dim'}`}>{overdue.length}</p>
        </div>
        <div className="glass-panel p-3 lg:p-4 text-center">
          <p className="font-label-caps text-[9px] text-on-surface-variant mb-1">7-DAY RATE</p>
          <p className="font-data-display text-xl lg:text-2xl text-primary-fixed-dim">{stats7d.rate}%</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setStatusFilter('all')} className={`filter-pill ${statusFilter === 'all' ? 'active' : ''}`}>ALL</button>
        <button onClick={() => setStatusFilter('active')} className={`filter-pill ${statusFilter === 'active' ? 'active' : ''}`}>ACTIVE</button>
        <button onClick={() => setStatusFilter('done')} className={`filter-pill ${statusFilter === 'done' ? 'active' : ''}`}>DONE</button>
        
        <div className="w-px h-4 bg-white/10 mx-1" />

        {categories.length > 0 && (
          <>
            <button onClick={() => setCategoryFilter('')} className={`filter-pill ${!categoryFilter ? 'active' : ''}`}>ALL CATEGORIES</button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat === categoryFilter ? '' : cat)} className={`filter-pill ${categoryFilter === cat ? 'active' : ''}`}>{cat}</button>
            ))}
          </>
        )}
        
        <div className="flex-grow" />
        
        <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)} className="bg-surface-container-lowest border border-white/10 px-2 py-1 text-[10px] font-label-caps text-on-surface-variant focus:outline-none focus:border-primary-fixed-dim cursor-pointer rounded-sm">
          <option value="priority">SORT: PRIORITY</option>
          <option value="due_date">SORT: DUE DATE</option>
          <option value="created">SORT: NEWEST</option>
        </select>
      </div>

      {tasks.length === 0 ? (
        <div className="glass-panel p-12 flex flex-col items-center justify-center gap-4 text-center">
          <button onClick={openAddTaskModal} className="material-symbols-outlined text-6xl text-primary-fixed-dim/20 hover:text-primary-fixed-dim transition-colors cursor-pointer outline-none focus:outline-none hover:scale-110 active:scale-95">add_circle</button>
          <h3 className="font-headline-sm text-headline-sm text-on-surface-variant">NO TASKS DEPLOYED</h3>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex flex-col lg:flex-row gap-6 items-stretch w-full overflow-x-auto pb-4 custom-scrollbar">
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
            {activeDragTask ? <TaskCard task={activeDragTask} onToggleComplete={() => {}} onClick={() => {}} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {liveSelectedTask && <TaskDetailModal task={liveSelectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}
