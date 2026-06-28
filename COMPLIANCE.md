# COMPLIANCE.md — Conformité & Règles Légales

## Périmètre
Règles de conformité applicables au projet **Easy Location Immo**.

## RGPD / Protection des Données

### Données collectées
- **Propriétaires/Gestionnaires** : nom, email, téléphone, SIRET (si agence)
- **Locataires** : nom, prénom, email, téléphone, revenus, documents d'identité, RIB (si virement)
- **Biens** : adresse, caractéristiques, photos

### Règles RGPD
- Collecte minimale : ne collecter que les données strictement nécessaires à la gestion locative
- Consentement explicite avant collecte des données locataires
- Droit à l'effacement : procédure de suppression de compte et données locataire documentée
- Durée de conservation : données locataires conservées 3 ans après fin de bail (obligation légale)
- Registre des traitements : à maintenir à jour

### Documents sensibles des locataires
- Stockés dans Supabase Storage avec accès restreint via RLS
- Chiffrés au repos
- Accès uniquement au propriétaire du bien concerné
- Suppression automatique après fin de conservation légale

## Hébergement & Localisation des Données
- Données personnelles hébergées en UE uniquement (Supabase EU region)
- Vercel avec région EU pour le déploiement
- Prestataires certifiés ISO 27001

## Licences Logicielles
- Bibliothèques : MIT, Apache 2.0, BSD uniquement
- Assets visuels : droits vérifiés avant intégration
- Pas de contenu sous copyright sans autorisation explicite

## Accessibilité
- Objectif WCAG 2.1 niveau AA
- Composants shadcn/ui conformes par défaut

## Mentions Légales & CGU
- Mentions légales obligatoires sur le site public
- CGU/CGV à rédiger avant lancement
- Politique de confidentialité à publier (informations sur traitement des données locataires)

## Réglementation Locative (France)
- Conformité loi Alur et loi Élan pour les contrats générés
- Mentions obligatoires dans les baux (surface, DPE, charges, etc.)
- Quittances de loyer conformes aux exigences légales
- Encadrement des loyers : à intégrer selon les zones concernées

## Cookies & Tracking
- CMP (Consent Management Platform) obligatoire
- Pas de tracking sans consentement préalable
- Analytics : données anonymisées uniquement

## Dernière révision
2026-06-28
