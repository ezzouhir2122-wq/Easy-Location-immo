-- Migration : Table documents_generes
-- Exécuter dans Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS public.documents_generes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type           text NOT NULL CHECK (type IN ('quittance','bail','etat_des_lieux')),
  titre          text NOT NULL DEFAULT '',
  data           jsonb NOT NULL DEFAULT '{}',
  bien_id        uuid REFERENCES public.biens(id) ON DELETE SET NULL,
  locataire_id   uuid REFERENCES public.locataires(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.documents_generes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "docgen_select_own" ON public.documents_generes;
DROP POLICY IF EXISTS "docgen_insert_own" ON public.documents_generes;
DROP POLICY IF EXISTS "docgen_update_own" ON public.documents_generes;
DROP POLICY IF EXISTS "docgen_delete_own" ON public.documents_generes;

CREATE POLICY "docgen_select_own" ON public.documents_generes
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "docgen_insert_own" ON public.documents_generes
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "docgen_update_own" ON public.documents_generes
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "docgen_delete_own" ON public.documents_generes
  FOR DELETE USING (auth.uid() = owner_id);
