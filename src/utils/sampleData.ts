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

  return {
    nexus_habits: JSON.stringify(dummyHabits),
    nexus_logs: JSON.stringify(dummyLogs),
    nexus_tasks: JSON.stringify(dummyTasks),
  };
}
