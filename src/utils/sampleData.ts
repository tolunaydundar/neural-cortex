export function createSampleLocalData(now = new Date()): Record<string, string> {
  const habit1Id = crypto.randomUUID();
  const habit2Id = crypto.randomUUID();
  const habit3Id = crypto.randomUUID();

  const dummyHabits = [
    { id: habit1Id, title: 'Meditation', icon: 'self_improvement', created_at: new Date(now.getTime() - 14 * 86400000).toISOString() },
    { id: habit2Id, title: 'Read 10 Pages', icon: 'menu_book', created_at: new Date(now.getTime() - 14 * 86400000).toISOString() },
    { id: habit3Id, title: 'Workout', icon: 'fitness_center', created_at: new Date(now.getTime() - 14 * 86400000).toISOString() },
  ];

  const dummyLogs = [];
  for (let i = 0; i < 14; i++) {
    const date = new Date(now.getTime() - i * 86400000);
    dummyLogs.push({ id: crypto.randomUUID(), habitId: habit1Id, date: date.toISOString() });
    if (i % 3 !== 0) dummyLogs.push({ id: crypto.randomUUID(), habitId: habit2Id, date: date.toISOString() });
    if (i % 2 === 0) dummyLogs.push({ id: crypto.randomUUID(), habitId: habit3Id, date: date.toISOString() });
  }

  const dummyTasks = [
    {
      id: crypto.randomUUID(),
      title: 'Review project roadmap',
      description: 'Go through Q3 objectives and prioritize deliverables.',
      priority: 'high',
      status: 'in_progress',
      category: 'Work',
      due_date: new Date(now.getTime() + 2 * 86400000).toISOString().slice(0, 10),
      created_at: new Date(now.getTime() - 5 * 86400000).toISOString(),
      completed_at: null,
      subtasks: [
        { id: crypto.randomUUID(), title: 'Gather team feedback', done: true },
        { id: crypto.randomUUID(), title: 'Draft timeline', done: false },
      ],
    },
    {
      id: crypto.randomUUID(),
      title: 'Buy groceries',
      description: '',
      priority: 'medium',
      status: 'todo',
      category: 'Personal',
      due_date: new Date(now.getTime() + 1 * 86400000).toISOString().slice(0, 10),
      created_at: new Date(now.getTime() - 1 * 86400000).toISOString(),
      completed_at: null,
      subtasks: [{ id: crypto.randomUUID(), title: 'Vegetables & fruits', done: false }],
    },
    {
      id: crypto.randomUUID(),
      title: 'Fix login page bug',
      description: 'Users report a flash of unstyled content on initial load.',
      priority: 'critical',
      status: 'todo',
      category: 'Work',
      due_date: new Date().toISOString().slice(0, 10),
      created_at: new Date(now.getTime() - 2 * 86400000).toISOString(),
      completed_at: null,
      subtasks: [],
    },
  ];

  const dummyNotes = [
    {
      id: crypto.randomUUID(),
      title: 'Neural Cortex Launch',
      content: '<h1>Launch Checklist</h1><ul><li>Verify database indexes</li><li>Check edge caching</li><li>Run full test suite</li></ul><p>Make sure to have the status page ready.</p>',
      tags: ['Work', 'Launch'],
      folder_id: null,
      format: 'html',
      color: 'blue',
      pinned: true,
      created_at: new Date(now.getTime() - 2 * 86400000).toISOString(),
      updated_at: new Date(now.getTime() - 1 * 86400000).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      title: 'Workout Regimen',
      content: '<p><strong>Monday:</strong> Push (Chest, Shoulders, Triceps)</p><p><strong>Wednesday:</strong> Pull (Back, Biceps)</p><p><strong>Friday:</strong> Legs (Quads, Hamstrings, Calves)</p>',
      tags: ['Personal', 'Fitness'],
      folder_id: null,
      format: 'html',
      color: 'green',
      pinned: false,
      created_at: new Date(now.getTime() - 10 * 86400000).toISOString(),
      updated_at: new Date(now.getTime() - 5 * 86400000).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      title: 'Idea: Quantum AI',
      content: '<p>What if we combine quantum annealing with transformers? Could we achieve exponential speedups in attention mechanism computations? Needs more research...</p>',
      tags: ['Research', 'Ideas'],
      folder_id: null,
      format: 'html',
      color: 'purple',
      pinned: false,
      created_at: new Date(now.getTime() - 20 * 86400000).toISOString(),
      updated_at: new Date(now.getTime() - 15 * 86400000).toISOString(),
    }
  ];

  return {
    nexus_habits: JSON.stringify(dummyHabits),
    nexus_logs: JSON.stringify(dummyLogs),
    nexus_tasks: JSON.stringify(dummyTasks),
    nexus_notes: JSON.stringify(dummyNotes),
  };
}
