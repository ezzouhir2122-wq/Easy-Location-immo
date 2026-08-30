# Cahier des charges — Easy Location Immo Maroc

**Positionnement :** SaaS de gestion immobilière et de conciergerie pour le Maroc.

## Vision

Centraliser les biens, les locations longue et courte durée, les opérations de conciergerie et le suivi comptable. Les encaissements, charges, commissions et dépenses doivent rester ventilés par bien afin de produire des états de revenus fonciers contrôlables.

Le moteur fiscal existant est une aide à la préparation et ne remplace ni un expert-comptable ni une validation administrative.

## Utilisateurs

- Propriétaire bailleur avec 1 à 20 biens.
- Gestionnaire de biens ou petite agence multi-portefeuilles.
- Opérateur de conciergerie pour appartements meublés et courte durée.
- Expert-comptable ayant besoin d'un export par bien et par exercice.

## MVP cible

### Conciergerie

- Réservations : canal, dates, client, voyageurs, montant brut, commission et frais de ménage.
- Calendrier des arrivées, départs et disponibilités.
- Tâches : ménage, linge, check-in/out, maintenance et approvisionnement.
- Coût prévu/réel, responsable et statut par tâche.

### Comptabilité immobilière

- Plan de comptes par propriétaire.
- Journal d'écritures et lignes débit/crédit.
- Rapprochement des loyers, charges, réservations et remboursements.
- Grand livre par bien, résultat simplifié et export comptable.

### Revenus fonciers

- Revenus réellement encaissés par bien et par année.
- Charges et justificatifs rattachés au bien.
- Reprise du moteur IR foncier avec traçabilité du calcul et de la version de règle.
- Export préparatoire de déclaration, sans conseil fiscal automatisé.

## Règles métier

1. Toutes les données sont isolées par `owner_id` via RLS Supabase.
2. Toute opération conserve sa provenance (`loyer`, `charge`, `reservation`, `manuel`).
3. Une écriture validée est corrigée par contrepassation, jamais supprimée silencieusement.
4. Une écriture validée doit être équilibrée au centime : total débit = total crédit.
5. Les montants sont stockés en MAD ; l'affichage utilise Africa/Casablanca.

## Hors périmètre initial

Open banking, dépôt fiscal automatique, conseil fiscal individualisé, paie automatique des prestataires et marketplace publique de réservation.
