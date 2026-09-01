create table if not exists public.saas_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'MAD',
  status text not null default 'pending' check (status in ('paid', 'pending', 'failed')),
  provider text not null default 'manual',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.saas_payments enable row level security;
drop policy if exists "saas_payments_admin_all" on public.saas_payments;
create policy "saas_payments_admin_all" on public.saas_payments for all to authenticated using ((auth.jwt() ->> 'email') = 'ezzouhir2122@gmail.com') with check ((auth.jwt() ->> 'email') = 'ezzouhir2122@gmail.com');
grant select, insert, update, delete on public.saas_payments to authenticated;
