# Step 13 — Polish & Équilibrage

**Date:** 2026-05-03  
**Scope:** Animations, effets visuels, équilibrage des vagues. Aucun son.

---

## Animations

| Déclencheur | Effet |
|---|---|
| Pose de tour | Scale 0→1.2→1 sur `tower.body` + `tower.label` (durée 280ms) |
| Tir de tour | Scale 1→1.35→1 sur `tower.body` (durée 80ms, yoyo) + flash couleur tour |
| Mort d'ennemi | Cercle temporaire à la position de mort : scale 1→2.5 + alpha 0.8→0 (200ms) couleur de l'ennemi |

---

## Effets visuels

| Effet | Implémentation |
|---|---|
| Explosion Canon | Dans `Projectile.impact()` si `splashRadius > 0` et `damageType === 'physical'` : anneau orange qui s'élargit + 6 éclats rayonnants (tweens graphics, 300ms) |
| Gel Mage Glace | Dans `Projectile.impact()` si `damageType === 'magic'` et `slowFactor > 0` : anneau cyan qui s'élargit (tweens graphics, 250ms) |
| Chaîne Foudre | Déjà présent dans `Tower.fireLightning()`, légère amélioration : épaisseur 3px, éclat blanc ponctuel sur chaque cible |
| Flash rouge base | Dans `GameScene.onBaseHit()` : rectangle rouge plein-écran, alpha 0.35→0, durée 250ms |

---

## Architecture — Approche A (inline)

- `Enemy.die()` → appelle `playDeathEffect(scene, x, y, color)` (fonction locale dans Enemy.js)
- `Tower.fire()` → appelle `playFireEffect()` méthode de Tower
- `Tower` constructor → appelle `playPlaceEffect()` méthode de Tower
- `Projectile.impact()` → appelle `playImpactEffect(scene, x, y, type, splashRadius, slowFactor)` (fonction locale dans Projectile.js)
- `GameScene.onBaseHit()` → appelle `playBaseHitFlash()` méthode de GameScene

Toutes les fonctions créent des objets graphiques Phaser temporaires détruits dans `onComplete`.

---

## Équilibrage

Ajustements conservateurs basés sur l'analyse du rapport coût/HP/récompense :

**Ennemis :**
- Goblin reward : 5 → 6 (vient en masse, légère revalorisation)
- Troll reward : 25 → 35 (300 HP + regen, sous-récompensé)

**Vagues :**
- Vague 5 interval goblin : 800ms → 900ms (légèrement moins dense)
- Vague 14 interval goblin : 600ms → 700ms (moins oppressant avec orcs + sorcerers)
- Vague 17 interval goblin : 500ms → 600ms (20 goblins à 500ms = très dense)

---

## Contraintes

- Pas de sons
- Pas de sprites — tout en graphiques procéduraux Phaser
- Pas de nouveaux fichiers système, modifications dans les classes existantes uniquement
