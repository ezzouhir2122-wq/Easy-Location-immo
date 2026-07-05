-- supabase/seed/fiscal_seed.sql
-- Données CGI Marocain — Lois de Finances 2024 / 2025 / 2026
-- Source : CGI Maroc, DGI, Lois de Finances publiées au B.O.

-- ============================================================
-- LOIS DE FINANCES
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
-- BARÈMES IR FONCIER RÉGIME RÉEL — Art. 73-II-B CGI
-- ============================================================
DO $$
DECLARE
  v_law_id_2026 uuid;
  v_law_id_2025 uuid;
  v_law_id_2024 uuid;
BEGIN
  SELECT id INTO v_law_id_2026 FROM public.tax_laws WHERE finance_year = 2026;
  SELECT id INTO v_law_id_2025 FROM public.tax_laws WHERE finance_year = 2025;
  SELECT id INTO v_law_id_2024 FROM public.tax_laws WHERE finance_year = 2024;

  -- Barème 2026 — actualisé LF 2026 (DGI Maroc)
  INSERT INTO public.tax_brackets
    (law_id, tax_type, tranche_min, tranche_max, rate, deduction_fixe, effective_date, article_cgi, loi_finances)
  VALUES
    (v_law_id_2026, 'ir_foncier',          0,      40000, 0.0000,     0, '2026-01-01', 'Art. 73-II-B CGI', 'LF 2026'),
    (v_law_id_2026, 'ir_foncier',      40001,      60000, 0.1000,  4000, '2026-01-01', 'Art. 73-II-B CGI', 'LF 2026'),
    (v_law_id_2026, 'ir_foncier',      60001,      80000, 0.2000, 10000, '2026-01-01', 'Art. 73-II-B CGI', 'LF 2026'),
    (v_law_id_2026, 'ir_foncier',      80001,     100000, 0.3000, 18000, '2026-01-01', 'Art. 73-II-B CGI', 'LF 2026'),
    (v_law_id_2026, 'ir_foncier',     100001,     180000, 0.3400, 22000, '2026-01-01', 'Art. 73-II-B CGI', 'LF 2026'),
    (v_law_id_2026, 'ir_foncier',     180001,       NULL, 0.3700, 27400, '2026-01-01', 'Art. 73-II-B CGI', 'LF 2026'),
    (v_law_id_2026, 'ir_foncier_forfaitaire', 0, 120000, 0.1500, 0, '2026-01-01', 'Art. 73-II-B CGI', 'LF 2026');

  -- Barème 2025 (même barème)
  INSERT INTO public.tax_brackets
    (law_id, tax_type, tranche_min, tranche_max, rate, deduction_fixe, effective_date, article_cgi, loi_finances)
  VALUES
    (v_law_id_2025, 'ir_foncier',          0,      30000, 0.0000,     0, '2025-01-01', 'Art. 73-II-B CGI', 'LF 2025'),
    (v_law_id_2025, 'ir_foncier',      30001,      50000, 0.1000,  3000, '2025-01-01', 'Art. 73-II-B CGI', 'LF 2025'),
    (v_law_id_2025, 'ir_foncier',      50001,      60000, 0.2000,  8000, '2025-01-01', 'Art. 73-II-B CGI', 'LF 2025'),
    (v_law_id_2025, 'ir_foncier',      60001,      80000, 0.3000, 14000, '2025-01-01', 'Art. 73-II-B CGI', 'LF 2025'),
    (v_law_id_2025, 'ir_foncier',      80001,     180000, 0.3400, 17200, '2025-01-01', 'Art. 73-II-B CGI', 'LF 2025'),
    (v_law_id_2025, 'ir_foncier',     180001,       NULL, 0.3800, 24400, '2025-01-01', 'Art. 73-II-B CGI', 'LF 2025'),
    (v_law_id_2025, 'ir_foncier_forfaitaire', 0, 120000, 0.1500, 0, '2025-01-01', 'Art. 73-II-B CGI', 'LF 2025');

  -- Barème 2024
  INSERT INTO public.tax_brackets
    (law_id, tax_type, tranche_min, tranche_max, rate, deduction_fixe, effective_date, article_cgi, loi_finances)
  VALUES
    (v_law_id_2024, 'ir_foncier',          0,      30000, 0.0000,     0, '2024-01-01', 'Art. 73-II-B CGI', 'LF 2024'),
    (v_law_id_2024, 'ir_foncier',      30001,      50000, 0.1000,  3000, '2024-01-01', 'Art. 73-II-B CGI', 'LF 2024'),
    (v_law_id_2024, 'ir_foncier',      50001,      60000, 0.2000,  8000, '2024-01-01', 'Art. 73-II-B CGI', 'LF 2024'),
    (v_law_id_2024, 'ir_foncier',      60001,      80000, 0.3000, 14000, '2024-01-01', 'Art. 73-II-B CGI', 'LF 2024'),
    (v_law_id_2024, 'ir_foncier',      80001,     180000, 0.3400, 17200, '2024-01-01', 'Art. 73-II-B CGI', 'LF 2024'),
    (v_law_id_2024, 'ir_foncier',     180001,       NULL, 0.3800, 24400, '2024-01-01', 'Art. 73-II-B CGI', 'LF 2024'),
    (v_law_id_2024, 'ir_foncier_forfaitaire', 0, 120000, 0.1500, 0, '2024-01-01', 'Art. 73-II-B CGI', 'LF 2024');

  -- ========================================================
  -- RÈGLES MÉTIER
  -- ========================================================
  INSERT INTO public.tax_rules
    (law_id, category, rule_key, label, description, article_cgi, note_service_dgi,
     priority, formula, conditions, effective_date)
  VALUES
    -- Abattement forfaitaire 40%
    (v_law_id_2026, 'abattement', 'ir_foncier.abattement_forfaitaire',
     'Abattement forfaitaire 40%',
     'Abattement de 40% appliqué aux revenus bruts en régime forfaitaire (revenus ≤ 120 000 DH)',
     'Art. 64-I CGI', NULL, 10,
     '{"op":"multiply","field":"revenus_encaisses","factor":0.4}',
     '[{"field":"regime","op":"eq","value":"forfaitaire"}]',
     '2026-01-01'),

    -- Taux forfaitaire 15%
    (v_law_id_2026, 'regime_special', 'ir_foncier.taux_forfaitaire_15',
     'Taux forfaitaire 15% (revenus bruts ≤ 120 000 DH)',
     'Taux d''imposition de 15% applicable lorsque les revenus fonciers bruts annuels sont inférieurs ou égaux à 120 000 DH',
     'Art. 73-II-B CGI', NULL, 5,
     '{"op":"multiply","field":"revenu_net_imposable","factor":0.15}',
     '[{"field":"revenu_brut","op":"lte","value":120000},{"field":"regime","op":"eq","value":"forfaitaire"}]',
     '2026-01-01'),

    -- Déduction travaux
    (v_law_id_2026, 'deduction', 'ir_foncier.deduction_travaux',
     'Déduction des charges de travaux (régime réel)',
     'Les dépenses de travaux d''entretien, réparation et amélioration sont déductibles en régime réel',
     'Art. 64-II CGI', NULL, 20,
     '{"op":"fixed","value":0}',
     '[{"field":"regime","op":"eq","value":"reel"}]',
     '2026-01-01'),

    -- Déduction intérêts
    (v_law_id_2026, 'deduction', 'ir_foncier.deduction_interets',
     'Déduction des intérêts d''emprunts (régime réel)',
     'Les intérêts des emprunts contractés pour l''acquisition, la construction ou l''amélioration du bien sont déductibles',
     'Art. 64-II CGI', NULL, 21,
     '{"op":"fixed","value":0}',
     '[{"field":"regime","op":"eq","value":"reel"}]',
     '2026-01-01'),

    -- Retenue à la source locataire professionnel
    (v_law_id_2026, 'retenue_source', 'ir_foncier.retenue_source_locataire_pro',
     'Retenue à la source — locataire professionnel',
     'Lorsque le locataire est une personne morale ou une personne physique disposant de revenus professionnels, il est tenu d''opérer une retenue à la source de 10.5% sur le montant du loyer brut',
     'Art. 160 CGI', NULL, 50,
     '{"op":"multiply","field":"revenus_encaisses","factor":0.105}',
     '[{"field":"type_bail","op":"in","values":["commercial","professionnel"]}]',
     '2026-01-01'),

    -- Loyers non encaissés
    (v_law_id_2026, 'deduction', 'ir_foncier.loyers_non_encaisses',
     'Non-imposition des loyers non encaissés',
     'Les loyers non encaissés ne sont pas imposables, sous réserve de justification (mise en demeure, procédure judiciaire)',
     'Art. 61-II CGI', NULL, 15,
     '{"op":"subtract","field":"revenu_brut","minus":"revenus_encaisses"}',
     '[]',
     '2026-01-01');

  -- ========================================================
  -- EXONÉRATIONS
  -- ========================================================
  INSERT INTO public.tax_exemptions
    (law_id, exemption_type, label, description, property_types, conditions,
     duration_years, rate, article_cgi, effective_date)
  VALUES
    -- Exonération revenus ≤ 30 000 DH
    (v_law_id_2026, 'permanente',
     'Exonération totale — revenus fonciers ≤ 30 000 DH/an',
     'Les propriétaires dont le total des revenus fonciers bruts annuels est inférieur ou égal à 30 000 DH sont totalement exonérés de l''IR foncier',
     '{}',
     '[{"field":"revenu_brut","op":"lte","value":30000}]',
     NULL, 1.0, 'Art. 73-II-B CGI', '2026-01-01'),

    -- Logement social
    (v_law_id_2026, 'temporaire',
     'Exonération logement social (superficie ≤ 100m², prix ≤ 250 000 DH)',
     'Exonération de 5 ans pour les logements sociaux dont la superficie couverte est comprise entre 50 et 100 m² et dont le prix de cession TTC n''excède pas 250 000 DH',
     '{"logement_social"}',
     '[{"field":"surface","op":"lte","value":100},{"field":"valeur_acquisition","op":"lte","value":250000}]',
     5, 1.0, 'Art. 247-VI CGI', '2026-01-01'),

    -- Premier logement
    (v_law_id_2026, 'permanente',
     'Exonération premier logement principal — propriétaire occupant',
     'Le logement destiné à l''habitation principale du propriétaire est exonéré de l''IR foncier',
     '{"appartement","villa","maison","studio"}',
     '[{"field":"usage","op":"eq","value":"habitation"}]',
     NULL, 1.0, 'Art. 74-I CGI', '2026-01-01'),

    -- Logement neuf VEFA
    (v_law_id_2026, 'temporaire',
     'Exonération logement neuf VEFA mis en location',
     'Exonération de 3 ans pour les logements acquis en VEFA et mis en location pour la première fois',
     '{"appartement","villa","maison","studio"}',
     '[{"field":"is_vefa","op":"eq","value":true}]',
     3, 1.0, 'Art. 247 CGI', '2026-01-01');

END $$;
