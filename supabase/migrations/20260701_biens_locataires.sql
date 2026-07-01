-- Migration: Création des tables biens et locataires
-- À exécuter dans Supabase Dashboard > SQL Editor

-- =====================
-- TABLE: biens
-- =====================
CREATE TABLE IF NOT EXISTS public.biens (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom             text NOT NULL,
  adresse         text NOT NULL DEFAULT '',
  ville           text NOT NULL DEFAULT '',
  code_postal     text NOT NULL DEFAULT '',
  type            text NOT NULL DEFAULT 'appartement'
                    CHECK (type IN ('appartement','maison','studio','local_commercial','parking','autre')),
  surface         numeric(8,2) NOT NULL DEFAULT 0,
  nb_pieces       integer NOT NULL DEFAULT 0,
  etage           integer NOT NULL DEFAULT 0,
  loyer_base      numeric(10,2) NOT NULL DEFAULT 0,
  charges         numeric(10,2) NOT NULL DEFAULT 0,
  depot_garantie  numeric(10,2) NOT NULL DEFAULT 0,
  dpe             char(1) NOT NULL DEFAULT 'D'
                    CHECK (dpe IN ('A','B','C','D','E','F','G')),
  statut          text NOT NULL DEFAULT 'libre'
                    CHECK (statut IN ('libre','occupe','en_travaux','a_vendre')),
  description     text NOT NULL DEFAULT '',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.biens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "biens_select_own" ON public.biens
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "biens_insert_own" ON public.biens
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "biens_update_own" ON public.biens
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "biens_delete_own" ON public.biens
  FOR DELETE USING (auth.uid() = owner_id);

-- =====================
-- TABLE: locataires
-- =====================
CREATE TABLE IF NOT EXISTS public.locataires (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom              text NOT NULL,
  prenom           text NOT NULL,
  email            text NOT NULL DEFAULT '',
  telephone        text NOT NULL DEFAULT '',
  date_naissance   date,
  lieu_naissance   text NOT NULL DEFAULT '',
  profession       text NOT NULL DEFAULT '',
  revenus_mensuels numeric(10,2) NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.locataires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "locataires_select_own" ON public.locataires
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "locataires_insert_own" ON public.locataires
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "locataires_update_own" ON public.locataires
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "locataires_delete_own" ON public.locataires
  FOR DELETE USING (auth.uid() = owner_id);
