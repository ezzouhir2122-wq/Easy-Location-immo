# Cerebrum — Easy Location Immo

> Préférences, conventions, Do-Not-Repeat. Mettre à jour après chaque correction utilisateur.

---

## Préférences Utilisateur

- **Langue réponses :** Français
- **Déploiement :** `vercel deploy --prod` via CLI (GitHub push seul ne déclenche pas les builds)
- **Commits :** Sur branche feature, jamais directement sur master
- **PR :** Toujours demander confirmation avant de créer/merger une PR
- **Réponses :** Courtes et directes, pas de longs récapitulatifs
- **Zéro dépendances superflues :** Préférer HTML natif (datalist, window.print) aux libs externes

## Conventions Projet

- **Nommage fichiers :** Préfixer par contexte (`bien_`, `locataire_`, `fiscal_`, etc.)
- **Secrets :** Jamais dans le code — uniquement via `.env` (ne jamais modifier .env)
- **Commentaires :** Aucun sauf WHY non-obvious
- **PowerShell vs Bash :** Utiliser Bash pour `git add` avec chemins contenant `(dashboard)` (PowerShell interprète les parenthèses)
- **Queries Supabase :** 1 seule requête pour toute l'année + filtrage client-side (plutôt que N requêtes par bien)
- **Fallback statique :** STATIC_BRACKETS_2026 dans TaxEngine si DB vide — ne jamais supprimer

## Do-Not-Repeat

- Ne jamais committer directement sur `main`/`master`
- Ne jamais modifier `.env`
- Ne jamais utiliser `--no-verify` sur git commit
- Ne jamais installer de lib sans licence permissive (MIT/Apache/BSD)
- Ne pas utiliser `vercel deploy --prod` sans confirmation explicite de l'utilisateur (sauf si l'utilisateur dit "redploie" ou "deploie")
- Si la même erreur se répète 5 fois → stopper et alerter

## Patterns Validés

- `input[list]` + `<datalist>` pour combobox — natif, 0 dépendance ✅
- `let cancelled = false` dans useEffect pour éviter setState sur composant démonté ✅
- `Promise.all([getBiens(), getLoyersByYear(year)])` pour charger en parallèle ✅
- Barème IR LF 2026 hardcodé comme fallback dans TaxEngine ✅
