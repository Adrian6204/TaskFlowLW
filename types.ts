
export enum TaskStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  DONE = 'Done',
}

export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent',
}

export enum Position {
  FOUNDER_AND_CEO = 'Founder and CEO',
  MANAGING_DIRECTOR = 'Managing Director',
  ADMIN = 'Admin',
  HR_ASSISTANT = 'HR Assistant',
  PRODUCTION_SUPPORT = 'Production Support',
  ADMIN_AND_RESEARCH_ASSISTANT = 'Admin and Research Assistant',
  AI_EXECUTIVE = 'AI Executive',
  AIE_ASSISTANT = 'AIE Assistant',
  PROJECT_COORDINATOR = 'Project Coordinator',
  ADMIN_ACCOUNTING = 'Admin Accounting',
  IT_EXECUTIVE_ASSISTANT = 'IT Executive Assistant',
  IT_ASSISTANT = 'IT Assistant',
}

export interface Employee {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  avatarUrl: string;
  position?: Position | string; // Optional for backward compatibility
  phone?: string;
  role?: 'admin' | 'member';
  isSuperAdmin?: boolean;
}

export interface EmployeeWithRole extends Employee {
  spaceId: string;
  spaceName: string;
  role: 'admin' | 'member';
  isSuperAdmin: boolean;
}

export interface Comment {
  id: number;
  authorId: string;
  content: string;
  timestamp: string; // ISO 8601 string
}

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface TimeLogEntry {
  id: string;
  startTime: string; // ISO 8601 string
  endTime: string; // ISO 8601 string
  duration: number; // milliseconds
}

export interface Task {
  id: number;
  spaceId: string; // Link to specific space
  title: string;
  description: string;
  assigneeId: string;
  dueDate: string; // YYYY-MM-DD
  status: TaskStatus;
  priority: Priority;
  comments: Comment[];
  subtasks: Subtask[];
  tags: string[];
  timeLogs: TimeLogEntry[];
  timerStartTime?: string | null;
  createdAt: string;
  completedAt?: string | null;
  blockedById?: number | null;
  listId?: number | null;
  isUnplanned?: boolean;
  updated_at?: string;
}

export interface Space {
  id: string;
  name: string;
  joinCode: string;
  ownerId: string; // The creator of the space
  members: string[]; // Array of employee IDs
  theme?: string; // Optional per-space theme override
  description?: string; // Used for "Today's Task"
  createdAt: string;
}

export interface List {
  id: number;
  spaceId: string;
  name: string;
  color?: string;
  position: number;
  createdAt: string;
}

// Deprecating strict 'admin' role in favor of Space Ownership
export type Role = 'user' | 'admin' | 'super_admin';

export interface User {
  username: string;
  fullName?: string;
  role: Role;
  employeeId: string;
  department?: string;
  isAdmin?: boolean;
  avatarUrl?: string;
  position?: Position | string;
  phone?: string;
  email?: string;
}

export interface ActivityLog {
  id: number;
  timestamp: string;
  message: string;
  user: {
    name: string;
    avatarUrl: string;
  }
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string, fullName: string, department: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}
