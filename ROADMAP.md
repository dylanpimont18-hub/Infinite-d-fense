# Roadmap — Infinite D-fense

Guide étape par étape pour mener le projet de la mise en place jusqu'au jeu complet.

---

## Étape 1 — Mise en place de l'environnement

**Objectif** : Avoir un projet qui tourne dans le navigateur depuis VS Code.

- [x] Installer [Node.js](https://nodejs.org) (LTS)
- [ ] Installer l'extension **Live Server** ou **Vite** dans VS Code
- [x] Créer le projet avec Vite :
  ```bash
  npm create vite@latest infinite-d-fense -- --template vanilla
  cd infinite-d-fense
  npm install
  ```
- [x] Installer Phaser 3 :
  ```bash
  npm install phaser
  ```
- [x] Lancer le serveur de développement :
  ```bash
  npm run dev
  ```
- [x] Vérifier que la page s'affiche dans le navigateur
- [x] Connecter le dossier au dépôt GitHub
- [x] Premier commit : `init: project setup with Vite + Phaser 3`

---

## Étape 2 — Structure du projet

**Objectif** : Organiser les fichiers avant d'écrire la moindre logique de jeu.

```
src/
├── main.js              # Point d'entrée, config Phaser
├── scenes/
│   ├── BootScene.js     # Chargement des assets
│   ├── MenuScene.js     # Menu principal
│   ├── GameScene.js     # Scène de jeu principale
│   ├── UIScene.js       # HUD superposé (or, PV, vague)
│   └── GameOverScene.js # Fin de run + gemmes gagnées
├── entities/
│   ├── Tower.js         # Classe de base pour les tours
│   ├── Enemy.js         # Classe de base pour les ennemis
│   └── Projectile.js    # Projectiles tirés par les tours
├── systems/
│   ├── WaveManager.js   # Gestion des vagues
│   ├── EconomyManager.js# Or, gemmes, achats
│   └── MetaManager.js   # Méta-progression (localStorage)
├── data/
│   ├── towers.js        # Définition des 5 tours + arbres
│   ├── enemies.js       # Définition des ennemis + boss
│   └── waves.js         # Composition des vagues
└── utils/
    └── path.js          # Coordonnées du chemin de la map
```

- [x] Créer l'arborescence de dossiers
- [x] Créer les fichiers vides avec un export par défaut
- [x] Configurer `main.js` avec la liste des scènes Phaser
- [ ] Commit : `structure: scaffold project folders and files`

---

## Étape 3 — La map et le chemin

**Objectif** : Afficher une map avec un chemin sur lequel les ennemis marcheront.

- [x] Dessiner ou importer le fond de map (forêt fantaisie — placeholder géométrique acceptable)
- [x] Définir le chemin comme une liste de points `[{x, y}, ...]` dans `utils/path.js`
- [x] Afficher le chemin visuellement (debug : ligne colorée)
- [x] Marquer les emplacements de tours disponibles (cercles ou cases)
- [x] Afficher le point d'entrée et la base
- [x] Commit : `feat: map layout and enemy path defined`

---

## Étape 4 — Les ennemis (mouvement de base)

**Objectif** : Faire marcher un ennemi de l'entrée jusqu'à la base.

- [x] Créer la classe `Enemy` avec : PV, vitesse, récompense en or
- [x] Implémenter le déplacement point-à-point le long du chemin
- [x] Déduire 1 PV à la base quand un ennemi arrive
- [x] Détruire l'ennemi quand ses PV tombent à 0
- [x] Afficher une barre de vie sur chaque ennemi
- [x] Tester avec un ennemi gobelin basique
- [ ] Commit : `feat: basic enemy movement along path`

---

## Étape 5 — Le système de vagues

**Objectif** : Faire apparaître des vagues d'ennemis en séquence.

- [x] Créer `WaveManager` : gère l'ordre et la composition des vagues
- [x] Définir les 10 premières vagues dans `data/waves.js`
- [x] Implémenter le spawn avec délai entre chaque ennemi
- [x] Passer automatiquement à la vague suivante quand tous les ennemis sont éliminés ou arrivés
- [x] Afficher le numéro de vague et un compte à rebours avant le spawn
- [x] Ajouter un bouton "Lancer la vague" pour avancer manuellement
- [ ] Commit : `feat: wave spawning system`

---

## Étape 6 — Les tours (placement et tir)

**Objectif** : Poser des tours qui tirent sur les ennemis.

- [x] Tap sur un emplacement vide → ouvrir un menu de choix de tour
- [x] Poser la tour sélectionnée si l'or est suffisant, déduire le coût
- [x] Implémenter la logique de ciblage (ennemi le plus avancé dans le chemin)
- [x] Créer la classe `Projectile` : se déplace vers la cible, inflige des dégâts à l'impact
- [ ] Implémenter les 2 premières tours :
  - [x] **Archer** : tir rapide, single-target
  - [x] **Canon** : tir lent, dégâts de zone
- [x] Tap sur une tour existante → afficher ses stats
- [ ] Commit : `feat: tower placement and shooting logic`

---

## Étape 7 — Économie in-run

**Objectif** : Rendre la boucle économique fonctionnelle.

- [x] Créer `EconomyManager` : or courant, ajout, soustraction
- [x] Donner de l'or à la mort de chaque ennemi
- [x] Donner un bonus d'or pour vague parfaite (0 PV perdus)
- [x] Donner de l'or au boss tué
- [x] Permettre de vendre une tour (50% remboursé)
- [x] Bloquer le placement si or insuffisant (feedback visuel)
- [ ] Commit : `feat: gold economy system`

---

## Étape 8 — Les 3 tours restantes

**Objectif** : Compléter le roster des 5 tours.

- [x] **Mage de Glace** : ralentit + dégâts zone
- [x] **Barricade** : ralentit les ennemis qui passent dessus
- [x] **Tour Foudre** : chaîne entre ennemis proches
- [x] Équilibrer les coûts et les stats de base
- [ ] Commit : `feat: add remaining 3 tower types`

---

## Étape 9 — Les 4 types d'ennemis restants + boss

**Objectif** : Varier les ennemis et introduire les boss.

- [x] **Orc** : tank lent
- [x] **Fantôme** : immunisé aux tours physiques (Archer, Canon)
- [x] **Sorcier** : régénère les PV des alliés proches
- [x] **Troll** : se régénère s'il n'est pas tué en 3 secondes
- [x] **Boss 1 — Ogre des Flammes** : AoE qui désactive les tours proches temporairement
- [ ] **Boss 2 — Liche** : ressuscite les ennemis morts proches
- [x] Intégrer ces types dans les compositions de vagues
- [ ] Commit : `feat: all enemy types and boss logic`

---

## Étape 10 — Arbres de compétences in-run

**Objectif** : Permettre d'améliorer les tours pendant un run.

- [ ] Tap sur une tour → afficher l'arbre de compétences (3 branches × 3 niveaux)
- [ ] Niveau 1 et 2 : toutes branches disponibles
- [ ] Niveau 3 : choix exclusif entre les 3 branches
- [x] Définir toutes les compétences pour les 5 tours dans `data/towers.js`
- [x] Appliquer les effets (stats, comportements) à la tour concernée
- [ ] Commit : `feat: in-run tower upgrade trees`

---

## Étape 11 — Méta-progression

**Objectif** : Conserver une progression permanente entre les runs.

- [x] Créer `MetaManager` : lecture/écriture dans `localStorage`
- [x] Calculer les Gemmes gagnées en fin de run (score × multiplicateur)
- [x] Créer l'écran de méta-progression (accessible depuis le menu)
- [x] Implémenter les 3 branches (Offensive, Défensive, Économique)
- [x] Appliquer les bonus au démarrage de chaque run
- [ ] Ajouter un bouton "Réinitialiser la progression" (avec confirmation)
- [ ] Commit : `feat: meta-progression with localStorage`

---

## Étape 12 — UI complète

**Objectif** : Avoir une interface claire et utilisable sur mobile.

- [x] **Menu principal** : boutons Jouer / Méta-progression / (Options)
- [x] **HUD in-game** : PV base, or, numéro de vague, minuterie, bouton lancer vague
- [x] **Écran Game Over** : vague atteinte, score, gemmes gagnées, bouton rejouer
- [x] Responsive : s'adapte aux petits écrans (portrait mobile)
- [ ] Contrôles tactiles fluides (tap, pas de hover)
- [ ] Commit : `feat: complete UI and responsive layout`

---

## Étape 13 — Polish & équilibrage

**Objectif** : Rendre le jeu agréable à jouer.

- [x] Ajouter des animations : tir, mort ennemi, pose de tour
- [x] Ajouter des effets visuels : explosion Canon, gel Mage, chaîne Foudre
- [ ] Ajouter des sons : tirs, morts, vague lancée, game over (assets libres)
- [x] Équilibrer : tester les vagues 1 à 20+, ajuster coûts et stats
- [x] Ajouter un retour visuel quand la base perd des PV (flash rouge)
- [ ] Commit : `polish: animations, sounds, and balance pass`

---

## Étape 14 — Tests & déploiement

**Objectif** : Rendre le jeu accessible en ligne.

- [ ] Tester sur mobile réel (Chrome Android, Safari iOS)
- [ ] Vérifier les performances (60fps visé, aucun lag sur les grandes vagues)
- [ ] Corriger les bugs critiques
- [x] Builder le projet :
  ```bash
  npm run build
  ```
- [ ] Déployer sur **GitHub Pages** ou **Netlify** (gratuit)
- [ ] Partager le lien et collecter des retours
- [ ] Commit : `release: v1.0 build ready`

---

## Récapitulatif

| Étape | Contenu | Priorité |
|---|---|---|
| 1-2 | Setup & structure | Obligatoire |
| 3-5 | Map, ennemis, vagues | MVP |
| 6-7 | Tours, économie | MVP |
| 8-9 | Contenu complet | V1 |
| 10-11 | Arbres de compétences, méta | V1 |
| 12 | UI | V1 |
| 13-14 | Polish, déploiement | Release |

---

> Chaque étape peut faire l'objet d'un commit distinct.
> Il est conseillé de terminer et tester chaque étape avant de passer à la suivante.
