-- SaaS Easy Location IMMO : profils, rôles et abonnements.
-- À exécuter dans Supabase SQL Editor ou via supabase db push.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nom text default '',
  prenom text default '',
  telephone text default '',
  cin text default '',
  adresse text default '',
  ville text default '',
  societe text default '',
  rib text default '',
  role text not null default 'client' check (role in ('admin', 'client')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Compatibilité avec l'ancienne table profiles déjà présente dans le projet.
alter table public.profiles add column if not exists role text default 'client';
alter table public.profiles add column if not exists status text default 'active';
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();
update public.profiles set role = coalesce(role, 'client'), status = coalesce(status, 'active');
alter table public.profiles alter column role set default 'client';
alter table public.profiles alter column status set default 'active';

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null default 'basic' check (plan in ('basic', 'pro', 'agency')),
  status text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'canceled', 'incomplete')),
  start_date date not null default current_date,
  end_date date,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated
  using (id = auth.uid() or (auth.jwt() ->> 'email') = 'ezzouhir2122@gmail.com');

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles for update to authenticated
  using ((auth.jwt() ->> 'email') = 'ezzouhir2122@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'ezzouhir2122@gmail.com');

drop policy if exists "subscriptions_select_owner_or_admin" on public.subscriptions;
create policy "subscriptions_select_owner_or_admin" on public.subscriptions for select to authenticated
  using (user_id = auth.uid() or (auth.jwt() ->> 'email') = 'ezzouhir2122@gmail.com');

drop policy if exists "subscriptions_admin_write" on public.subscriptions;
create policy "subscriptions_admin_write" on public.subscriptions for all to authenticated
  using ((auth.jwt() ->> 'email') = 'ezzouhir2122@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'ezzouhir2122@gmail.com');

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    coalesce(new.email, ''),
    case when lower(coalesce(new.email, '')) = 'ezzouhir2122@gmail.com' then 'admin' else 'client' end
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Répare le compte administrateur s’il existait avant cette migration.
update public.profiles
set role = 'admin', status = 'active', updated_at = now()
where lower(email) = 'ezzouhir2122@gmail.com';

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.subscriptions to authenticated;
