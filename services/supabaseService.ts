
import { supabase } from '../lib/supabaseClient';
import { Task, Space, Employee, TaskStatus, Priority, Subtask } from '../types';

// --- Types for DB Insert/Update ---
interface DbTask {
  id?: number;
  space_id: string;
  title: string;
  description: string;
  assignee_id: string; // keep for backward compatibility
  assignee_ids?: string[];
  creator_id?: string;
  due_date: string;
  status: string;
  priority: string;
  tags: string[];
  timer_start_time: string | null;
  end_date: string | null;
  recurrence: string | null;
  blocked_by_id: number | null;
  completed_at: string | null;

  parent_task_id?: number | null;
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
  assigneeIds: dbTask.assignee_ids || (dbTask.assignee_id ? [dbTask.assignee_id] : []),
  creatorId: dbTask.creator_id,
  dueDate: dbTask.due_date,
  status: dbTask.status as TaskStatus,
  priority: dbTask.priority as Priority,
  tags: dbTask.tags || [],
  endDate: dbTask.end_date,
  recurrence: dbTask.recurrence || 'none',
  timerStartTime: dbTask.timer_start_time,
  createdAt: dbTask.created_at,
  completedAt: dbTask.completed_at,
  blockedById: dbTask.blocked_by_id,

  parent_task_id: dbTask.parent_task_id,
  subtasks: dbTask.subtasks ? dbTask.subtasks.map(mapDbSubtaskToApp) : [],
  updated_at: dbTask.updated_at,
});


const mapDbSubtaskToApp = (dbSubtask: any): Subtask => ({
  id: dbSubtask.id,
  title: dbSubtask.title,
  isCompleted: dbSubtask.is_completed,
});


const mapDbSpaceToApp = (dbSpace: any): Space => ({
  id: dbSpace.id,
  name: dbSpace.name,
  joinCode: dbSpace.join_code,
  ownerId: dbSpace.owner_id,
  members: [],
  description: dbSpace.description,
  theme: dbSpace.theme,
  logoUrl: dbSpace.logo_url,
  createdAt: dbSpace.created_at,
});

export const getFallbackAvatar = (name: string) => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Unknown')}&background=random&color=fff&bold=true&length=2`;
}

const mapDbProfileToEmployee = (dbProfile: any): Employee => {
  const name = dbProfile.full_name || dbProfile.username || 'Unknown';

  // Treat placeholder URLs as empty so they trigger the fallback
  const dbAvatar = dbProfile.avatar_url || '';
  const isPlaceholder = dbAvatar.includes('placeholder.com') || dbAvatar.includes('via.placeholder');

  const avatarUrl = (!dbAvatar || isPlaceholder)
    ? getFallbackAvatar(name)
    : dbAvatar;

  return {
    id: dbProfile.id,
    name,
    fullName: dbProfile.full_name,
    email: dbProfile.email || '',
    avatarUrl,
    position: dbProfile.position,
    phone: dbProfile.phone,
    isSuperAdmin: dbProfile.is_admin,
    mustChangePassword: dbProfile.must_change_password,
  };
};




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

