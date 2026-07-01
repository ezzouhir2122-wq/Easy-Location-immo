-- Migration : Table charges
-- À exécuter dans Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS public.charges (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bien_id     uuid REFERENCES public.biens(id) ON DELETE SET NULL,
  type        text NOT NULL DEFAULT 'autre'
                CHECK (type IN ('eau','electricite','internet','assurance','entretien','taxe','autre')),
  montant     numeric(10,2) NOT NULL DEFAULT 0,
  date        date NOT NULL,
  description text NOT NULL DEFAULT '',
  statut      text NOT NULL DEFAULT 'en_attente'
                CHECK (statut IN ('paye','en_attente')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.charges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "charges_select_own" ON public.charges;
DROP POLICY IF EXISTS "charges_insert_own" ON public.charges;
DROP POLICY IF EXISTS "charges_update_own" ON public.charges;
DROP POLICY IF EXISTS "charges_delete_own" ON public.charges;

CREATE POLICY "charges_select_own" ON public.charges
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "charges_insert_own" ON public.charges
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "charges_update_own" ON public.charges
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "charges_delete_own" ON public.charges
  FOR DELETE USING (auth.uid() = owner_id);
