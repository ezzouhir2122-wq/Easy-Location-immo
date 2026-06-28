# Stack Technique — Easy Location Immo

## Frontend
- **Next.js 14** (App Router) — SSR/SSG, routing, API routes
- **TypeScript** — typage strict
- **Tailwind CSS** — styling utilitaire
- **shadcn/ui** — composants UI accessibles et personnalisables
- **Lucide React** — icônes
- **React Hook Form + Zod** — formulaires et validation

## Backend
- **Next.js API Routes** — endpoints API (ou App Router Server Actions)
- **Supabase** — BaaS complet (Auth, DB, Storage, Realtime)

## Base de Données
- **Supabase PostgreSQL** — base relationnelle gérée
- **Row Level Security (RLS)** — isolation des données par propriétaire

## Authentification
- **Supabase Auth** — email/password + OAuth (Google)
- **Middleware Next.js** — protection des routes

## Paiements
- **Stripe** — paiement en ligne des loyers (optionnel Phase 2)

## Génération de Documents
- **React-PDF** — quittances et contrats en PDF
- **@react-pdf/renderer** — rendu côté serveur

## Emails
- **Resend** — emails transactionnels (quittances, rappels de loyer)
- **React Email** — templates d'emails en React

## Stockage
- **Supabase Storage** — documents locataires, photos des biens

## Hébergement
- **Phase 1** : Local + Vercel preview
- **Phase 2** : Vercel Production (EU region)

## Monitoring
- **Sentry** — error tracking
- **Vercel Analytics** — performance

## Justification des Choix
- **Next.js + Supabase** : stack éprouvée, DX excellente, RLS natif pour la sécurité multi-tenant
- **shadcn/ui** : composants accessibles, facilement personnalisables, pas de dépendance locked-in
- **Stripe** : standard industrie pour les paiements, conformité PCI DSS incluse
- **Resend** : API simple, delivrability excellente, templates React natifs
