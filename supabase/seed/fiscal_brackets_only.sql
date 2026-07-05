-- supabase/seed/fiscal_brackets_only.sql
-- Insère UNIQUEMENT les barèmes IR (tax_brackets)
-- Sécurisé : supprime les doublons éventuels avant d'insérer
-- Exécuter si tax_brackets est vide ou incomplet

DO $$
DECLARE
  v_law_id_2026 uuid;
  v_law_id_2025 uuid;
  v_law_id_2024 uuid;
BEGIN
  SELECT id INTO v_law_id_2026 FROM public.tax_laws WHERE finance_year = 2026;
  SELECT id INTO v_law_id_2025 FROM public.tax_laws WHERE finance_year = 2025;
  SELECT id INTO v_law_id_2024 FROM public.tax_laws WHERE finance_year = 2024;

  -- Supprime les barèmes existants pour éviter les doublons
  DELETE FROM public.tax_brackets
  WHERE law_id IN (v_law_id_2026, v_law_id_2025, v_law_id_2024)
    AND tax_type IN ('ir_foncier', 'ir_foncier_forfaitaire');

  -- ============================================================
  -- BARÈME IR FONCIER 2026 — Art. 73-II-B CGI, LF 2026
  -- Source : DGI Maroc — Barème actualisé LF 2026
  -- ============================================================
  INSERT INTO public.tax_brackets
    (law_id, tax_type, tranche_min, tranche_max, rate, deduction_fixe, effective_date, article_cgi, loi_finances)
  VALUES
    (v_law_id_2026, 'ir_foncier',               0,  40000, 0.0000,     0, '2026-01-01', 'Art. 73-II-B CGI', 'LF 2026'),
    (v_law_id_2026, 'ir_foncier',           40001,  60000, 0.1000,  4000, '2026-01-01', 'Art. 73-II-B CGI', 'LF 2026'),
    (v_law_id_2026, 'ir_foncier',           60001,  80000, 0.2000, 10000, '2026-01-01', 'Art. 73-II-B CGI', 'LF 2026'),
    (v_law_id_2026, 'ir_foncier',           80001, 100000, 0.3000, 18000, '2026-01-01', 'Art. 73-II-B CGI', 'LF 2026'),
    (v_law_id_2026, 'ir_foncier',          100001, 180000, 0.3400, 22000, '2026-01-01', 'Art. 73-II-B CGI', 'LF 2026'),
    (v_law_id_2026, 'ir_foncier',          180001,   NULL, 0.3700, 27400, '2026-01-01', 'Art. 73-II-B CGI', 'LF 2026'),
    (v_law_id_2026, 'ir_foncier_forfaitaire',   0, 120000, 0.1500,     0, '2026-01-01', 'Art. 73-II-B CGI', 'LF 2026');

  -- ============================================================
  -- BARÈME IR FONCIER 2025 — Art. 73-II-B CGI, LF 2025
  -- ============================================================
  INSERT INTO public.tax_brackets
    (law_id, tax_type, tranche_min, tranche_max, rate, deduction_fixe, effective_date, article_cgi, loi_finances)
  VALUES
    (v_law_id_2025, 'ir_foncier',               0,  30000, 0.0000,     0, '2025-01-01', 'Art. 73-II-B CGI', 'LF 2025'),
    (v_law_id_2025, 'ir_foncier',           30001,  50000, 0.1000,  3000, '2025-01-01', 'Art. 73-II-B CGI', 'LF 2025'),
    (v_law_id_2025, 'ir_foncier',           50001,  60000, 0.2000,  8000, '2025-01-01', 'Art. 73-II-B CGI', 'LF 2025'),
    (v_law_id_2025, 'ir_foncier',           60001,  80000, 0.3000, 14000, '2025-01-01', 'Art. 73-II-B CGI', 'LF 2025'),
    (v_law_id_2025, 'ir_foncier',           80001, 180000, 0.3400, 17200, '2025-01-01', 'Art. 73-II-B CGI', 'LF 2025'),
    (v_law_id_2025, 'ir_foncier',          180001,   NULL, 0.3800, 24400, '2025-01-01', 'Art. 73-II-B CGI', 'LF 2025'),
    (v_law_id_2025, 'ir_foncier_forfaitaire',   0, 120000, 0.1500,     0, '2025-01-01', 'Art. 73-II-B CGI', 'LF 2025');

  -- ============================================================
  -- BARÈME IR FONCIER 2024 — Art. 73-II-B CGI, LF 2024
  -- ============================================================
  INSERT INTO public.tax_brackets
    (law_id, tax_type, tranche_min, tranche_max, rate, deduction_fixe, effective_date, article_cgi, loi_finances)
  VALUES
    (v_law_id_2024, 'ir_foncier',               0,  30000, 0.0000,     0, '2024-01-01', 'Art. 73-II-B CGI', 'LF 2024'),
    (v_law_id_2024, 'ir_foncier',           30001,  50000, 0.1000,  3000, '2024-01-01', 'Art. 73-II-B CGI', 'LF 2024'),
    (v_law_id_2024, 'ir_foncier',           50001,  60000, 0.2000,  8000, '2024-01-01', 'Art. 73-II-B CGI', 'LF 2024'),
    (v_law_id_2024, 'ir_foncier',           60001,  80000, 0.3000, 14000, '2024-01-01', 'Art. 73-II-B CGI', 'LF 2024'),
    (v_law_id_2024, 'ir_foncier',           80001, 180000, 0.3400, 17200, '2024-01-01', 'Art. 73-II-B CGI', 'LF 2024'),
    (v_law_id_2024, 'ir_foncier',          180001,   NULL, 0.3800, 24400, '2024-01-01', 'Art. 73-II-B CGI', 'LF 2024'),
    (v_law_id_2024, 'ir_foncier_forfaitaire',   0, 120000, 0.1500,     0, '2024-01-01', 'Art. 73-II-B CGI', 'LF 2024');

  RAISE NOTICE 'Barèmes IR insérés : 21 tranches (7 × 3 années)';
END $$;
