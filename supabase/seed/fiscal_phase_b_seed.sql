-- ============================================================
-- Seed Phase B — TVA + Taxe d'Habitation + TSC
-- Référence : CGI Maroc, LF 2026
-- Exécuter dans : Supabase Dashboard > SQL Editor
-- ============================================================

-- ── Récupérer l'ID de la loi de finances 2026 ──────────────
DO $$
DECLARE
  law_id_2026 uuid;
BEGIN
  SELECT id INTO law_id_2026 FROM public.tax_laws WHERE finance_year = 2026 LIMIT 1;

  IF law_id_2026 IS NULL THEN
    RAISE EXCEPTION 'Loi de finances 2026 introuvable — exécuter fiscal_seed.sql en premier';
  END IF;

  -- ── Barèmes Taxe d'Habitation (TH) — Art. 31 CGI ──────────
  INSERT INTO public.tax_brackets (law_id, tax_type, tranche_min, tranche_max, rate, deduction_fixe, abattement_rate, effective_date, article_cgi, loi_finances)
  VALUES
    (law_id_2026, 'taxe_habitation',      0,  5000, 0.00, 0,     0, '2026-01-01', 'Art. 31 CGI', 'LF 2026'),
    (law_id_2026, 'taxe_habitation',   5001, 20000, 0.10, 0,     0, '2026-01-01', 'Art. 31 CGI', 'LF 2026'),
    (law_id_2026, 'taxe_habitation',  20001, 40000, 0.20, 2000,  0, '2026-01-01', 'Art. 31 CGI', 'LF 2026'),
    (law_id_2026, 'taxe_habitation',  40001,  NULL, 0.30, 6000,  0, '2026-01-01', 'Art. 31 CGI', 'LF 2026')
  ON CONFLICT DO NOTHING;

  -- ── Barèmes TSC — Art. 32 CGI ──────────────────────────────
  INSERT INTO public.tax_brackets (law_id, tax_type, tranche_min, tranche_max, rate, deduction_fixe, abattement_rate, effective_date, article_cgi, loi_finances)
  VALUES
    (law_id_2026, 'tsc',  0, NULL, 0.105, 0, 0, '2026-01-01', 'Art. 32-I CGI (zone urbaine)',    'LF 2026'),
    (law_id_2026, 'tsc',  0, NULL, 0.065, 0, 0, '2026-01-01', 'Art. 32-I CGI (zone suburbaine)', 'LF 2026')
  ON CONFLICT DO NOTHING;

  -- ── Barème TVA sur loyers commerciaux — Art. 89-I-6° CGI ──
  INSERT INTO public.tax_brackets (law_id, tax_type, tranche_min, tranche_max, rate, deduction_fixe, abattement_rate, effective_date, article_cgi, loi_finances)
  VALUES
    (law_id_2026, 'tva', 0, NULL, 0.20, 0, 0, '2026-01-01', 'Art. 89-I-6° CGI (taux normal)', 'LF 2026'),
    (law_id_2026, 'tva', 0, NULL, 0.10, 0, 0, '2026-01-01', 'Art. 89-I-6° CGI (taux réduit)', 'LF 2026')
  ON CONFLICT DO NOTHING;

  -- ── Règles CGI Phase B ─────────────────────────────────────
  INSERT INTO public.tax_rules (law_id, category, rule_key, label, description, article_cgi, priority, formula, conditions, exceptions, property_types, effective_date, enabled)
  VALUES
    -- TH : abattement résidence principale
    (law_id_2026, 'abattement', 'th_abattement_rp',
     'Abattement résidence principale (75%)',
     'Abattement de 75% sur la TH pour les logements constituant la résidence principale du contribuable',
     'Art. 35 CGI', 10,
     '{"op": "multiply", "field": "th_brut", "factor": 0.75}'::jsonb,
     '[{"field": "residence_principale", "op": "eq", "value": true}]'::jsonb,
     '[]'::jsonb,
     ARRAY['appartement','villa','maison','studio'],
     '2026-01-01', true),

    -- TH : abattement familial
    (law_id_2026, 'abattement', 'th_abattement_familial',
     'Abattement familial TH (360 DH/personne à charge)',
     'Réduction de 360 DH par personne à charge dans la limite de 6 personnes (2 160 DH max)',
     'Art. 36 CGI', 20,
     '{"op": "multiply_fields", "fields": ["nb_personnes_charge", "montant_par_personne"]}'::jsonb,
     '[]'::jsonb,
     '[]'::jsonb,
     ARRAY['appartement','villa','maison','studio'],
     '2026-01-01', true),

    -- TSC : minimum légal
    (law_id_2026, 'regime_special', 'tsc_minimum_legal',
     'Minimum légal TSC (100 DH)',
     'La TSC ne peut être inférieure à 100 DH quel que soit le montant calculé',
     'Art. 32-II CGI', 30,
     '{"op": "fixed", "value": 100}'::jsonb,
     '[{"field": "tsc_brut", "op": "lt", "value": 100}]'::jsonb,
     '[]'::jsonb,
     ARRAY[]::text[],
     '2026-01-01', true),

    -- TVA : seuil assujettissement
    (law_id_2026, 'exoneration', 'tva_seuil_assujettissement',
     'Seuil d''assujettissement obligatoire TVA (500 000 DH CA/an)',
     'Assujettissement obligatoire à la TVA au-delà de 500 000 DH de chiffre d''affaires HT annuel',
     'Art. 90 CGI', 5,
     '{"op": "fixed", "value": 500000}'::jsonb,
     '[{"field": "ca_ht", "op": "gte", "value": 500000}]'::jsonb,
     '[]'::jsonb,
     ARRAY['local_commercial','bureau','magasin'],
     '2026-01-01', true),

    -- TVA : déductibilité charges
    (law_id_2026, 'deduction', 'tva_deductible_charges',
     'TVA déductible sur charges et travaux',
     'La TVA acquittée sur les charges et travaux peut être déduite de la TVA collectée',
     'Art. 101 CGI', 15,
     '{"op": "multiply", "field": "charges_ht", "factor": 0.20}'::jsonb,
     '[{"field": "assujettissement", "op": "in", "values": ["obligatoire","option"]}]'::jsonb,
     '[]'::jsonb,
     ARRAY['local_commercial','bureau','magasin'],
     '2026-01-01', true)

  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Seed Phase B exécuté avec succès (TH: 4 tranches, TSC: 2 zones, TVA: 2 taux, Règles: 5)';
END $$;
