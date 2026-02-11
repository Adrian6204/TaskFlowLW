-- Drop the broad/permissive policies that allow too much access
drop policy if exists "Enable access for space members" on tasks;
drop policy if exists "Users can delete tasks in their spaces" on tasks;
drop policy if exists "Users can update tasks in their spaces" on tasks;

-- Admin Policy: Admins can do everything on tasks
create policy "Admins can do everything on tasks"
  on tasks
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_admin = true
    )
  );

-- Update Policy: Users can update their own tasks (assigned to them) or unassigned tasks (to claim them)
-- We also check they are in the space to avoid cross-space access.
create policy "Users can update their own or unassigned tasks"
  on tasks
  for update
  using (
    (
      space_id in (select space_id from space_members where user_id = auth.uid())
      and
      (assignee_id = auth.uid() or assignee_id is null)
    )
  );

-- Delete Policy: Users can ONLY delete tasks assigned to them
create policy "Users can delete their own tasks"
  on tasks
  for delete
  using (
      space_id in (select space_id from space_members where user_id = auth.uid())
      and
      assignee_id = auth.uid()
  );
