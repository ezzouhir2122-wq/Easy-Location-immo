# Instructions de développement

- Préserver les modules existants et vérifier l'existant avant toute modification.
- Utiliser TypeScript strict, Server Components par défaut et mutations serveur pour les opérations sensibles.
- Toute nouvelle table doit avoir RLS, index utiles et un test de non-fuite inter-tenant.
- Ne jamais exposer la clé `service_role` dans le navigateur.
- Une écriture comptable validée contient au moins deux lignes équilibrées au centime.
- Ne pas supprimer une écriture validée : créer une contrepassation référencée.
- Afficher les montants en MAD et les dates dans le fuseau Africa/Casablanca.
- Ne pas présenter un calcul fiscal comme une déclaration officielle ou un conseil professionnel.
