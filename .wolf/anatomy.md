# Anatomy — Easy Location Immo

> Carte structurelle du projet. Mettre à jour après chaque création/modification de fichier clé.
> Dernière mise à jour : 2026-07-05

---

## Racine
```
easy-location-immo/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (dashboard)/            # Layout dashboard protégé
│   │   │   ├── layout.tsx          # Layout avec Sidebar
│   │   │   ├── dashboard/page.tsx  # KPIs + graphiques + tables
│   │   │   ├── biens/              # CRUD biens
│   │   │   ├── locataires/         # CRUD locataires
│   │   │   ├── contrats/           # CRUD contrats
│   │   │   ├── loyers/             # Suivi loyers + alertes
│   │   │   ├── charges/            # CRUD charges
│   │   │   ├── documents/          # Génération quittance/bail/EDL
│   │   │   ├── parametres/         # Paramètres propriétaire
│   │   │   └── fiscalite/          # Module fiscal complet
│   │   │       ├── page.tsx                    # Dashboard Fiscal
│   │   │       ├── calculateur/page.tsx        # Calculateur IR (debounce 400ms)
│   │   │       ├── declaration/page.tsx        # Déclaration par bien — loyers encaissés
│   │   │       ├── simulation/page.tsx
│   │   │       ├── audit/[id]/page.tsx
│   │   │       ├── historique/page.tsx
│   │   │       ├── configuration/page.tsx      # Barème + config (tab "bareme" défaut)
│   │   │       ├── tva/page.tsx
│   │   │       ├── taxe-habitation/page.tsx
│   │   │       └── tsc/page.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── auth/callback/route.ts
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   └── Sidebar.tsx         # Nav groupes + profil Supabase Auth
│   │   └── fiscal/
│   │       ├── BienIRCard.tsx      # Carte bien avec StatusBadge + chiffres IR
│   │       ├── TaxStepCard.tsx     # Étape calcul (unit: DH|%|'')
│   │       ├── TaxResultSummary.tsx
│   │       ├── AuditTimeline.tsx
│   │       ├── ExemptionBadge.tsx
│   │       ├── LawReference.tsx
│   │       ├── RiskFlag.tsx
│   │       ├── TaxBracketTable.tsx
│   │       └── SimulatorSlider.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser client
│   │   │   ├── server.ts           # Server client
│   │   │   ├── biens.ts            # getBiens(), createBien(), ...
│   │   │   ├── locataires.ts
│   │   │   ├── contrats.ts
│   │   │   ├── loyers.ts           # + getLoyersByYear(year) → Loyer[]
│   │   │   ├── charges.ts
│   │   │   ├── tax-laws.ts
│   │   │   ├── tax-brackets.ts
│   │   │   ├── tax-rules.ts
│   │   │   ├── tax-exemptions.ts
│   │   │   └── tax-calculations.ts
│   │   │
│   │   └── fiscal/
│   │       ├── engine/
│   │       │   ├── types.ts        # TaxInput, TaxResult, TaxStep, Regime, BailType, PropertyType, Paiement
│   │       │   ├── TaxEngine.ts    # compute() + STATIC_BRACKETS_2026 fallback
│   │       │   ├── IRFoncierCalculator.ts  # 14 étapes IR
│   │       │   ├── BracketResolver.ts
│   │       │   ├── RuleEvaluator.ts
│   │       │   └── ExemptionResolver.ts
│   │       └── calculators/
│   │           ├── TVACalculator.ts
│   │           ├── TaxeHabitationCalculator.ts
│   │           └── TSCCalculator.ts
│   │
│   └── hooks/
│       ├── useTaxCalculation.ts    # debounce 300ms
│       └── useTaxSimulation.ts
│
├── supabase/
│   ├── migrations/
│   │   ├── 20260704_fiscal_grants.sql   # GRANT SELECT fiscal tables
│   │   └── ...autres migrations
│   └── seed/
│       ├── fiscal_seed.sql
│       ├── fiscal_brackets_only.sql
│       └── fiscal_reset_complet.sql     # Reset + INSERT barèmes 2026
│
├── live/
│   ├── state.md    # État session courant
│   └── tasks.md    # Backlog tâches
├── decisions/
│   └── ledger.md   # Journal décisions (append-only)
├── intel/
│   └── focus.md    # Priorités semaine
└── .wolf/
    ├── anatomy.md  # Ce fichier
    ├── memory.md   # Log sessions
    ├── cerebrum.md # Préférences + Do-Not-Repeat
    └── buglog.json # Bugs connus + fixes
```

---

## Tables Supabase
| Table | Colonnes clés | RLS |
|-------|--------------|-----|
| profiles | id, email, nom, prenom | ✅ |
| biens | id, owner_id, nom, type, loyer_base, charges, surface, statut | ✅ |
| locataires | id, owner_id, nom, prenom, email | ✅ |
| contrats | id, bien_id, locataire_id, date_debut, date_fin, loyer | ✅ |
| loyers | id, owner_id, bien_id, montant, date_echeance, statut, type | ✅ |
| charges | id, owner_id, bien_id, montant, type, date | ✅ |
| documents | id, owner_id, bien_id, type, url | ✅ |
| tax_laws | id, code, annee, description | ✅ |
| tax_brackets | id, law_id, min, max, rate, deduction | ✅ |
| tax_rules | id, law_id, code, formula_json | ✅ |
| tax_exemptions | id, law_id, condition_json | ✅ |
| tax_calculations | id, owner_id, bien_id, annee, result_json | ✅ |

## Barème IR Foncier 2026 (LF 2026 DGI)
| Tranche | Taux | Déduction |
|---------|------|-----------|
| 0 — 40 000 DH | 0% | 0 |
| 40 001 — 60 000 DH | 10% | 4 000 |
| 60 001 — 80 000 DH | 20% | 10 000 |
| 80 001 — 100 000 DH | 30% | 18 000 |
| 100 001 — 180 000 DH | 34% | 22 000 |
| > 180 000 DH | 37% | 27 400 |
Forfaitaire ≤ 120 000 DH → abattement 15% ; Réel → charges réelles déductibles
