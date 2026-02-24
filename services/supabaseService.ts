
import { supabase } from '../lib/supabaseClient';
import { Task, Space, Employee, TaskStatus, Priority, Comment, Subtask, TimeLogEntry, List } from '../types';

// --- Types for DB Insert/Update ---
interface DbTask {
  id?: number;
  space_id: string;
  title: string;
  description: string;
  assignee_id: string;
  due_date: string;
  status: string;
  priority: string;
  tags: string[];
  timer_start_time: string | null;
  blocked_by_id: number | null;
  completed_at: string | null;
  list_id?: number | null;
}

interface DbList {
  id: number;
  space_id: string;
  name: string;
  color?: string;
  position: number;
  created_at: string;
}

interface DbDailyTask {
  id?: string;
  user_id: string;
  text: string;
  status: string;
  priority: string;
  schedule: string | null;
  is_unplanned: boolean;
}

interface DbScratchpad {
  user_id: string;
  content: string;
}

// --- Mappers (CamelCase <-> SnakeCase) ---

const mapDbTaskToApp = (dbTask: any): Task => ({
  id: dbTask.id,
  spaceId: dbTask.space_id,
  title: dbTask.title,
  description: dbTask.description || '',
  assigneeId: dbTask.assignee_id,
  dueDate: dbTask.due_date,
  status: dbTask.status as TaskStatus,
  priority: dbTask.priority as Priority,
  tags: dbTask.tags || [],
  timerStartTime: dbTask.timer_start_time,
  createdAt: dbTask.created_at,
  completedAt: dbTask.completed_at,
  blockedById: dbTask.blocked_by_id,
  listId: dbTask.list_id,
  comments: dbTask.comments ? dbTask.comments.map(mapDbCommentToApp) : [],
  subtasks: dbTask.subtasks ? dbTask.subtasks.map(mapDbSubtaskToApp) : [],
  timeLogs: dbTask.time_logs ? dbTask.time_logs.map(mapDbTimeLogToApp) : [],
});

const mapDbCommentToApp = (dbComment: any): Comment => ({
  id: dbComment.id,
  authorId: dbComment.author_id,
  content: dbComment.content,
  timestamp: dbComment.created_at,
});

const mapDbSubtaskToApp = (dbSubtask: any): Subtask => ({
  id: dbSubtask.id,
  title: dbSubtask.title,
  isCompleted: dbSubtask.is_completed,
});

const mapDbTimeLogToApp = (dbLog: any): TimeLogEntry => ({
  id: dbLog.id,
  startTime: dbLog.start_time,
  endTime: dbLog.end_time,
  duration: dbLog.duration,
});

const mapDbSpaceToApp = (dbSpace: any): Space => ({
  id: dbSpace.id,
  name: dbSpace.name,
  joinCode: dbSpace.join_code,
  ownerId: dbSpace.owner_id,
  members: [],
  description: dbSpace.description,
  theme: dbSpace.theme,
  createdAt: dbSpace.created_at,
});

const mapDbProfileToEmployee = (dbProfile: any): Employee => ({
  id: dbProfile.id,
  name: dbProfile.full_name || dbProfile.username || 'Unknown',
  fullName: dbProfile.full_name,
  email: dbProfile.email || '',
  avatarUrl: dbProfile.avatar_url || 'https://via.placeholder.com/150',
  position: dbProfile.position,
  phone: dbProfile.phone,
  isSuperAdmin: dbProfile.is_admin,
});



const mapDbListToApp = (dbList: any): List => ({
  id: dbList.id,
  spaceId: dbList.space_id,
  name: dbList.name,
  color: dbList.color,
  position: dbList.position,
  createdAt: dbList.created_at,
});

// --- Services ---

