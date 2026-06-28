# Three Engine Model — EA Command Centre

## Les 3 Moteurs

### 1. Intel Engine (Renseignement)
Tout ce que l'agent doit savoir sur le projet avant d'agir.
- `intel/projet.md` — fiche projet complète
- `intel/stack.md` — stack et justifications
- `intel/client.md` — audience et besoins
- `intel/focus.md` — priorités actuelles

### 2. Blueprint Engine (Planification)
SOPs et workflows reproductibles.
- `blueprints/00-demarrage.md` — ritual de session
- `blueprints/01-deploiement.md` — workflow Vercel
- `blueprints/02-schema-supabase.md` — schéma DB

### 3. Equipment Engine (Exécution)
Scripts déterministes et outils.
- `equipment/setup.sh` — installation
- `equipment/check-env.py` — vérification env

## Principe de Fonctionnement
Chaque session : Intel → Blueprint → Equipment
Ne jamais coder sans avoir lu l'intel. Ne jamais déployer sans suivre le blueprint.