export const deleteWorkspaceLogo = async (path: string) => {
  const { error } = await supabase.storage.from('workspace-logos').remove([path]);
  if (error) {
    console.error('Error deleting workspace logo:', error);
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

  // Add all superadmins to the new space as admins
  const { data: superAdmins } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_admin', true);

  if (superAdmins && superAdmins.length > 0) {
    const superAdminIds = superAdmins.map(sa => sa.id).filter(id => id !== userId);
    if (superAdminIds.length > 0) {
      const inserts = superAdminIds.map(saId => ({
        space_id: spaceData.id,
        user_id: saId,
        role: 'admin'
      }));
      await supabase.from('space_members').insert(inserts);
    }
  }

  // Fetch final list of members for the return object
  const { data: finalMembers } = await supabase
    .from('space_members')
    .select('user_id')
    .eq('space_id', spaceData.id);

  const memberIds = finalMembers ? finalMembers.map(m => m.user_id) : [userId];

  return { ...mapDbSpaceToApp(spaceData), members: memberIds };
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
  // First, clean up tasks that have been DONE for > 24 hours
  const oneDayAgo = new Date();
  oneDayAgo.setHours(oneDayAgo.getHours() - 24);
  const oneDayAgoISO = oneDayAgo.toISOString();

  await supabase
    .from('tasks')
    .delete()
    .eq('space_id', spaceId)
    .eq('status', TaskStatus.DONE)
    .not('completed_at', 'is', null)
    .lt('completed_at', oneDayAgoISO);

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      subtasks(*),
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
    if (task.assigneeIds !== undefined) payload.assignee_ids = task.assigneeIds;
    if (task.creatorId !== undefined) payload.creator_id = task.creatorId;
    if (task.dueDate !== undefined) payload.due_date = task.dueDate;
    if (task.endDate !== undefined) payload.end_date = task.endDate || null;
    if (task.recurrence !== undefined) payload.recurrence = task.recurrence;
    if (task.status !== undefined) payload.status = task.status;
    if (task.priority !== undefined) payload.priority = task.priority;
    if (task.tags !== undefined) payload.tags = task.tags;
    if (task.timerStartTime !== undefined) payload.timer_start_time = task.timerStartTime;

    // Auto-set completed_at if status changes to DONE and no valid completedAt is provided
    if (task.status === (TaskStatus.DONE as unknown as string) && !task.completedAt) {
      payload.completed_at = new Date().toISOString();
    } else if (task.status && task.status !== (TaskStatus.DONE as unknown as string)) {
      // Clear completed_at if status is changed to something other than DONE
      payload.completed_at = null;
    } else if (task.completedAt !== undefined) {
      payload.completed_at = task.completedAt;
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(payload)
      .eq('id', task.id)
      .select()
      .single();

    if (error) throw error;

    // Handle recurring tasks spawning when marked DONE
    if (
      task.status === TaskStatus.DONE &&
      data.recurrence &&
      data.recurrence !== 'none'
    ) {
      // Check if we already spanned a recurring task for this date to avoid duplicates
      const { data: existingSuccessor, error: checkError } = await supabase
        .from('tasks')
        .select('id')
        .eq('parent_task_id', data.id)
        .maybeSingle();

      if (!checkError && !existingSuccessor) {
        const currentDueDate = new Date(data.due_date);
        const nextDueDate = new Date(currentDueDate);

        if (data.recurrence === 'daily') {
          nextDueDate.setDate(nextDueDate.getDate() + 1);
        } else if (data.recurrence === 'weekly') {
          nextDueDate.setDate(nextDueDate.getDate() + 7);
        } else if (data.recurrence === 'monthly') {
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        }

        // Skip Sunday (0) - only Monday-Saturday are work days
        if (nextDueDate.getDay() === 0) {
          nextDueDate.setDate(nextDueDate.getDate() + 1);
        }

        const newTaskPayload: DbTask = {
          space_id: data.space_id,
          title: data.title,
          description: data.description || '',
          assignee_id: data.assignee_id || '',
          assignee_ids: data.assignee_ids || (data.assignee_id ? [data.assignee_id] : []),
          creator_id: data.creator_id,
          due_date: nextDueDate.toISOString(),
          end_date: data.end_date || null,
          status: TaskStatus.TODO,
          priority: data.priority,
          tags: data.tags || [],
          timer_start_time: null,
          recurrence: data.recurrence,
          blocked_by_id: data.blocked_by_id || null,
          completed_at: null,
          parent_task_id: data.id,
        };

        try {
          await supabase.from('tasks').insert(newTaskPayload);
        } catch (e: any) {
          // If a unique constraint violation occurs (code 23505), 
          // it means another process already spawned the task. 
          // We can safely ignore this.
          if (e.code !== '23505') throw e;
        }
      }
    }

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
      assignee_id: task.assigneeId || (task.assigneeIds?.[0] || ''),
      assignee_ids: task.assigneeIds || (task.assigneeId ? [task.assigneeId] : []),
      creator_id: task.creatorId,
      due_date: task.dueDate || new Date().toISOString(),
      end_date: task.endDate || null,
      recurrence: task.recurrence || 'none',
      status: task.status || 'To Do',
      priority: task.priority || 'Medium',
      tags: task.tags || [],
      timer_start_time: task.timerStartTime || null,
      blocked_by_id: task.blockedById || null,
      completed_at: task.completedAt || null,
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



export const getAllEmployees = async () => {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) throw error;
  return data.map(mapDbProfileToEmployee);
};

export const searchUsers = async (query: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(20);

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
  if (updates.name !== undefined) payload.name = updates.name;
  // Allow empty string for description (user cleared it intentionally)
  if (updates.description !== undefined) payload.description = updates.description;
  // Allow "0" and other falsy-but-valid theme indices
  if (updates.theme !== undefined) payload.theme = updates.theme;
  if (updates.logoUrl !== undefined) payload.logo_url = updates.logoUrl;

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
    // Find all membership entries for this user
    const userMemberships = members?.filter((m: any) => m.user_id === profile.id) || [];
    
    const workspaces = userMemberships.map((m: any) => ({
      spaceId: m.space_id,
      spaceName: (m.spaces as any)?.name || 'Unknown Workspace',
      role: m.role || 'member'
    }));

    return {
      ...mapDbProfileToEmployee(profile),
      workspaces,
      isSuperAdmin: profile.is_admin || false,
      mustChangePassword: profile.must_change_password || false,
    };
  });

  return usersWithRoles;
};


export const updateSuperAdminStatus = async (userId: string, isSuperAdmin: boolean) => {
  const { error } = await supabase
    .from('profiles')
    .update({ is_admin: isSuperAdmin })
    .eq('id', userId);

  if (error) throw error;

  // If promoted to super admin, add them to all existing workspaces globally
  if (isSuperAdmin) {
    const { data: allSpaces } = await supabase.from('spaces').select('id');
    if (allSpaces && allSpaces.length > 0) {
      // First, get spaces they are already in
      const { data: existingMemberships } = await supabase
        .from('space_members')
        .select('space_id')
        .eq('user_id', userId);

      const existingSpaceIds = existingMemberships ? existingMemberships.map(m => m.space_id) : [];
      const spacesToAdd = allSpaces.filter(space => !existingSpaceIds.includes(space.id));

      if (spacesToAdd.length > 0) {
        const inserts = spacesToAdd.map(space => ({
          space_id: space.id,
          user_id: userId,
          role: 'admin'
        }));
        await supabase.from('space_members').insert(inserts);
      }
    }
  }
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

export const deleteDailyTask = async (taskId: string) => {
  const { error } = await supabase
    .from('daily_tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
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







export const deleteUserAccount = async (userId: string) => {
  // Use the admin-delete-user Edge Function to perform a "hard" delete
  // This removes the user from auth.users, which triggers a cascade
  // deleting their profile and all related application data.
  const { data, error } = await supabase.functions.invoke('admin-delete-user', {
    body: { userId }
  });

  if (error) throw error;
  return data;
};

export const resetUserPassword = async (userId: string) => {
  const { data, error } = await supabase.functions.invoke('admin-reset-password', {
    body: { userId }
  });

  if (error) throw error;
  return data;
};

