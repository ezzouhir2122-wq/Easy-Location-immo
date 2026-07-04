-- supabase/migrations/20260704_fiscal_engine.sql
-- Moteur Fiscal Marocain — Phase A
-- Ref: CGI Maroc, Lois de Finances 2024-2026

-- ============================================================
-- EXTENSION TABLE BIENS : nouveaux types + colonnes fiscales
-- ============================================================

ALTER TABLE public.biens
  DROP CONSTRAINT IF EXISTS biens_type_check;

ALTER TABLE public.biens
  ADD CONSTRAINT biens_type_check CHECK (type IN (
    'appartement','villa','maison','studio',
    'local_commercial','magasin','bureau','entrepot',
    'hangar','usine','parking','box','terrain',
    'terrain_agricole','immeuble','residence_touristique',
    'airbnb','location_saisonniere','bien_mixte',
    'logement_social','logement_economique','autre'
  ));

ALTER TABLE public.biens
  ADD COLUMN IF NOT EXISTS valeur_acquisition  numeric(14,2),
  ADD COLUMN IF NOT EXISTS valeur_actuelle     numeric(14,2),
  ADD COLUMN IF NOT EXISTS date_acquisition    date,
  ADD COLUMN IF NOT EXISTS usage_type          text NOT NULL DEFAULT 'habitation'
    CHECK (usage_type IN ('habitation','commercial','professionnel','mixte','agricole')),
  ADD COLUMN IF NOT EXISTS valeur_locative     numeric(10,2),
  ADD COLUMN IF NOT EXISTS nb_lots             smallint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS nb_proprietaires    smallint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS quote_part          numeric(5,4) NOT NULL DEFAULT 1.0
    CHECK (quote_part > 0 AND quote_part <= 1),
  ADD COLUMN IF NOT EXISTS prefecture          text NOT NULL DEFAULT '';

-- ============================================================
-- TABLE: tax_laws — Référentiel des lois de finances
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tax_laws (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finance_year     smallint NOT NULL,
  law_number       text NOT NULL,
  title            text NOT NULL,
  publication_date date NOT NULL,
  effective_date   date NOT NULL,
  expiration_date  date,
  official_ref     text NOT NULL,
  source_url       text,
  status           text NOT NULL DEFAULT 'active'
                     CHECK (status IN ('draft','active','superseded','repealed')),
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tax_laws_year   ON public.tax_laws(finance_year);
CREATE INDEX IF NOT EXISTS idx_tax_laws_status ON public.tax_laws(status);

-- ============================================================
-- TABLE: tax_brackets — Barèmes par tranche
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tax_brackets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  law_id          uuid NOT NULL REFERENCES public.tax_laws(id) ON DELETE CASCADE,
  tax_type        text NOT NULL
                    CHECK (tax_type IN (
                      'ir_foncier','ir_foncier_forfaitaire',
                      'tva','taxe_habitation','tsc'
                    )),
  property_type   text,
  usage_type      text,
  tranche_min     numeric(14,2) NOT NULL,
  tranche_max     numeric(14,2),
  rate            numeric(7,4) NOT NULL,
  deduction_fixe  numeric(14,2) NOT NULL DEFAULT 0,
  abattement_rate numeric(7,4) NOT NULL DEFAULT 0,
  effective_date  date NOT NULL,
  expiration_date date,
  article_cgi     text,
  loi_finances    text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tax_brackets_law       ON public.tax_brackets(law_id);
CREATE INDEX IF NOT EXISTS idx_tax_brackets_type_date ON public.tax_brackets(tax_type, effective_date);

-- ============================================================
-- TABLE: tax_rules — Règles métier configurables
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tax_rules (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  law_id           uuid REFERENCES public.tax_laws(id) ON DELETE SET NULL,
  category         text NOT NULL
                     CHECK (category IN (
                       'exoneration','abattement','deduction',
                       'retenue_source','majoration','regime_special'
                     )),
  rule_key         text NOT NULL,
  label            text NOT NULL,
  description      text NOT NULL,
  article_cgi      text,
  note_service_dgi text,
  priority         smallint NOT NULL DEFAULT 100,
  formula          jsonb NOT NULL,
  conditions       jsonb NOT NULL DEFAULT '[]',
  exceptions       jsonb NOT NULL DEFAULT '[]',
  property_types   text[] NOT NULL DEFAULT '{}',
  effective_date   date NOT NULL,
  expiration_date  date,
  enabled          boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tax_rules_key      ON public.tax_rules(rule_key);
CREATE INDEX IF NOT EXISTS idx_tax_rules_category        ON public.tax_rules(category);
CREATE INDEX IF NOT EXISTS idx_tax_rules_enabled         ON public.tax_rules(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_tax_rules_conditions_gin  ON public.tax_rules USING GIN(conditions);

-- ============================================================
-- TABLE: tax_exemptions — Exonérations fiscales
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tax_exemptions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  law_id           uuid NOT NULL REFERENCES public.tax_laws(id) ON DELETE CASCADE,
  exemption_type   text NOT NULL
                     CHECK (exemption_type IN ('temporaire','permanente','partielle')),
  label            text NOT NULL,
  description      text NOT NULL,
  property_types   text[] NOT NULL DEFAULT '{}',
  conditions       jsonb NOT NULL DEFAULT '[]',
  duration_years   smallint,
  rate             numeric(7,4) NOT NULL DEFAULT 1.0
                     CHECK (rate > 0 AND rate <= 1),
  article_cgi      text,
  note_service_dgi text,
  effective_date   date NOT NULL,
  expiration_date  date,
  enabled          boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tax_exemptions_law        ON public.tax_exemptions(law_id);
CREATE INDEX IF NOT EXISTS idx_tax_exemptions_cond_gin   ON public.tax_exemptions USING GIN(conditions);

-- ============================================================
-- TABLE: tax_calculations — Historique immuable des calculs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tax_calculations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bien_id         uuid REFERENCES public.biens(id) ON DELETE SET NULL,
  contrat_id      uuid REFERENCES public.contrats(id) ON DELETE SET NULL,
  fiscal_year     smallint NOT NULL,
  tax_type        text NOT NULL,
  input_snapshot  jsonb NOT NULL,
  steps_detail    jsonb NOT NULL,
  rules_applied   jsonb NOT NULL,
  laws_snapshot   jsonb NOT NULL,
  result          jsonb NOT NULL,
  is_simulation   boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
  -- Pas de updated_at : immuable par design
);

ALTER TABLE public.tax_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tax_calc_select_own" ON public.tax_calculations
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "tax_calc_insert_own" ON public.tax_calculations
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Pas de policy UPDATE/DELETE : immuabilité garantie par l'absence de policy

CREATE INDEX IF NOT EXISTS idx_tax_calc_owner  ON public.tax_calculations(owner_id);
CREATE INDEX IF NOT EXISTS idx_tax_calc_year   ON public.tax_calculations(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_tax_calc_bien   ON public.tax_calculations(bien_id);
CREATE INDEX IF NOT EXISTS idx_tax_calc_sim    ON public.tax_calculations(is_simulation);
