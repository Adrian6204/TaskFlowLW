-- Allow authenticated users to insert notifications (so they can notify others)
create policy "Authenticated users can insert notifications"
  on public.notifications for insert
  with check (auth.role() = 'authenticated');
