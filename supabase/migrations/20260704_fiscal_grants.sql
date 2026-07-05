-- supabase/migrations/20260704_fiscal_grants.sql
-- Grants de lecture sur les tables fiscales (référentiel CGI)
-- Ces tables sont publiques en lecture (pas de RLS) mais nécessitent un GRANT explicite

GRANT SELECT ON TABLE public.tax_laws        TO authenticated, anon;
GRANT SELECT ON TABLE public.tax_brackets    TO authenticated, anon;
GRANT SELECT ON TABLE public.tax_rules       TO authenticated, anon;
GRANT SELECT ON TABLE public.tax_exemptions  TO authenticated, anon;

-- tax_calculations : RLS activé (owner_id), authenticated peut INSERT + SELECT ses propres lignes
GRANT SELECT, INSERT ON TABLE public.tax_calculations TO authenticated;
