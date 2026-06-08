# REGRESSION.md — Checklist de non-régression

Avant chaque déploiement, cochez manuellement ces 15 flows critiques.

---

## 1. Authentification & Rôles
- [ ] Login admin (user: `admin` / pass: `Admin@123`)
- [ ] Login réception (user: `reception` / pass: `Reception@123`)
- [ ] Login coach (user: `coach` / pass: `Coach@123`)
- [ ] Sidebar : sections visibles selon le rôle
- [ ] Déconnexion fonctionnelle

## 2. Adhérents
- [ ] Création adhérent (tous champs dont email, referredBy, poids...)
- [ ] Modification adhérent
- [ ] Recherche adhérent (nom / téléphone)
- [ ] Filtre par statut (actif/expiré/inactif)
- [ ] Blocage / déblocage adhérent

## 3. POS (Point de Vente)
- [ ] Onglets : Abonnements / Consommations / Accessoires
- [ ] Sous-onglets Abonnements : Abonnements / Coaching
- [ ] Paiement Espèces → encaissement correct
- [ ] Paiement Carte → sélecteur type carte (Visa/MasterCard/CIB/Edahabia/Autre)
- [ ] Paiement Points Fidélité → sélection membre, déduction points, checkout

## 4. Fidélité & Récompenses
- [ ] Points gagnés après un encaissement POS (non-points)
- [ ] Bonus paiement anticipé activable dans admin/loyalty
- [ ] Catalogue récompenses admin (/admin/rewards)
- [ ] Échange points sur fidélité (/fidelity)

## 5. Programmes & Abonnements
- [ ] Page fusionnée /programs-plans : programmes + plans groupés par programme
- [ ] Création programme
- [ ] Création / édition abonnement

## 6. Check-in
- [ ] Scan RFID / recherche → check-in OK
- [ ] Membre expiré → modal rouge avec bouton "Réabonner au POS"
- [ ] Membre actif → check-in validé

## 7. Parrainage
- [ ] Création adhérent avec referredBy → 500 points attribués au parrain
- [ ] Champ referredBy visible dans le formulaire création

## 8. Consommables
- [ ] Onglet Catégories : créer / éditer / supprimer catégorie
- [ ] Produits liés aux catégories

## 9. Coaches & Événements
- [ ] Création / modification coach
- [ ] Création événement + inscription membre
- [ ] Sessions privées coach

## 10. Campagne WhatsApp
- [ ] Envoi individuel par ligne → message correct (template résolu, pas la clé)
- [ ] Envoi groupé → chaque membre reçoit le bon message personnalisé
- [ ] Import fichier Excel → sélection automatique des membres

## 11. Export / Import DB
- [ ] Onglet "Import / Export" dans admin/database
- [ ] Export JSON complet
- [ ] Export Excel par table
- [ ] Export CSV
- [ ] Import JSON (restauration)

## 12. Sync Supabase
- [ ] Création adhérent → visible dans Supabase `synced_members`
- [ ] Paiement → visible dans `synced_payments`
- [ ] Récompense → visible dans `synced_rewards`
- [ ] Campagne WhatsApp → visible dans `synced_whatsapp_campaigns`

## 13. Notifications
- [ ] Alertes renouvellement (membres à J-7)
- [ ] Alertes expirés (J+2)
- [ ] Template preview correct

## 14. Interface Générale
- [ ] Mode clair/sombre (via localStorage)
- [ ] Langue FR/AR (via language-context)
- [ ] Glassmorphism et glow or visibles
- [ ] Pas de console errors

## 15. Build & CI/CD
- [ ] `npx tsc --noEmit` → 0 erreurs
- [ ] `npm run build` → succès
- [ ] Déploiement Vercel → succès
