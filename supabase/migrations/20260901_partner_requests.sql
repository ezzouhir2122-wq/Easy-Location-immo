create table if not exists public.partner_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  nom text not null,
  telephone text not null,
  ville text not null,
  type_profil text not null default 'proprietaire',
  nombre_biens integer not null default 1,
  message text default '',
  statut text not null default 'pending' check (statut in ('pending', 'under_review', 'approved', 'rejected', 'needs_info')),
  admin_note text default '',
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.partner_requests enable row level security;
drop policy if exists "partner_requests_public_insert" on public.partner_requests;
create policy "partner_requests_public_insert" on public.partner_requests for insert to anon, authenticated with check (true);
drop policy if exists "partner_requests_admin_read" on public.partner_requests;
create policy "partner_requests_admin_read" on public.partner_requests for select to authenticated using ((auth.jwt() ->> 'email') = 'ezzouhir2122@gmail.com');
drop policy if exists "partner_requests_admin_update" on public.partner_requests;
create policy "partner_requests_admin_update" on public.partner_requests for update to authenticated using ((auth.jwt() ->> 'email') = 'ezzouhir2122@gmail.com') with check ((auth.jwt() ->> 'email') = 'ezzouhir2122@gmail.com');
grant insert on public.partner_requests to anon, authenticated;
grant select, update on public.partner_requests to authenticated;
