-- Add email column to profiles
alter table public.profiles add column if not exists email text;

-- Populate existing emails from auth.users
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id;

-- Update the handle_new_user trigger function to include email
create or replace function public.handle_new_user()
returns trigger as $$
declare
  _department text;
  _space_id uuid;
  _user_full_name text;
  _user_avatar_url text;
  _user_username text;
begin
  _user_full_name := new.raw_user_meta_data->>'full_name';
  _user_username := new.raw_user_meta_data->>'username';
  _user_avatar_url := new.raw_user_meta_data->>'avatar_url';
  _department := new.raw_user_meta_data->>'department';

  -- Insert Profile
  insert into public.profiles (id, username, full_name, avatar_url, department, email)
  values (
    new.id, 
    coalesce(_user_username, split_part(new.email, '@', 1)), 
    _user_full_name, 
    _user_avatar_url, 
    _department,
    new.email
  );

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
