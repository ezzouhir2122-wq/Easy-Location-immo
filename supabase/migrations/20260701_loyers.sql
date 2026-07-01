-- Migration : Table loyers
-- À exécuter dans Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS public.loyers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bien_id         uuid REFERENCES public.biens(id) ON DELETE SET NULL,
  locataire_id    uuid REFERENCES public.locataires(id) ON DELETE SET NULL,
  montant         numeric(10,2) NOT NULL DEFAULT 0,
  date_echeance   date NOT NULL,
  date_paiement   date,
  statut          text NOT NULL DEFAULT 'en_attente'
                    CHECK (statut IN ('paye','en_attente','retard','partiel')),
  type            text NOT NULL DEFAULT 'loyer'
                    CHECK (type IN ('loyer','charge','depot_garantie','autre')),
  notes           text NOT NULL DEFAULT '',
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.loyers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "loyers_select_own" ON public.loyers;
DROP POLICY IF EXISTS "loyers_insert_own" ON public.loyers;
DROP POLICY IF EXISTS "loyers_update_own" ON public.loyers;
DROP POLICY IF EXISTS "loyers_delete_own" ON public.loyers;

CREATE POLICY "loyers_select_own" ON public.loyers
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "loyers_insert_own" ON public.loyers
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "loyers_update_own" ON public.loyers
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "loyers_delete_own" ON public.loyers
  FOR DELETE USING (auth.uid() = owner_id);
