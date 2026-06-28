# Architecture — Easy Location Immo

## Vue d'Ensemble

```
┌─────────────────────────────────────────────┐
│              Navigateur (Client)             │
│         Next.js App Router (RSC + CSR)       │
└─────────────────┬───────────────────────────┘
                  │ HTTPS
┌─────────────────▼───────────────────────────┐
│              Vercel (Edge)                   │
│       Next.js Server + API Routes            │
│    Server Actions / Server Components        │
└────────┬────────────────────┬───────────────┘
         │                    │
┌────────▼────────┐  ┌────────▼───────────────┐
│    Supabase     │  │        Resend           │
│  - Auth         │  │   (Emails transac.)     │
│  - PostgreSQL   │  └────────────────────────┘
│  - Storage      │
│  - Realtime     │  ┌────────────────────────┐
└─────────────────┘  │        Stripe          │
                     │   (Paiements Phase 2)  │
                     └────────────────────────┘
```

## Structure Next.js App Router

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          ← Layout avec sidebar
│   │   ├── page.tsx            ← Dashboard KPIs
│   │   ├── biens/
│   │   │   ├── page.tsx        ← Liste des biens
│   │   │   ├── nouveau/page.tsx
│   │   │   └── [id]/page.tsx   ← Fiche bien
│   │   ├── locataires/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── contrats/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── paiements/
│   │       └── page.tsx
│   └── api/
│       ├── auth/callback/route.ts
│       ├── biens/route.ts
│       ├── locataires/route.ts
│       ├── paiements/route.ts
│       └── webhooks/stripe/route.ts  ← Phase 2
├── components/
│   ├── ui/                     ← shadcn/ui components
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   └── header.tsx
│   ├── biens/
│   │   ├── bien-card.tsx
│   │   └── bien-form.tsx
│   ├── locataires/
│   ├── contrats/
│   └── paiements/
│       └── quittance-pdf.tsx   ← React-PDF
├── lib/
│   ├── supabase/
│   │   ├── client.ts           ← Client navigateur
│   │   ├── server.ts           ← Client serveur
│   │   └── middleware.ts
│   └── stripe.ts               ← Phase 2
├── types/
│   ├── database.ts             ← Types générés Supabase
│   └── index.ts
└── utils/
    ├── formatters.ts           ← formatPrice, formatDate...
    └── validators.ts
```

## Décisions d'Architecture

### Multi-tenant
- 1 base Supabase partagée avec RLS par `owner_id`
- Chaque propriétaire voit uniquement ses données

### Temps Réel
- Supabase Realtime pour les alertes de paiement (Phase 2)
- Pour Phase 1 : polling simple ou revalidation Next.js

### Génération PDF
- React-PDF côté serveur (Server Component ou API route)
- Rendu en buffer, envoi via Response ou stockage Supabase

### Auth Flow
1. User soumet login → Supabase Auth
2. Supabase retourne session + cookie
3. Middleware Next.js vérifie session sur chaque route protégée
4. Server Components lisent user depuis cookie de session
