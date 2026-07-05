-- supabase/seed/fiscal_reset_complet.sql
-- Script complet : grants + lois + barèmes IR
-- Exécuter EN UNE SEULE FOIS dans le SQL Editor Supabase
-- Idempotent : peut être relancé sans risque

-- ============================================================
-- ÉTAPE 1 : GRANTS (permissions de lecture)
-- ============================================================
GRANT SELECT ON TABLE public.tax_laws        TO authenticated, anon;
GRANT SELECT ON TABLE public.tax_brackets    TO authenticated, anon;
GRANT SELECT ON TABLE public.tax_rules       TO authenticated, anon;
GRANT SELECT ON TABLE public.tax_exemptions  TO authenticated, anon;
GRANT SELECT, INSERT ON TABLE public.tax_calculations TO authenticated;

-- ============================================================
-- ÉTAPE 2 : LOIS DE FINANCES (3 années)
-- ============================================================
INSERT INTO public.tax_laws
  (finance_year, law_number, title, publication_date, effective_date, official_ref, status)
VALUES
  (2024, 'n°50-23',
   'Loi de Finances pour l''année budgétaire 2024',
   '2023-12-29', '2024-01-01',
   'Bulletin Officiel n°7248 du 29 décembre 2023', 'active'),
  (2025, 'n°60-24',
   'Loi de Finances pour l''année budgétaire 2025',
   '2024-12-31', '2025-01-01',
   'Bulletin Officiel n°7339 du 31 décembre 2024', 'active'),
  (2026, 'n°70-25',
   'Loi de Finances pour l''année budgétaire 2026',
   '2025-12-31', '2026-01-01',
   'Bulletin Officiel n°7350 du 31 décembre 2025', 'active')
ON CONFLICT DO NOTHING;

-- ============================================================
-- ÉTAPE 3 : BARÈMES IR (DELETE + INSERT pour éviter doublons)
-- ============================================================
DO $$
DECLARE
  v_2026 uuid;
  v_2025 uuid;
  v_2024 uuid;
BEGIN
  SELECT id INTO v_2026 FROM public.tax_laws WHERE finance_year = 2026;
  SELECT id INTO v_2025 FROM public.tax_laws WHERE finance_year = 2025;
  SELECT id INTO v_2024 FROM public.tax_laws WHERE finance_year = 2024;

  -- Nettoyage préventif
  DELETE FROM public.tax_brackets
  WHERE law_id IN (v_2026, v_2025, v_2024)
    AND tax_type IN ('ir_foncier', 'ir_foncier_forfaitaire');

  -- Barème 2026 actualisé (DGI Maroc, LF 2026)
  INSERT INTO public.tax_brackets
    (law_id, tax_type, tranche_min, tranche_max, rate, deduction_fixe, effective_date, article_cgi, loi_finances)
  VALUES
    (v_2026, 'ir_foncier',               0,  40000, 0.0000,     0, '2026-01-01', 'Art. 73-II-B CGI', 'LF 2026'),
    (v_2026, 'ir_foncier',           40001,  60000, 0.1000,  4000, '2026-01-01', 'Art. 73-II-B CGI', 'LF 2026'),
    (v_2026, 'ir_foncier',           60001,  80000, 0.2000, 10000, '2026-01-01', 'Art. 73-II-B CGI', 'LF 2026'),
    (v_2026, 'ir_foncier',           80001, 100000, 0.3000, 18000, '2026-01-01', 'Art. 73-II-B CGI', 'LF 2026'),
    (v_2026, 'ir_foncier',          100001, 180000, 0.3400, 22000, '2026-01-01', 'Art. 73-II-B CGI', 'LF 2026'),
    (v_2026, 'ir_foncier',          180001,   NULL, 0.3700, 27400, '2026-01-01', 'Art. 73-II-B CGI', 'LF 2026'),
    (v_2026, 'ir_foncier_forfaitaire',   0, 120000, 0.1500,     0, '2026-01-01', 'Art. 73-II-B CGI', 'LF 2026');

  -- Barème 2025
  INSERT INTO public.tax_brackets
    (law_id, tax_type, tranche_min, tranche_max, rate, deduction_fixe, effective_date, article_cgi, loi_finances)
  VALUES
    (v_2025, 'ir_foncier',               0,  30000, 0.0000,     0, '2025-01-01', 'Art. 73-II-B CGI', 'LF 2025'),
    (v_2025, 'ir_foncier',           30001,  50000, 0.1000,  3000, '2025-01-01', 'Art. 73-II-B CGI', 'LF 2025'),
    (v_2025, 'ir_foncier',           50001,  60000, 0.2000,  8000, '2025-01-01', 'Art. 73-II-B CGI', 'LF 2025'),
    (v_2025, 'ir_foncier',           60001,  80000, 0.3000, 14000, '2025-01-01', 'Art. 73-II-B CGI', 'LF 2025'),
    (v_2025, 'ir_foncier',           80001, 180000, 0.3400, 17200, '2025-01-01', 'Art. 73-II-B CGI', 'LF 2025'),
    (v_2025, 'ir_foncier',          180001,   NULL, 0.3800, 24400, '2025-01-01', 'Art. 73-II-B CGI', 'LF 2025'),
    (v_2025, 'ir_foncier_forfaitaire',   0, 120000, 0.1500,     0, '2025-01-01', 'Art. 73-II-B CGI', 'LF 2025');

  -- Barème 2024
  INSERT INTO public.tax_brackets
    (law_id, tax_type, tranche_min, tranche_max, rate, deduction_fixe, effective_date, article_cgi, loi_finances)
  VALUES
    (v_2024, 'ir_foncier',               0,  30000, 0.0000,     0, '2024-01-01', 'Art. 73-II-B CGI', 'LF 2024'),
    (v_2024, 'ir_foncier',           30001,  50000, 0.1000,  3000, '2024-01-01', 'Art. 73-II-B CGI', 'LF 2024'),
    (v_2024, 'ir_foncier',           50001,  60000, 0.2000,  8000, '2024-01-01', 'Art. 73-II-B CGI', 'LF 2024'),
    (v_2024, 'ir_foncier',           60001,  80000, 0.3000, 14000, '2024-01-01', 'Art. 73-II-B CGI', 'LF 2024'),
    (v_2024, 'ir_foncier',           80001, 180000, 0.3400, 17200, '2024-01-01', 'Art. 73-II-B CGI', 'LF 2024'),
    (v_2024, 'ir_foncier',          180001,   NULL, 0.3800, 24400, '2024-01-01', 'Art. 73-II-B CGI', 'LF 2024'),
    (v_2024, 'ir_foncier_forfaitaire',   0, 120000, 0.1500,     0, '2024-01-01', 'Art. 73-II-B CGI', 'LF 2024');

  RAISE NOTICE 'OK — grants appliqués, 3 lois, 21 tranches IR insérées';
END $$;