export const getSpaces = async (userId: string) => {
  // 1. Get all space IDs where the user is a member
  const { data: membershipData, error: membershipError } = await supabase
    .from('space_members')
    .select('space_id')
    .eq('user_id', userId);

  if (membershipError) throw membershipError;
  if (!membershipData || membershipData.length === 0) return [];

  const spaceIds = membershipData.map(m => m.space_id);

  // 2. Fetch the details for those spaces
  const { data: spacesData, error: spacesError } = await supabase
    .from('spaces')
    .select('*')
    .in('id', spaceIds);

  if (spacesError) throw spacesError;

  // 3. For each space, fetch all its members to populate the members array
  // Optimization: Fetch all members for all these spaces in one go
  const { data: allMembersData, error: allMembersError } = await supabase
    .from('space_members')
    .select('space_id, user_id')
    .in('space_id', spaceIds);

  if (allMembersError) {
    console.error('Error fetching all members:', allMembersError);
  }

  const spacesWithMembers = spacesData.map((s: any) => {
    const spaceMembers = allMembersData
      ? allMembersData.filter((m: any) => m.space_id === s.id).map((m: any) => m.user_id)
      : [];

    return {
      ...mapDbSpaceToApp(s),
      members: spaceMembers
    };
  });

  return spacesWithMembers;
};

export const deleteAvatar = async (path: string) => {
  const { error } = await supabase.storage.from('avatars').remove([path]);
  if (error) {
    console.error('Error deleting avatar:', error);
    // We don't throw here to avoid blocking the main flow if deletion fails
  }
};


export const getMemberships = async (spaceIds: string[]) => {
  if (spaceIds.length === 0) return [];
  const { data, error } = await supabase
    .from('space_members')
    .select('space_id, user_id, role')
    .in('space_id', spaceIds);

  if (error) throw error;
  return data;
};

export const createSpace = async (name: string, userId: string, description?: string) => {
  const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { data: spaceData, error: spaceError } = await supabase
    .from('spaces')
    .insert({
      name,
      description: description || null,
      join_code: joinCode,
      owner_id: userId
    })
    .select()
    .single();

  if (spaceError) throw spaceError;

  const { error: memberError } = await supabase
    .from('space_members')
    .insert({ space_id: spaceData.id, user_id: userId, role: 'admin' });

  if (memberError) throw memberError;

  return { ...mapDbSpaceToApp(spaceData), members: [userId] };
};

export const joinSpace = async (code: string, userId: string) => {
  // Normalize the code: uppercase and remove any spaces/hyphens
  const normalizedCode = code.toUpperCase().replace(/[\s-]/g, '').trim();

  // Use the RPC function which bypasses RLS to find and join the space
  const { data, error } = await supabase.rpc('join_space_v2', {
    input_code: normalizedCode
  });

  if (error) {
    // Handle specific error messages
    if (error.message.includes('not found')) {
      throw new Error('Invalid join code. Please check the code and try again.');
    }
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Invalid join code. Please check the code and try again.');
  }

  const appSpace = mapDbSpaceToApp(data);
  return { ...appSpace, members: [userId] };
};

