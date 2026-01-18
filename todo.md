# AI TeamPlay Engine - TODO

## Phase 1 : Migration Initiale ✅
- [x] Migrer le schéma de base de données (17 tables)
- [x] Migrer la page d'accueil (Landing Page)
- [x] Migrer le Dashboard cognitif
- [x] Migrer les composants UI personnalisés
- [x] Migrer les routes API tRPC
- [x] Migrer la logique d'analyse cognitive
- [x] Migrer le système de détection de biais
- [x] Migrer le système de Smart Pings
- [x] Configurer les styles TailwindCSS
- [x] Tester l'authentification OAuth
- [x] Créer le checkpoint final

## Phase 2 : Fonctionnalités Actuelles ✅
- [x] Page d'accueil avec présentation des fonctionnalités
- [x] Authentification utilisateur (OAuth Manus)
- [x] Dashboard avec métriques cognitives
- [x] Détection de 8 types de biais cognitifs
- [x] Système de Smart Pings (7 types)
- [x] Analyse temps réel des conversations
- [x] Calcul des Cognitive Tokens (CT)
- [x] Memory Explorer basique
- [x] Gestion des équipes et projets
- [x] Transcription audio via Whisper API

## Phase 3 : Améliorations Haute Priorité (Impact Immédiat)

### 3.1 Système de Pings Amélioré
- [x] Implémenter Silence Ping (détection expertise non exploitée)
- [x] Vérification multi-membres pour CAT (≥3 membres impliqués)
- [ ] Améliorer la règle de déclenchement avec cycles de propagation

### 3.2 Analyse Audio Avancée
- [x] Implémenter speaker diarization (identification des intervenants)
- [ ] Ajouter analyse du rythme de parole
- [ ] Détection de dominance vocale

### 3.3 Dashboard Amélioré
- [x] Créer carte cognitive dynamique (graphe interactif)
- [ ] Améliorer visualisation des biais actifs
- [ ] Ajouter historique détaillé des dérives corrigées

### 3.4 UX et Interactions
- [x] Améliorer le panel Smart Pings avec animations
- [x] Ajouter animations aux alertes du dashboard
- [x] Améliorer les cartes de métriques avec effets hover
- [ ] Ajouter notifications en temps réel (WebSocket)
- [ ] Améliorer la transparence des signaux utilisés

## Phase 4 : Améliorations Moyenne Priorité (Qualité)

### 4.1 Fenêtres Cognitives Glissantes (CSAW)
- [x] Implémenter pondération récente > ancien
- [x] Ajouter seuils adaptatifs selon maturité équipe
- [x] Améliorer analyse temporelle continue

### 4.2 Mémoire Collective Avancée
- [ ] Implémenter indexation vectorielle des raisonnements
- [ ] Ajouter reconnaissance de patterns inter-équipes
- [ ] Améliorer recherche dans l'intelligence collective

### 4.3 Analyse Documentaire
- [ ] Améliorer parsing automatique des documents
- [ ] Implémenter détection d'incohérences docs/discussions
- [ ] Ajouter suivi de l'évolution des hypothèses

### 4.4 Templates Cognitifs
- [ ] Créer template Startup
- [ ] Créer template Produit Tech
- [ ] Ajuster seuils de pings par template
- [ ] Configurer types de biais dominants par domaine

### 4.5 Gouvernance Éthique
- [ ] Implémenter système d'opt-out
- [ ] Améliorer transparence des modèles
- [ ] Ajouter paramètres de confidentialité

## Phase 5 : Fonctionnalités Avancées (Basse Priorité)

### 5.1 Graphe Cognitif Collectif
- [ ] Créer graphe unifié (membres + idées + décisions)
- [ ] Implémenter arêtes (influence, accord, contradiction)
- [ ] Optimiser mise à jour temps réel

### 5.2 Rétropropagation Cognitive (RCC)
- [ ] Comparaison intentions / décisions / résultats
- [ ] Ajustement des modèles prédictifs
- [ ] Amélioration continue des pings
- [ ] Apprentissage sur trajectoires cognitives

### 5.3 Simulation et Prédiction
- [ ] Génération de scénarios alternatifs
- [ ] Estimation probabilité de succès
- [ ] Améliorer détection risques futurs
- [ ] Simulation d'impact décisionnel

