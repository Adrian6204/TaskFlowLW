
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. HELPER FUNCTIONS (The Fixes)
-- ==========================================

-- Cleanup old functions
DROP FUNCTION IF EXISTS public.join_space(text);
DROP FUNCTION IF EXISTS public.join_space_by_code(text);
DROP FUNCTION IF EXISTS public.join_space_v2(text);

-- Helper: Check if user is a member of a space (Bypasses RLS for checks)
create or replace function public.is_space_member(_space_id uuid)
returns boolean language plpgsql security definer as $$
begin
  return exists (
    select 1
    from public.space_members
    where space_id = _space_id
    and user_id = auth.uid()
  );
end;
$$;

-- Helper: Join Space V2 (Robust, Case-Insensitive, Idempotent)
create or replace function public.join_space_v2(input_code text)
returns json 
language plpgsql 
security definer 
set search_path = public
as $$
declare
  _space_id uuid;
  _space_data record;
  _clean_code text;
begin
  -- Normalize input: Uppercase and trimmed
  _clean_code := upper(trim(input_code));

  -- 1. SEARCH: Find the space ID by code
  select id into _space_id 
  from public.spaces 
  where upper(trim(join_code)) = _clean_code;
  
  if _space_id is null then
    raise exception 'Space with code % not found', _clean_code;
  end if;

  -- 2. INSERT MEMBER: Safe insert (Idempotent - does nothing if already member)
  insert into public.space_members (space_id, user_id, role)
  values (_space_id, auth.uid(), 'member')
  on conflict (space_id, user_id) do nothing;

  -- 3. RETURN DATA: Return the space details
  select * from public.spaces where id = _space_id into _space_data;
  return row_to_json(_space_data);
end;
$$;

-- Grant permissions
grant execute on function public.join_space_v2(text) to authenticated;
grant execute on function public.join_space_v2(text) to service_role;


-- ==========================================
-- 2. TABLE DEFINITIONS
-- ==========================================

-- PROFILES (Users)
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  avatar_url text,
  updated_at timestamp with time zone,
  department text,
  is_admin boolean default false
);

alter table public.profiles enable row level security;

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  _department text;
  _space_id uuid;
  _user_full_name text;
  _user_avatar_url text;
begin
  _user_full_name := new.raw_user_meta_data->>'full_name';
  _user_avatar_url := new.raw_user_meta_data->>'avatar_url';
  _department := new.raw_user_meta_data->>'department';

  -- Insert Profile
  insert into public.profiles (id, username, avatar_url, department)
  values (new.id, _user_full_name, _user_avatar_url, _department);

  -- Put user in the corresponding space if department is valid
  if _department is not null then
      select id into _space_id from public.spaces where name = _department limit 1;
      
      if _space_id is not null then
          insert into public.space_members (space_id, user_id, role)
          values (_space_id, new.id, 'member')
          on conflict do nothing;
      end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Profile Policies
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);

drop policy if exists "Users can insert their own profile." on public.profiles;
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile." on public.profiles;
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);


-- SPACES
create table if not exists public.spaces (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  join_code text unique not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.spaces enable row level security;

drop policy if exists "Enable insert for authenticated users only" on public.spaces;
create policy "Enable insert for authenticated users only" on public.spaces for insert to authenticated with check (auth.uid() = owner_id);

drop policy if exists "Enable read for owners and members" on public.spaces;
create policy "Enable read for owners and members" on public.spaces for select to authenticated using (
  auth.uid() = owner_id 
  or public.is_space_member(id)
  or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);


-- SPACE MEMBERS
create table if not exists public.space_members (
  id bigint generated by default as identity primary key,
  space_id uuid references public.spaces(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  role text default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(space_id, user_id)
);

alter table public.space_members enable row level security;

drop policy if exists "Enable insert for authenticated users" on public.space_members;
create policy "Enable insert for authenticated users" on public.space_members for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Enable read for members of the space" on public.space_members;
create policy "Enable read for members of the space" on public.space_members for select to authenticated using (
  public.is_space_member(space_id) 
  or user_id = auth.uid()
  or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);


-- TASKS
create table if not exists public.tasks (
  id bigint generated by default as identity primary key,
  space_id uuid references public.spaces(id) on delete cascade not null,
  title text not null,
  description text,
  assignee_id uuid references public.profiles(id),
  due_date date,
  status text default 'To Do',
  priority text default 'Medium',
  tags text[] default '{}',
  timer_start_time timestamp with time zone,
  blocked_by_id bigint references public.tasks(id),
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.tasks enable row level security;

drop policy if exists "Enable access for space members" on public.tasks;
create policy "Enable access for space members" on public.tasks for all to authenticated using (
  public.is_space_member(space_id)
  or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);


-- SUBTASKS
create table if not exists public.subtasks (
  id bigint generated by default as identity primary key,
  task_id bigint references public.tasks(id) on delete cascade not null,
  title text not null,
  is_completed boolean default false
);

alter table public.subtasks enable row level security;

drop policy if exists "Enable access for space members" on public.subtasks;
create policy "Enable access for space members" on public.subtasks for all to authenticated using (
  exists (select 1 from public.tasks where tasks.id = subtasks.task_id and public.is_space_member(tasks.space_id))
);


-- COMMENTS
create table if not exists public.comments (
  id bigint generated by default as identity primary key,
  task_id bigint references public.tasks(id) on delete cascade not null,
  author_id uuid references public.profiles(id) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.comments enable row level security;

drop policy if exists "Enable access for space members" on public.comments;
create policy "Enable access for space members" on public.comments for all to authenticated using (
  exists (select 1 from public.tasks where tasks.id = comments.task_id and public.is_space_member(tasks.space_id))
);


-- TIME LOGS
create table if not exists public.time_logs (
  id bigint generated by default as identity primary key,
  task_id bigint references public.tasks(id) on delete cascade not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  duration bigint not null
);

alter table public.time_logs enable row level security;

drop policy if exists "Enable access for space members" on public.time_logs;
create policy "Enable access for space members" on public.time_logs for all to authenticated using (
  exists (select 1 from public.tasks where tasks.id = time_logs.task_id and public.is_space_member(tasks.space_id))
);