export const getTasks = async (spaceId: string, currentUserId?: string) => {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      subtasks(*),
      comments(*),
      time_logs(*)
    `)
    .eq('space_id', spaceId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(mapDbTaskToApp);
};

export const upsertTask = async (task: Partial<Task> & { spaceId: string, title: string }) => {
  // If we have an ID, we perform a PATCH (update) to avoid overwriting missing fields with defaults.
  if (task.id) {
    const payload: any = {};
    // Only map fields that are present in the update object
    if (task.spaceId !== undefined) payload.space_id = task.spaceId;
    if (task.title !== undefined) payload.title = task.title;
    if (task.description !== undefined) payload.description = task.description;
    if (task.assigneeId !== undefined) payload.assignee_id = task.assigneeId;
    if (task.dueDate !== undefined) payload.due_date = task.dueDate;
    if (task.status !== undefined) payload.status = task.status;
    if (task.priority !== undefined) payload.priority = task.priority;
    if (task.tags !== undefined) payload.tags = task.tags;
    if (task.timerStartTime !== undefined) payload.timer_start_time = task.timerStartTime;
    if (task.blockedById !== undefined) payload.blocked_by_id = task.blockedById;
    if (task.completedAt !== undefined) payload.completed_at = task.completedAt;
    if (task.listId !== undefined) payload.list_id = task.listId;

    const { data, error } = await supabase
      .from('tasks')
      .update(payload)
      .eq('id', task.id)
      .select()
      .single();

    if (error) throw error;

    // Handle Subtasks for Update
    if (task.subtasks) {
      // Naive replace for subtasks (delete all, insert new) - reasonable for now
      await supabase.from('subtasks').delete().eq('task_id', task.id);
      if (task.subtasks.length > 0) {
        await supabase.from('subtasks').insert(
          task.subtasks.map((st: Subtask) => ({ task_id: task.id, title: st.title, is_completed: st.isCompleted }))
        );
      }
      // Fetch fresh subtasks to return complete object?
      // data already has basic fields. mapDbTaskToApp might fail if subtasks are missing?
      // mapDbTaskToApp checks dbTask.subtasks ? ... : []
    }

    // Re-fetch to return full object including subtasks, comments etc?
    // The update().select() usually returns the row.
    // If we want subtasks included in the return, we might need to query them or map locally.
    // But mapDbTaskToApp handles missing subtasks gracefully.
    return mapDbTaskToApp(data);

  } else {
    // New Task - Insert with defaults
    const payload: DbTask = {
      space_id: task.spaceId,
      title: task.title,
      description: task.description || '',
      assignee_id: task.assigneeId || '',
      due_date: task.dueDate || new Date().toISOString(),
      status: task.status || 'To Do',
      priority: task.priority || 'Medium',
      tags: task.tags || [],
      timer_start_time: task.timerStartTime || null,
      blocked_by_id: task.blockedById || null,
      completed_at: task.completedAt || null,
      list_id: task.listId || null,
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    if (task.subtasks && task.subtasks.length > 0) {
      await supabase.from('subtasks').insert(
        task.subtasks.map((st: Subtask) => ({ task_id: data.id, title: st.title, is_completed: st.isCompleted }))
      );
    }

    return mapDbTaskToApp(data);
  }
};

export const addTaskComment = async (taskId: number, authorId: string, content: string) => {
  const { data, error } = await supabase
    .from('comments')
    .insert({ task_id: taskId, author_id: authorId, content })
    .select()
    .single();
  if (error) throw error;
  return mapDbCommentToApp(data);
};

export const logTaskTime = async (taskId: number, startTime: string, endTime: string, duration: number) => {
  const { error } = await supabase
    .from('time_logs')
    .insert({ task_id: taskId, start_time: startTime, end_time: endTime, duration });
  if (error) throw error;
};

export const getAllEmployees = async () => {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) throw error;
  return data.map(mapDbProfileToEmployee);
};

export const updateProfile = async (userId: string, updates: { fullName?: string; avatarUrl?: string; phone?: string; position?: string; email?: string }) => {
  const payload: any = {};
  if (updates.fullName) payload.full_name = updates.fullName;
  if (updates.avatarUrl) payload.avatar_url = updates.avatarUrl;
  if (updates.phone) payload.phone = updates.phone;
  if (updates.position) payload.position = updates.position;
  if (updates.email) payload.email = updates.email;

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return mapDbProfileToEmployee(data);
};

export const deleteTask = async (taskId: number) => {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) throw error;
};



export const addMemberToSpace = async (spaceId: string, userId: string, role: string = 'member') => {
  const { error } = await supabase
    .from('space_members')
    .insert({ space_id: spaceId, user_id: userId, role });

  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      throw new Error('User is already a member of this workspace');
    }
    throw error;
  }
};

export const removeMemberFromSpace = async (spaceId: string, userId: string) => {
  const { error } = await supabase
    .from('space_members')
    .delete()
    .eq('space_id', spaceId)
    .eq('user_id', userId);

  if (error) throw error;
};

export const deleteSpace = async (spaceId: string) => {
  // First delete all tasks in the space (cascade will handle subtasks, comments, time logs)
  const { error: tasksError } = await supabase
    .from('tasks')
    .delete()
    .eq('space_id', spaceId);

  if (tasksError) throw tasksError;

  // Delete space members
  const { error: membersError } = await supabase
    .from('space_members')
    .delete()
    .eq('space_id', spaceId);

  if (membersError) throw membersError;

  // Delete the space itself
  const { error: spaceError } = await supabase
    .from('spaces')
    .delete()
    .eq('id', spaceId);

  if (spaceError) throw spaceError;
};

export const updateSpace = async (spaceId: string, updates: Partial<Space>) => {
  const payload: any = {};
  if (updates.name) payload.name = updates.name;
  if (updates.description) payload.description = updates.description;
  if (updates.theme) payload.theme = updates.theme;

  const { data, error } = await supabase
    .from('spaces')
    .update(payload)
    .eq('id', spaceId)
    .select()
    .single();

  if (error) throw error;
  return { ...mapDbSpaceToApp(data), members: [] }; // Members usually fetched separately or maintained in state
};

// --- Admin-Only Functions ---

/**
 * Get all spaces (admin only)
 * Admins can see all workspaces regardless of membership
 */
export const getAllSpaces = async () => {
  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const spacesWithMembers = await Promise.all(data.map(async (s: any) => {
    const { data: memberData } = await supabase.from('space_members').select('user_id').eq('space_id', s.id);

    const realMemberIds = memberData ? memberData.map((m: any) => m.user_id) : [];

    return {
      ...mapDbSpaceToApp(s),
      members: realMemberIds
    };
  }));

  return spacesWithMembers;
};

/**
 * Get all tasks across all spaces (admin only)
 * Returns tasks grouped by space for the overseer view
 */
export const getAllTasksAcrossSpaces = async () => {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      subtasks(*),
      comments(*),
      time_logs(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(mapDbTaskToApp);
};

export const getAllUsersWithRoles = async () => {
  // 1. Get all profiles (employees)
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*');

  if (profilesError) throw profilesError;

  // 2. Get all space members to find their workspace and role
  const { data: members, error: membersError } = await supabase
    .from('space_members')
    .select('user_id, role, space_id, spaces(name)');

  if (membersError) throw membersError;

  // 3. Merge data
  const usersWithRoles = profiles.map((profile: any) => {
    // Find the membership entry for this user (assuming 1 workspace per user for now, or take the first one)
    const membership = members?.find((m: any) => m.user_id === profile.id);

    return {
      ...mapDbProfileToEmployee(profile),
      spaceId: membership?.space_id || '',
      spaceName: (membership?.spaces as any)?.name || 'Unassigned',
      role: membership?.role || 'member', // Default to member if not found (or if they have no workspace)
      isSuperAdmin: profile.is_admin || false,
    };
  });

  return usersWithRoles;
};

export const updateWorkspaceRole = async (userId: string, spaceId: string, role: 'admin' | 'assistant' | 'member') => {
  const { error } = await supabase
    .from('space_members')
    .update({ role })
    .eq('user_id', userId)
    .eq('space_id', spaceId);

  if (error) throw error;
};

export const updateSuperAdminStatus = async (userId: string, isSuperAdmin: boolean) => {
  const { error } = await supabase
    .from('profiles')
    .update({ is_admin: isSuperAdmin })
    .eq('id', userId);

  if (error) throw error;
};

// --- Daily Tasks Sync ---

export const getDailyTasks = async (userId: string) => {
  const { data, error } = await supabase
    .from('daily_tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map((t: any) => ({
    id: t.id,
    text: t.text,
    status: t.status,
    priority: t.priority,
    schedule: t.schedule,
    isUnplanned: t.is_unplanned,
  }));
};

export const syncDailyTask = async (userId: string, task: any) => {
  const payload: DbDailyTask = {
    user_id: userId,
    text: task.text,
    status: task.status,
    priority: task.priority,
    schedule: task.schedule || null,
    is_unplanned: task.isUnplanned || false,
  };

  if (task.id && task.id.length > 20) { // UUID check
    payload.id = task.id;
  }

  const { data, error } = await supabase
    .from('daily_tasks')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
};



// --- Scratchpad Sync ---

export const getScratchpad = async (userId: string) => {
  const { data, error } = await supabase
    .from('scratchpads')
    .select('content')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data?.content || '';
};

export const syncScratchpad = async (userId: string, content: string) => {
  const { error } = await supabase
    .from('scratchpads')
    .upsert({ user_id: userId, content, updated_at: new Date().toISOString() });
  if (error) throw error;
};

// --- Notifications ---



// --- List Services ---

export const getLists = async (spaceId: string) => {
  const { data, error } = await supabase
    .from('lists')
    .select('*')
    .eq('space_id', spaceId)
    .order('position', { ascending: true });

  if (error) throw error;
  return data.map(mapDbListToApp);
};

export const createList = async (spaceId: string, name: string) => {
  const { data, error } = await supabase
    .from('lists')
    .insert({ space_id: spaceId, name })
    .select()
    .single();

  if (error) throw error;
  return mapDbListToApp(data);
};







export const deleteUserAccount = async (userId: string) => {
  // This removes the user's profile info.
  // Note: Deleting from auth.users requires Service Role Key or an RPC function in a secure environment.
  // From the client side, we can only delete data we have access to (public tables).
  // Assuming RLS allows admins to delete profiles.
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (error) throw error;
};


