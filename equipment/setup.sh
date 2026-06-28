#!/bin/bash
# Setup Easy Location Immo — Installation des dépendances

set -e

echo "🏠 Easy Location Immo — Setup"
echo "================================"

# Vérifier Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js non trouvé. Installer depuis https://nodejs.org (v18+)"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js v18+ requis. Version actuelle: $(node -v)"
  exit 1
fi

echo "✅ Node.js $(node -v)"

# Vérifier .env
if [ ! -f ".env" ]; then
  echo "⚠️  Fichier .env manquant."
  echo "   Copier .env.example → .env et remplir les valeurs."
  cp .env.example .env
  echo "   .env créé depuis .env.example — REMPLIR LES VRAIES VALEURS avant de continuer."
  exit 1
fi

echo "✅ .env présent"

# Installer les dépendances
if [ -f "package.json" ]; then
  echo "📦 Installation des dépendances npm..."
  npm install
  echo "✅ Dépendances installées"
else
  echo "⚠️  package.json non trouvé."
  echo "   Lancer d'abord : npx create-next-app@latest . --typescript --tailwind --app --src-dir"
  exit 1
fi

# Vérifier la connexion Supabase
echo ""
echo "🔧 Vérification de la config..."
python3 equipment/check-env.py 2>/dev/null || node equipment/check-env.js 2>/dev/null || echo "⚠️  Script de vérification env non trouvé"

echo ""
echo "✅ Setup terminé !"
echo ""
echo "Démarrer le serveur de dev :"
echo "  npm run dev"
echo ""
echo "Voir les tâches : live/tasks.md"