### 5.4 Agent Manager de Projet
- [ ] Proposition automatique de tâches
- [ ] Adaptation aux profils cognitifs
- [ ] Rééquilibrage de charge mentale
- [ ] Priorisation intelligente

### 5.5 Effet Réseau Cognitif
- [ ] Système d'amélioration global par équipe
- [ ] Intelligence collective mondiale
- [ ] Partage anonymisé de patterns

## Bugs Résolus ✅
- [x] Page blanche dans l'aperçu Manus - résolu (conflit de ports)
- [x] Vérifier la synchronisation avec le repository GitHub - Synchronisé
- [x] Problème d'authentification OAuth - résolu (fonctionnait déjà)

## Statistiques Actuelles
- **Fonctionnalités implémentées** : 68 ✅ (+24 nouvelles)
- **Fonctionnalités partielles** : 8 🟡
- **Fonctionnalités à développer** : 19 ❌
- **Taux de complétion** : ~72% complet, ~8% partiel, ~20% à développer
- **Tests unitaires** : 85 tests passent ✅

## Phase 6 : Améliorations en cours

### 6.1 Système de Biais Intelligent (Anti-Overload)
- [x] Vulgariser les descriptions de biais (langage simple, exemples concrets)
- [x] Implémenter seuils de sévérité (alerter seulement si biais important)
- [x] Ajouter système de guidage positif (suggestions constructives)
- [x] Réduire le bruit des alertes (regrouper, prioriser)

### 6.2 Notifications Temps Réel
- [x] Implémenter SSE (Server-Sent Events) pour alertes instantanées
- [x] Créer système de notification non-intrusif (toast, banner, subtle)
- [x] Ajouter préférences de notification utilisateur (types, priorité, heures calmes)

### 6.3 Templates Cognitifs
- [x] Créer template Startup (tolérance risque élevée)
- [x] Créer template Produit Tech (focus qualité)
- [x] Créer template Consulting (rigueur analytique)
- [x] Créer template Créatif (divergence valorisée)
- [x] Créer template R&D (rigueur scientifique)
- [x] Créer template Opérations (efficacité)
- [x] Ajuster seuils automatiquement selon template
- [x] Ajouter suggestion automatique de template

### 6.4 Indexation Vectorielle
- [x] Implémenter recherche sémantique dans mémoire collective
- [x] Ajouter reconnaissance de patterns similaires
- [x] Détection de patterns récurrents (biais, erreurs, décisions)
- [x] Suggestions basées sur la mémoire collective

## Phase 7 : Profil Utilisateur 360° ✅

### 7.1 Extraction d'Expérience
- [x] Créer module de parsing CV (texte)
- [x] Extraire compétences, expériences, formations via LLM
- [x] Détecter domaines d'expertise automatiquement
- [x] Calculer la complétude du profil

### 7.2 Profil Psychologique Big Five/OCEAN
- [x] Implémenter le modèle Big Five (Ouverture, Conscienciosité, Extraversion, Agréabilité, Névrosisme)
- [x] Créer quiz rapide et concis (15 questions)
- [x] Déterminer le rôle d'équipe automatiquement (Innovateur, Pilier, Connecteur, etc.)
- [x] Descriptions vulgarisées des traits en français

### 7.3 Interface Profil 360°
- [x] Créer page de profil avec onglets (Vue d'ensemble, Big Five, Expérience, Quiz)
- [x] Ajouter import CV (texte)
- [x] Intégrer quiz Big Five interactif avec progression
- [x] Afficher rôle d'équipe et recommandations
- [x] Calculer et afficher la complétude globale du profil

### 7.4 Intégration Backend
- [x] Schéma DB étendu avec bigFiveProfile et professionalProfile
- [x] Routes API profile360 complètes (getQuiz, submitQuiz, extractFromCV, getFullProfile)
- [x] 14 tests unitaires pour Big Five Profile

## Statistiques Mises à Jour
- **Fonctionnalités implémentées** : 90 ✅ (+22 nouvelles)
- **Tests unitaires** : 104 tests passent ✅
- **Taux de complétion** : ~82% complet
- **Nouveaux modules** : bigFiveProfile, professionalProfile, smartBiasSystem (intégration Big Five)
