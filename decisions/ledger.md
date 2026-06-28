# Journal de Décisions — Easy Location Immo

> Append-only. Ne jamais modifier les entrées existantes.

---

## 2026-06-28 — Initialisation du Projet

**Décision :** Stack Next.js 14 + Supabase + Tailwind + shadcn/ui
**Contexte :** Projet de gestion locative, besoin de multi-tenant sécurisé, génération PDF, emails
**Raison :** Stack éprouvée, RLS Supabase natif pour isolation des données, shadcn/ui pour DX rapide
**Par :** Structure_Projet Universal Generator

---

## 2026-06-28 — Architecture Multi-Tenant

**Décision :** 1 base de données partagée avec Row Level Security (RLS) par `owner_id`
**Contexte :** Plusieurs propriétaires sur la même instance, données à isoler
**Raison :** Plus simple à opérer qu'une DB par tenant, Supabase RLS gère l'isolation nativement
**Alternatives considérées :** Schémas séparés par tenant (rejeté : complexité opérationnelle)
**Par :** Structure_Projet Universal Generator

---

## 2026-06-28 — Paiements Phase 1

**Décision :** Stripe reporté en Phase 2 — Phase 1 = suivi manuel des paiements uniquement
**Contexte :** MVP prioritaire, Stripe ajoute de la complexité (webhooks, KYC Stripe Connect)
**Raison :** Valider le produit avec les utilisateurs avant d'ajouter la complexité paiements
**Par :** Structure_Projet Universal Generator

---
