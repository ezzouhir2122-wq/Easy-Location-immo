# Blueprint 01 — Déploiement sur Vercel

## Prérequis
- Compte Vercel connecté à GitHub
- Projet Supabase en production configuré
- Variables d'environnement production prêtes

## Étapes de Déploiement

### 1. Préparer l'environnement production
```bash
# Vérifier que le build passe en local
npm run build
npm run start
```

### 2. Configurer les variables sur Vercel
Dans Vercel Dashboard → Settings → Environment Variables :
```
NEXT_PUBLIC_SUPABASE_URL=https://[prod-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[prod-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[prod-service-role-key]
NEXT_PUBLIC_APP_URL=https://[votre-domaine].vercel.app
RESEND_API_KEY=[prod-resend-key]
STRIPE_SECRET_KEY=[prod-stripe-key]  # Phase 2
STRIPE_WEBHOOK_SECRET=[prod-webhook-secret]  # Phase 2
```

### 3. Déployer
```bash
# Via CLI Vercel
npx vercel --prod

# Ou via GitHub : push sur main → déploiement automatique
git push origin main
```

### 4. Configurer le domaine custom (si applicable)
- Vercel Dashboard → Settings → Domains
- Ajouter `easy-location-immo.fr`
- Configurer les DNS chez le registrar

### 5. Configurer les webhooks Stripe (Phase 2)
```bash
stripe listen --forward-to https://[votre-domaine]/api/webhooks/stripe
```

## Checklist Post-Déploiement
- [ ] L'URL de production charge correctement
- [ ] L'authentification fonctionne
- [ ] Les opérations CRUD sur les biens fonctionnent
- [ ] Les emails sont envoyés (test via Resend dashboard)
- [ ] Sentry reçoit les erreurs en production
- [ ] Les variables d'environnement sont toutes configurées

## Rollback si Problème
```bash
# Via Vercel Dashboard : Deployments → sélectionner le dernier bon déploiement → Promote to Production
```
