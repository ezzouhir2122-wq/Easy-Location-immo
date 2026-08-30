-- Easy Location Immo — socle conciergerie et comptabilité immobilière
-- À exécuter après les migrations biens/locataires/loyers/charges.

CREATE TABLE IF NOT EXISTS public.reservations_conciergerie (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bien_id uuid NOT NULL REFERENCES public.biens(id) ON DELETE CASCADE,
  nom_client text NOT NULL,
  email_client text NOT NULL DEFAULT '',
  telephone_client text NOT NULL DEFAULT '',
  date_arrivee date NOT NULL,
  date_depart date NOT NULL,
  nombre_voyageurs integer NOT NULL DEFAULT 1 CHECK (nombre_voyageurs > 0),
  canal text NOT NULL DEFAULT 'direct' CHECK (canal IN ('direct','airbnb','booking','agence','autre')),
  statut text NOT NULL DEFAULT 'a_confirmer' CHECK (statut IN ('a_confirmer','confirmee','en_cours','terminee','annulee')),
  montant_brut numeric(12,2) NOT NULL DEFAULT 0 CHECK (montant_brut >= 0),
  commission_taux numeric(5,2) NOT NULL DEFAULT 0 CHECK (commission_taux >= 0 AND commission_taux <= 100),
  frais_menage numeric(12,2) NOT NULL DEFAULT 0 CHECK (frais_menage >= 0),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reservation_dates_valides CHECK (date_depart > date_arrivee)
);
CREATE INDEX IF NOT EXISTS reservations_conciergerie_owner_dates_idx ON public.reservations_conciergerie(owner_id, date_arrivee, date_depart);
ALTER TABLE public.reservations_conciergerie ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reservations_conciergerie_all_own" ON public.reservations_conciergerie;
CREATE POLICY "reservations_conciergerie_all_own" ON public.reservations_conciergerie FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.taches_conciergerie (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bien_id uuid REFERENCES public.biens(id) ON DELETE SET NULL,
  reservation_id uuid REFERENCES public.reservations_conciergerie(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'autre' CHECK (type IN ('menage','linge','check_in','check_out','maintenance','approvisionnement','autre')),
  titre text NOT NULL,
  description text NOT NULL DEFAULT '',
  assignee_nom text NOT NULL DEFAULT '',
  assignee_telephone text NOT NULL DEFAULT '',
  priorite text NOT NULL DEFAULT 'normale' CHECK (priorite IN ('basse','normale','haute','urgente')),
  statut text NOT NULL DEFAULT 'a_faire' CHECK (statut IN ('a_faire','en_cours','terminee','annulee')),
  date_prevue timestamptz,
  cout_estime numeric(12,2) NOT NULL DEFAULT 0 CHECK (cout_estime >= 0),
  cout_reel numeric(12,2) NOT NULL DEFAULT 0 CHECK (cout_reel >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS taches_conciergerie_owner_status_date_idx ON public.taches_conciergerie(owner_id, statut, date_prevue);
ALTER TABLE public.taches_conciergerie ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "taches_conciergerie_all_own" ON public.taches_conciergerie;
CREATE POLICY "taches_conciergerie_all_own" ON public.taches_conciergerie FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.compta_comptes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  libelle text NOT NULL,
  classe smallint NOT NULL CHECK (classe BETWEEN 1 AND 7),
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, code)
);

CREATE TABLE IF NOT EXISTS public.compta_ecritures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bien_id uuid REFERENCES public.biens(id) ON DELETE SET NULL,
  reservation_id uuid REFERENCES public.reservations_conciergerie(id) ON DELETE SET NULL,
  date_operation date NOT NULL,
  libelle text NOT NULL,
  reference text NOT NULL DEFAULT '',
  source_type text NOT NULL DEFAULT 'manuel' CHECK (source_type IN ('manuel','loyer','charge','reservation','remboursement','fiscalite')),
  source_id uuid,
  statut text NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon','validee','rapprochee')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.compta_lignes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ecriture_id uuid NOT NULL REFERENCES public.compta_ecritures(id) ON DELETE CASCADE,
  compte_id uuid NOT NULL REFERENCES public.compta_comptes(id) ON DELETE RESTRICT,
  libelle text NOT NULL DEFAULT '',
  debit numeric(14,2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit numeric(14,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ligne_un_seul_sens CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))
);
CREATE INDEX IF NOT EXISTS compta_ecritures_owner_date_idx ON public.compta_ecritures(owner_id, date_operation);
CREATE INDEX IF NOT EXISTS compta_lignes_ecriture_idx ON public.compta_lignes(ecriture_id);
ALTER TABLE public.compta_comptes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compta_ecritures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compta_lignes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "compta_comptes_all_own" ON public.compta_comptes;
DROP POLICY IF EXISTS "compta_ecritures_all_own" ON public.compta_ecritures;
DROP POLICY IF EXISTS "compta_lignes_all_own" ON public.compta_lignes;
CREATE POLICY "compta_comptes_all_own" ON public.compta_comptes FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "compta_ecritures_all_own" ON public.compta_ecritures FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "compta_lignes_all_own" ON public.compta_lignes FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
