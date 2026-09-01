create table if not exists public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  target_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.admin_activity_logs enable row level security;
drop policy if exists "admin_activity_logs_admin_read" on public.admin_activity_logs;
create policy "admin_activity_logs_admin_read" on public.admin_activity_logs for select to authenticated using ((auth.jwt() ->> 'email') = 'ezzouhir2122@gmail.com');
drop policy if exists "admin_activity_logs_admin_insert" on public.admin_activity_logs;
create policy "admin_activity_logs_admin_insert" on public.admin_activity_logs for insert to authenticated with check ((auth.jwt() ->> 'email') = 'ezzouhir2122@gmail.com');
grant select, insert on public.admin_activity_logs to authenticated;
