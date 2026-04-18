
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
  RESEARCH_ASSISTANT = 'Research Assistant',
  AI_EXECUTIVE = 'AI Executive',
  AIE_ASSISTANT = 'AIE Assistant',
  PROJECT_COORDINATOR = 'Project Coordinator',
  ADMIN_ACCOUNTING = 'Admin Accounting',
  IT_EXECUTIVE_ASSISTANT = 'IT Executive Assistant',
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
  mustChangePassword?: boolean;
}

export interface UserWorkspace {
  spaceId: string;
  spaceName: string;
  role: 'admin' | 'member';
}

export interface EmployeeWithRole extends Employee {
  workspaces: UserWorkspace[];
  isSuperAdmin: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}


export interface Task {
  id: number;
  spaceId: string; // Link to specific space
  title: string;
  description: string;
  assigneeId: string; // Maintain for backward compatibility
  assigneeIds?: string[]; // New array for multiple assignees
  creatorId?: string; // Adding tracking for task creator
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  status: TaskStatus;
  priority: Priority;
  subtasks: Subtask[];
  tags: string[];
  timerStartTime?: string | null;
  createdAt: string;
  completedAt?: string | null;
  blockedById?: number | null;

  isUnplanned?: boolean;
  updated_at?: string;
  endDate?: string; // YYYY-MM-DD
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  parent_task_id?: number | null;
}

export interface Space {
  id: string;
  name: string;
  joinCode: string;
  ownerId: string; // The creator of the space
  members: string[]; // Array of employee IDs
  theme?: string; // Optional per-space theme override
  description?: string; // Used for "Today's Task"
  logoUrl?: string | null; // Workspace logo
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
  mustChangePassword?: boolean;
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

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'timed_out';

export interface TaskFlowStatusUser {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  department: string;
  position: string;
  avatar_url: string | null;
  status: AttendanceStatus | string;
  time_in: string | null;
  time_out: string | null;
  dtr_id: string | null;
}

export interface TaskFlowStatusResponse {
  success: boolean;
  date: string;
  users: TaskFlowStatusUser[];
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string, fullName: string, department: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  markPasswordChanged: (newPassword: string) => Promise<boolean>;
}
