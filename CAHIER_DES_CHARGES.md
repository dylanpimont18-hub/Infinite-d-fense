# Cahier des Charges — Infinite D-fense

## 1. Présentation du projet

**Nom** : Infinite D-fense
**Type** : Web App mobile (jouable dans le navigateur, compatible desktop)
**Genre** : Tower Defense infini avec méta-progression
**Environnement de développement** : VS Code
**Statut** : Projet personnel, aucune monétisation prévue

---

## 2. Concept

Le joueur défend une base contre des vagues infinies d'ennemis de thème **fantaisie** (gobelins, trolls, dragons, nécromanciens...). La difficulté augmente à chaque vague. Entre les parties, le joueur accumule une **méta-progression permanente** qui rend les runs suivants plus puissants.

---

## 3. Plateformes & Technique

| Élément | Choix |
|---|---|
| Cible principale | Mobile (navigateur Chrome/Safari) |
| Cible secondaire | Desktop (VS Code Live Preview / navigateur) |
| Framework jeu | **Phaser 3** (recommandé : rendu Canvas/WebGL, adapté mobile, large communauté) |
| Langage | JavaScript / TypeScript |
| Build tool | Vite (rapide, compatible VS Code) |
| Sauvegarde | `localStorage` (offline, sans backend) |
| PWA | À décider ultérieurement |
| Assets | À décider (gratuits OpenGameArt ou visuels géométriques en attendant) |

---

## 4. Gameplay — Boucle principale

```
Début de run
   └─> Placement des tours (phase de préparation)
   └─> Vague d'ennemis (phase de combat)
   └─> Récompense en or
   └─> Amélioration des tours (arbre de compétences in-run)
   └─> Vague suivante (difficulté +)
         ...
   └─> Game Over (la base tombe à 0 PV)
         └─> Récompense en Gemmes (monnaie méta)
         └─> Arbre de méta-progression
         └─> Nouveau run
```

---

## 5. Les Tours (V1 : 5 types)

| # | Nom | Rôle | Cible |
|---|---|---|---|
| 1 | **Archer** | Dégâts single-target, portée longue | 1 ennemi |
| 2 | **Mage de Glace** | Ralentit + dégâts zone | Zone |
| 3 | **Canon** | Dégâts lourds, lent, splash | Zone |
| 4 | **Barricade** | Ralentit / bloque temporairement | Chemin |
| 5 | **Tour Foudre** | Chaîne entre ennemis, rapide | Multi |

### Arbre de compétences in-run (par tour)

Chaque tour possède **3 branches d'amélioration** (niveau 1 → 3), achetables avec l'or gagné pendant le run. Exemple pour l'Archer :

```
Archer
├─ Branche A : Cadence de tir (vitesse +)
├─ Branche B : Flèches enflammées (dégâts sur la durée)
└─ Branche C : Portée étendue + détection des invisibles
```

Les branches sont **mutuellement exclusives** au niveau 3 (choix stratégique).

---

## 6. Ennemis & Vagues

### Types d'ennemis (V1)

| Type | Particularité |
|---|---|
| Gobelin | Rapide, peu de PV |
| Orc | Lent, tank |
| Fantôme | Immunisé aux tours physiques |
| Sorcier | Régénère les PV des alliés proches |
| Troll | Se régénère si non tué en 3s |

### Structure des vagues

- Vagues **1-9** : ennemis normaux, composition croissante
- **Vague 10** : Boss (PV x10, capacité spéciale)
- Vagues **11-19** : difficulté recalibrée + nouveaux types
- **Vague 20** : Boss intermédiaire + minions
- Et ainsi de suite... (cycle de 10 vagues, difficulté multiplicative)

### Boss (V1 : 2 boss uniques)

- **Ogre des Flammes** : AoE qui brûle les tours proches
- **Liche** : Ressuscite les ennemis tués si non éliminée rapidement

---

## 7. Économie In-Run

| Source | Gain |
|---|---|
| Ennemi normal tué | +5 à +20 or |
| Boss tué | +150 or |
| Vague complétée sans perte de PV (bonus) | +30 or |

| Dépense | Coût |
|---|---|
| Poser une tour | 50-100 or |
| Améliorer une tour (niv. 1→2) | 75 or |
| Améliorer une tour (niv. 2→3) | 150 or |
| Vendre une tour | 50% du coût total |

---

## 8. Méta-Progression (entre les runs)

**Monnaie méta : Gemmes** — gagnées à la fin de chaque run (score × multiplicateur).

### Arbre de méta-progression (3 branches globales)

```
Méta-progression
├─ Branche Offensive : Dégâts de base +, cadence de feu +
├─ Branche Défensive : PV de base +, tours moins chères
└─ Branche Économique : Or de départ +, intérêts sur l'or non dépensé
```

Chaque nœud coûte des Gemmes. L'arbre est **permanent** — survit entre les runs.

---

## 9. La Map (V1 : 1 map)

- Chemin **fixe et sinueux** (les ennemis suivent un trajet prédéfini)
- ~15-20 **emplacements de tours** disposés stratégiquement autour du chemin
- Style visuel : forêt fantaisie (ton à confirmer)
- **Point d'entrée** des ennemis visible, **base** défendue visible à la fin du chemin
- La base possède **20 PV** (chaque ennemi qui arrive enlève 1 PV)

---

## 10. Interface Utilisateur

### Écrans

1. **Menu principal** : Jouer, Méta-progression, (Options)
2. **Carte de jeu** : Map + HUD
3. **Écran de fin de run** : Score, Gemmes gagnées, retour au menu

### HUD in-game

- Barre de PV de la base
- Compteur d'or
- Numéro de vague actuel
- Minuterie avant la prochaine vague
- Panneau de sélection des tours (bas d'écran)
- Bouton "lancer la vague" (anticipation possible)

### Contrôles mobiles

- **Tap** sur un emplacement vide → poser une tour (menu de choix)
- **Tap** sur une tour existante → ouvrir l'arbre d'amélioration
- **Pinch** → zoom (optionnel V2)

---

## 11. Phases de Développement

### Phase 1 — Prototype jouable (MVP)

- [ ] Setup projet Vite + Phaser 3 dans VS Code
- [ ] 1 map avec chemin fixe
- [ ] 2 tours fonctionnelles (Archer + Canon)
- [ ] Ennemis basiques qui suivent le chemin
- [ ] Système de vagues (10 vagues)
- [ ] Économie or / placement de tours
- [ ] Game Over basique

### Phase 2 — Contenu complet V1

- [ ] 5 tours avec arbres de compétences
- [ ] 5 types d'ennemis
- [ ] 2 boss (vagues 10 et 20)
- [ ] Méta-progression avec Gemmes
- [ ] Sauvegarde localStorage
- [ ] UI complète (menus, HUD)

### Phase 3 — Polish

- [ ] Assets graphiques définitifs
- [ ] Effets sonores & musique
- [ ] Animations (projectiles, morts, effets de tours)
- [ ] Équilibrage des valeurs
- [ ] Tests mobile (touch, performance)

---

## 12. Points à Définir Ultérieurement

- Style graphique final (pixel art, vectoriel, 2.5D ?)
- Source des assets (gratuits, commissionés, générés)
- PWA installable ou non
- Système de scores / leaderboard local
- Nombre de maps en V2
- Ajout de modes (défi quotidien, vague infinie pure sans méta ?)
