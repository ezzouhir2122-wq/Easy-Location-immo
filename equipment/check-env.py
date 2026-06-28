#!/usr/bin/env python3
"""Vérifie que toutes les variables d'environnement requises sont configurées."""

import os
import sys
from pathlib import Path

# Charger .env
env_file = Path(__file__).parent.parent / ".env"
if env_file.exists():
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip())

REQUIRED = [
    ("NEXT_PUBLIC_SUPABASE_URL", "URL du projet Supabase"),
    ("NEXT_PUBLIC_SUPABASE_ANON_KEY", "Clé anonyme Supabase"),
    ("SUPABASE_SERVICE_ROLE_KEY", "Clé service role Supabase"),
]

OPTIONAL = [
    ("RESEND_API_KEY", "Clé Resend pour les emails"),
    ("STRIPE_SECRET_KEY", "Clé secrète Stripe (Phase 2)"),
    ("STRIPE_WEBHOOK_SECRET", "Secret webhook Stripe (Phase 2)"),
    ("SENTRY_DSN", "DSN Sentry pour le monitoring"),
]

print("\n📋 Vérification des variables d'environnement\n")
print("Requises :")

errors = []
for key, description in REQUIRED:
    value = os.environ.get(key, "")
    if not value or "your-" in value or "..." in value:
        print(f"  ❌ {key} — {description}")
        errors.append(key)
    else:
        print(f"  ✅ {key}")

print("\nOptionnelles :")
for key, description in OPTIONAL:
    value = os.environ.get(key, "")
    if not value or "your-" in value or "..." in value:
        print(f"  ⚠️  {key} — {description} (non configuré)")
    else:
        print(f"  ✅ {key}")

if errors:
    print(f"\n❌ {len(errors)} variable(s) manquante(s). Remplir .env avant de continuer.\n")
    sys.exit(1)
else:
    print("\n✅ Toutes les variables requises sont configurées.\n")
