-- Migration: table contrats (baux)
-- Lie un bien à un locataire avec toutes les conditions du bail

create table if not exists contrats (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  bien_id uuid not null references biens(id) on delete cascade,
  locataire_id uuid not null references locataires(id) on delete cascade,
  date_debut date not null,
  date_fin date,
  loyer_mensuel numeric(10,2) not null,
  charges_mensuelles numeric(10,2) not null default 0,
  depot_garantie numeric(10,2) not null default 0,
  type_bail text not null default 'vide' check (type_bail in ('vide', 'meuble', 'commercial', 'saisonnier', 'autre')),
  statut text not null default 'actif' check (statut in ('actif', 'termine', 'resilie', 'en_attente')),
  reconduction_tacite boolean not null default true,
  preavis_mois integer not null default 3,
  notes text not null default '',
  created_at timestamptz not null default now()
);

-- Index pour les requêtes fréquentes
create index if not exists contrats_owner_id_idx on contrats(owner_id);
create index if not exists contrats_bien_id_idx on contrats(bien_id);
create index if not exists contrats_locataire_id_idx on contrats(locataire_id);
create index if not exists contrats_statut_idx on contrats(statut);

-- RLS
alter table contrats enable row level security;

create policy "contrats_owner_select" on contrats
  for select using (auth.uid() = owner_id);

create policy "contrats_owner_insert" on contrats
  for insert with check (auth.uid() = owner_id);

create policy "contrats_owner_update" on contrats
  for update using (auth.uid() = owner_id);

create policy "contrats_owner_delete" on contrats
  for delete using (auth.uid() = owner_id);
