# Blueprint 02 — Schéma Supabase

## Création des Tables

Exécuter dans l'éditeur SQL de Supabase :

```sql
-- Extension pour les UUIDs
create extension if not exists "uuid-ossp";

-- Profils propriétaires (liés à auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  nom text,
  prenom text,
  telephone text,
  siret text,
  created_at timestamptz default now()
);

-- Biens immobiliers
create table biens (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references profiles(id) on delete cascade not null,
  nom text not null,
  adresse text not null,
  ville text,
  code_postal text,
  type text check (type in ('appartement', 'maison', 'studio', 'local_commercial', 'parking', 'autre')),
  surface numeric(8,2),
  nb_pieces integer,
  etage integer,
  loyer_base numeric(10,2),
  charges numeric(10,2) default 0,
  depot_garantie numeric(10,2),
  dpe text check (dpe in ('A','B','C','D','E','F','G')),
  statut text check (statut in ('libre', 'occupe', 'en_travaux', 'a_vendre')) default 'libre',
  description text,
  photos text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Locataires
create table locataires (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references profiles(id) on delete cascade not null,
  nom text not null,
  prenom text not null,
  email text,
  telephone text,
  date_naissance date,
  lieu_naissance text,
  profession text,
  revenus_mensuels numeric(10,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Contrats de bail
create table contrats (
  id uuid default uuid_generate_v4() primary key,
  bien_id uuid references biens(id) on delete restrict not null,
  locataire_id uuid references locataires(id) on delete restrict not null,
  date_debut date not null,
  date_fin date,
  type_bail text check (type_bail in ('vide', 'meuble', 'commercial', 'etudiant')) default 'vide',
  loyer numeric(10,2) not null,
  charges numeric(10,2) default 0,
  depot_garantie numeric(10,2),
  jour_echeance integer default 1,
  statut text check (statut in ('actif', 'termine', 'resilie', 'en_attente')) default 'actif',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Paiements de loyer
create table paiements (
  id uuid default uuid_generate_v4() primary key,
  contrat_id uuid references contrats(id) on delete cascade not null,
  periode date not null, -- Premier jour du mois concerné
  montant_loyer numeric(10,2) not null,
  montant_charges numeric(10,2) default 0,
  date_paiement date,
  mode_paiement text check (mode_paiement in ('virement', 'cheque', 'especes', 'prelevement', 'stripe')),
  statut text check (statut in ('en_attente', 'paye', 'retard', 'partiel')) default 'en_attente',
  notes text,
  created_at timestamptz default now()
);

-- Documents
create table documents (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references profiles(id) on delete cascade not null,
  bien_id uuid references biens(id) on delete set null,
  locataire_id uuid references locataires(id) on delete set null,
  contrat_id uuid references contrats(id) on delete set null,
  type text check (type in ('bail', 'quittance', 'etat_des_lieux', 'piece_identite', 'fiche_paie', 'dpe', 'facture', 'autre')),
  nom text not null,
  url text not null,
  taille bigint,
  created_at timestamptz default now()
);
```

## Row Level Security (RLS)

```sql
-- Activer RLS sur toutes les tables
alter table profiles enable row level security;
alter table biens enable row level security;
alter table locataires enable row level security;
alter table contrats enable row level security;
alter table paiements enable row level security;
alter table documents enable row level security;

-- Policies profiles
create policy "profiles_own" on profiles for all using (auth.uid() = id);

-- Policies biens
create policy "biens_own" on biens for all using (auth.uid() = owner_id);

-- Policies locataires
create policy "locataires_own" on locataires for all using (auth.uid() = owner_id);

-- Policies contrats (via bien)
create policy "contrats_own" on contrats for all
  using (exists (select 1 from biens where biens.id = contrats.bien_id and biens.owner_id = auth.uid()));

-- Policies paiements (via contrat → bien)
create policy "paiements_own" on paiements for all
  using (exists (
    select 1 from contrats
    join biens on biens.id = contrats.bien_id
    where contrats.id = paiements.contrat_id
    and biens.owner_id = auth.uid()
  ));

-- Policies documents
create policy "documents_own" on documents for all using (auth.uid() = owner_id);
```

## Trigger : Profil Auto-Créé à l'Inscription

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```
