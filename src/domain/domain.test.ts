import test from 'node:test';
import assert from 'node:assert/strict';
import { getPriorityValue, sortTasksByOrder, type Task } from './tasks.ts';
import { getAllNoteTags, sortNotes, type Note } from './notes.ts';
import { sortHabitsByCreatedAt, type Habit } from './habits.ts';

test('task priority values sort critical work first', () => {
  assert.equal(getPriorityValue('critical'), 0);
  assert.equal(getPriorityValue('low'), 3);
});

test('tasks sort by explicit order before created date fallback', () => {
  const tasks = [
    task({ id: 'b', order: 20, created_at: '2026-01-01T00:00:00.000Z' }),
    task({ id: 'a', order: 10, created_at: '2026-01-02T00:00:00.000Z' }),
    task({ id: 'c', created_at: '2026-01-03T00:00:00.000Z' }),
  ];

  assert.deepEqual(sortTasksByOrder(tasks).map(item => item.id), ['a', 'b', 'c']);
});

test('note tags are unique and alphabetical', () => {
  const notes = [
    note({ id: '1', tags: ['work', 'ideas'] }),
    note({ id: '2', tags: ['ideas', 'archive'] }),
  ];

  assert.deepEqual(getAllNoteTags(notes), ['archive', 'ideas', 'work']);
});

test('notes sort by updated date when requested', () => {
  const notes = [
    note({ id: 'old', updated_at: '2026-01-01T00:00:00.000Z' }),
    note({ id: 'new', updated_at: '2026-01-03T00:00:00.000Z' }),
  ];

  assert.deepEqual(sortNotes(notes, 'updated').map(item => item.id), ['new', 'old']);
});

test('habits sort by creation date ascending', () => {
  const habits = [
    habit({ id: 'late', created_at: '2026-01-03T00:00:00.000Z' }),
    habit({ id: 'early', created_at: '2026-01-01T00:00:00.000Z' }),
  ];

  assert.deepEqual(sortHabitsByCreatedAt(habits).map(item => item.id), ['early', 'late']);
});

function task(overrides: Partial<Task>): Task {
  return {
    id: 'task',
    title: 'Task',
    description: '',
    priority: 'medium',
    status: 'todo',
    category: '',
    due_date: null,
    created_at: '2026-01-01T00:00:00.000Z',
    completed_at: null,
    subtasks: [],
    userId: 'user',
    ...overrides,
  };
}

function note(overrides: Partial<Note>): Note {
  return {
    id: 'note',
    title: 'Note',
    content: '',
    tags: [],
    folder_id: null,
    color: 'default',
    pinned: false,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    userId: 'user',
    ...overrides,
  };
}

function habit(overrides: Partial<Habit>): Habit {
  return {
    id: 'habit',
    title: 'Habit',
    icon: 'check',
    created_at: '2026-01-01T00:00:00.000Z',
    userId: 'user',
    ...overrides,
  };
}
