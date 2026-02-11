
import { Task, Employee, TaskStatus, Priority, Space } from './types';

export const EMPLOYEES: Employee[] = [
  { id: 'emp-1', name: 'Alice Johnson', email: 'alice@example.com', avatarUrl: 'https://picsum.photos/seed/alice/40/40' },
  { id: 'emp-2', name: 'Bob Williams', email: 'bob@example.com', avatarUrl: 'https://picsum.photos/seed/bob/40/40' },
  { id: 'emp-3', name: 'Charlie Brown', email: 'charlie@example.com', avatarUrl: 'https://picsum.photos/seed/charlie/40/40' },
  { id: 'emp-4', name: 'Diana Miller', email: 'diana@example.com', avatarUrl: 'https://picsum.photos/seed/diana/40/40' },
];

export const INITIAL_SPACES: Space[] = [
  {
    id: 'space-1',
    name: 'Main HQ',
    joinCode: 'HQ-2024',
    ownerId: 'emp-1', // Alice owns it
    members: ['emp-1', 'emp-2', 'emp-3', 'emp-4'],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'space-2',
    name: 'Side Project',
    joinCode: 'SIDE-01',
    ownerId: 'emp-1',
    members: ['emp-1'],
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 1,
    spaceId: 'space-1',
    title: 'Design new landing page mockup',
    description: 'Create a high-fidelity mockup in Figma based on the new brand guidelines. Include mobile and desktop versions.',
    assigneeId: 'emp-1',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: TaskStatus.TODO,
    priority: Priority.HIGH,
    comments: [],
    subtasks: [
      { id: 'st-1', title: 'Gather assets', isCompleted: true },
      { id: 'st-2', title: 'Draft desktop view', isCompleted: false },
      { id: 'st-3', title: 'Draft mobile view', isCompleted: false },
    ],
    tags: ['Design', 'UI/UX'],
    timeLogs: [],
    timerStartTime: null,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    spaceId: 'space-1',
    title: 'Develop API for user authentication',
    description: 'Set up JWT-based authentication endpoints: /login, /register, /logout. Use bcrypt for password hashing.',
    assigneeId: 'emp-2',
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: TaskStatus.IN_PROGRESS,
    priority: Priority.URGENT,
    comments: [],
    subtasks: [],
    tags: ['Backend', 'Security', 'API'],
    timeLogs: [
      { id: 'tl-1', startTime: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), endTime: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), duration: 2 * 3600 * 1000 }
    ],
    timerStartTime: null,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    spaceId: 'space-1',
    title: 'Write blog post about Q3 results',
    description: 'Draft a 1000-word blog post summarizing the key achievements and financial results from the third quarter.',
    assigneeId: 'emp-3',
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: TaskStatus.DONE,
    priority: Priority.MEDIUM,
    comments: [],
    subtasks: [],
    tags: ['Marketing', 'Content'],
    timeLogs: [],
    timerStartTime: null,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    spaceId: 'space-1',
    title: 'Fix bug in payment processing',
    description: 'Users are reporting a 500 error when using PayPal. Investigate logs and resolve the issue.',
    assigneeId: 'emp-2',
    dueDate: new Date().toISOString().split('T')[0],
    status: TaskStatus.IN_PROGRESS,
    priority: Priority.URGENT,
    comments: [],
    subtasks: [],
    tags: ['Bug', 'Critical', 'Payments'],
    timeLogs: [],
    timerStartTime: new Date().toISOString(), // Currently tracking
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    spaceId: 'space-1',
    title: 'Plan team offsite event',
    description: 'Research venues, get quotes for catering, and create a schedule of activities for the annual team offsite.',
    assigneeId: 'emp-4',
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: TaskStatus.TODO,
    priority: Priority.LOW,
    comments: [],
    subtasks: [],
    tags: ['HR', 'Event'],
    timeLogs: [],
    timerStartTime: null,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 6,
    spaceId: 'space-1',
    title: 'Deploy authentication API to staging',
    description: 'Once the API is developed, deploy it to the staging environment for QA testing.',
    assigneeId: 'emp-2',
    dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: TaskStatus.TODO,
    priority: Priority.HIGH,
    comments: [],
    subtasks: [],
    tags: ['DevOps', 'Deployment'],
    timeLogs: [],
    timerStartTime: null,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    blockedById: 2, // Blocked by task 2
  }
];

export const TASK_STATUSES = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE];

export const PRIORITIES = [Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.URGENT];
