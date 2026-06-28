# SECURITY.md — Politique de Sécurité

## Périmètre
Ce document définit les règles de sécurité applicables au projet **Easy Location Immo**.

## Règles Fondamentales

### Secrets & Credentials
- ❌ Jamais de clés API, tokens, ou mots de passe dans le code source
- ✅ Toujours via `.env` (jamais commité)
- ✅ `.env.example` avec des valeurs fictives uniquement
- Rotation des clés : tous les 90 jours minimum

### Dépendances
- N'installer que des packages sous licence MIT, Apache 2.0, ou BSD
- Auditer avec `npm audit` avant chaque déploiement
- Maintenir les dépendances à jour (patch security en < 48h)

### Données Utilisateurs & Locataires
- Chiffrement en transit : HTTPS/TLS 1.3 obligatoire
- Chiffrement au repos : pour toute donnée sensible (revenus, documents d'identité)
- Pas de logs contenant des données personnelles des locataires
- Documents des locataires stockés dans Supabase Storage avec accès RLS strict
- Conformité RGPD : voir `COMPLIANCE.md`

### Accès & Authentification
- Principe du moindre privilège pour tous les rôles (propriétaire, gestionnaire, locataire)
- MFA recommandé pour les accès admin et propriétaire
- Sessions expirantes (max 24h)
- Row Level Security (RLS) activé sur TOUTES les tables Supabase

### Sécurité des Paiements (Stripe)
- Ne jamais stocker les numéros de carte en base de données
- Utiliser uniquement les webhooks Stripe sécurisés
- Valider la signature des webhooks avec `STRIPE_WEBHOOK_SECRET`
- Logs de toutes les transactions (sans données sensibles)

### Code & Déploiement
- Code review obligatoire avant merge en production
- Validation et sanitisation de toutes les entrées utilisateur
- Headers sécurité : CSP, HSTS, X-Frame-Options configurés dans Next.js
- Variables d'environnement séparées par environnement (dev/staging/prod)

## Gestion des Incidents
- Incident détecté → alerter immédiatement le responsable projet
- Logger dans `decisions/ledger.md` avec timestamp
- Patch en < 24h pour les vulnérabilités critiques

## Contacts Sécurité
- Responsable projet : ANTIGRAVITY
- Escalade : signaler via `live/state.md`
