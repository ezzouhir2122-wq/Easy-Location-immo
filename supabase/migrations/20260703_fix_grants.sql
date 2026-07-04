-- Fix: Grant permissions to authenticated role on all tables
-- À exécuter si les tables ont été créées via SQL raw (pas via Supabase Dashboard)

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT ALL ON TABLE public.biens            TO authenticated;
GRANT ALL ON TABLE public.locataires       TO authenticated;
GRANT ALL ON TABLE public.loyers           TO authenticated;
GRANT ALL ON TABLE public.charges          TO authenticated;
GRANT ALL ON TABLE public.contrats         TO authenticated;
GRANT ALL ON TABLE public.documents_generes TO authenticated;

-- Séquences (si nécessaire)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
