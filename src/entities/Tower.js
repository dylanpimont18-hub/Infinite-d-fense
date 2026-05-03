import Phaser from 'phaser';

import Projectile from './Projectile.js';

const DEFAULT_META = {
  damageMultiplier: 1,
  fireRateMultiplier: 1,
};

export default class Tower {
  constructor(scene, x, y, config, options = {}) {
    this.scene     = scene;
    this.x         = x;
    this.y         = y;
    this.baseConfig = config;
    this.metaModifiers = { ...DEFAULT_META, ...(options.metaModifiers ?? {}) };
    this.lastFired = 0;
    this.disabled  = false;
    this.destroyed = false;
    this.spentGold = options.placementCost ?? config.cost;
    this.upgradeState = {
      branchKey: null,
      tier: 1,
    };
    this.stats = this.buildStats();

    this.body = scene.add.circle(x, y, 20, config.color).setDepth(3);
    this.body.setStrokeStyle(3, 0xffffff, 0.85);
    this.label = scene.add.text(x, y, config.name[0], {
      fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(3);

    this.refreshVisuals();
    this.playPlaceEffect();
  }

  playPlaceEffect() {
    this.body.setScale(0);
    this.label.setScale(0);
    this.scene.tweens.add({
      targets: [this.body, this.label],
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 160,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: [this.body, this.label],
          scaleX: 1,
          scaleY: 1,
          duration: 120,
          ease: 'Sine.easeIn',
        });
      },
    });
  }

  buildStats() {
    const stats = {
      damage: this.baseConfig.damage,
      range: this.baseConfig.range,
      fireRate: this.baseConfig.fireRate,
      splashRadius: this.baseConfig.splashRadius ?? 0,
      damageType: this.baseConfig.damageType ?? 'physical',
      slowFactor: this.baseConfig.slowFactor ?? 0,
      slowDuration: this.baseConfig.slowDuration ?? 2000,
      auraSlowFactor: this.baseConfig.auraSlowFactor ?? 0,
      auraSlowDuration: this.baseConfig.auraSlowDuration ?? 400,
      chainCount: this.baseConfig.chainCount ?? 0,
      chainRange: this.baseConfig.chainRange ?? 90,
    };

    if (stats.damage) {
      stats.damage = Math.max(0, Math.round(stats.damage * this.metaModifiers.damageMultiplier));
    }
    if (stats.fireRate) {
      stats.fireRate = Math.max(250, Math.round(stats.fireRate * this.metaModifiers.fireRateMultiplier));
    }

    const branch = this.upgradeState.branchKey
      ? this.baseConfig.upgrades?.[this.upgradeState.branchKey]
      : null;
    const tiersToApply = Math.max(0, this.upgradeState.tier - 1);
    for (let index = 0; index < tiersToApply; index++) {
      this.applyEffect(stats, branch?.tiers[index]?.effect);
    }

    return stats;
  }

  applyEffect(stats, effect = {}) {
    if (effect.damageMultiplier) {
      stats.damage = Math.max(0, Math.round(stats.damage * effect.damageMultiplier));
    }
    if (effect.damageBonus) {
      stats.damage = Math.max(0, stats.damage + effect.damageBonus);
    }
    if (effect.fireRateMultiplier && stats.fireRate) {
      stats.fireRate = Math.max(200, Math.round(stats.fireRate * effect.fireRateMultiplier));
    }
    if (effect.fireRate) {
      stats.fireRate = effect.fireRate;
    }
    if (effect.rangeBonus) {
      stats.range += effect.rangeBonus;
    }
    if (effect.splashBonus) {
      stats.splashRadius = (stats.splashRadius ?? 0) + effect.splashBonus;
    }
    if (effect.slowFactor) {
      stats.slowFactor = effect.slowFactor;
    }
    if (effect.slowDurationBonus) {
      stats.slowDuration += effect.slowDurationBonus;
    }
    if (effect.auraSlowFactor) {
      stats.auraSlowFactor = effect.auraSlowFactor;
    }
    if (effect.auraSlowDuration) {
      stats.auraSlowDuration = effect.auraSlowDuration;
    }
    if (effect.chainCountBonus) {
      stats.chainCount = (stats.chainCount ?? 0) + effect.chainCountBonus;
    }
    if (effect.chainRangeBonus) {
      stats.chainRange = (stats.chainRange ?? 90) + effect.chainRangeBonus;
    }
    if (effect.damageType) {
      stats.damageType = effect.damageType;
    }
  }

  refreshVisuals() {
    this.body.setStrokeStyle(2 + this.upgradeState.tier, 0xffffff, 0.85);
    this.label.setText(`${this.baseConfig.name[0]}${this.upgradeState.tier}`);
  }

  update(time, enemies) {
    if (this.disabled) return;

    if (this.stats.auraSlowFactor) {
      enemies.forEach(e => {
        if (e.alive && Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= this.stats.range) {
          e.applySlowEffect(this.stats.auraSlowFactor, this.stats.auraSlowDuration);
        }
      });
    }

    if (!this.stats.fireRate) return;
    if (time < this.lastFired + this.stats.fireRate) return;

    const target = this.getTarget(enemies);
    if (!target) return;

    this.lastFired = time;
    this.fire(target, enemies);
  }

  getTarget(enemies) {
    const inRange = enemies.filter(e =>
      e.alive && Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= this.stats.range
    );
    if (!inRange.length) return null;
    return inRange.reduce((best, e) => e.waypointIndex > best.waypointIndex ? e : best);
  }

  playFireEffect() {
    this.scene.tweens.add({
      targets: [this.body, this.label],
      scaleX: 1.35,
      scaleY: 1.35,
      duration: 60,
      ease: 'Sine.easeOut',
      yoyo: true,
    });
  }

  fire(target, enemies) {
    this.playFireEffect();
    if (this.stats.chainCount) {
      this.fireLightning(target, enemies);
    } else {
      const getEnemies = () => this.scene.waveManager?.getEnemies() ?? [];
      new Projectile(
        this.scene, this.x, this.y,
        target,
        this.stats.damage,
        this.stats.splashRadius ?? 0,
        getEnemies,
        this.stats.damageType ?? 'physical',
        this.stats.slowFactor ?? 0,
        this.stats.slowDuration ?? 2000,
      );
    }
  }

  fireLightning(primary, allEnemies) {
    const chainRange = this.stats.chainRange ?? 90;
    const hit  = new Set([primary]);
    const path = [{ x: this.x, y: this.y }];
    let current = primary;

    for (let i = 0; i < this.stats.chainCount; i++) {
      if (!current.alive) break;
      path.push({ x: current.x, y: current.y });
      current.takeDamage(this.stats.damage, this.stats.damageType);

      const next = allEnemies
        .filter(e => e.alive && !hit.has(e) &&
          Phaser.Math.Distance.Between(current.x, current.y, e.x, e.y) <= chainRange)
        .sort((a, b) =>
          Phaser.Math.Distance.Between(current.x, current.y, a.x, a.y) -
          Phaser.Math.Distance.Between(current.x, current.y, b.x, b.y)
        )[0];

      if (!next) break;
      hit.add(next);
      current = next;
    }

    // Trait principal
    const g = this.scene.add.graphics().setDepth(4);
    g.lineStyle(3, 0xfde68a, 1);
    for (let i = 0; i < path.length - 1; i++) {
      g.beginPath();
      g.moveTo(path[i].x, path[i].y);
      g.lineTo(path[i + 1].x, path[i + 1].y);
      g.strokePath();
    }

    // Eclair blanc sur chaque cible touchee
    path.slice(1).forEach(pt => {
      const spark = this.scene.add.graphics().setDepth(5);
      spark.fillStyle(0xffffff, 0.9);
      spark.fillCircle(pt.x, pt.y, 5);
      this.scene.tweens.add({
        targets: spark,
        scaleX: 2.5,
        scaleY: 2.5,
        alpha: 0,
        duration: 180,
        ease: 'Sine.easeOut',
        onComplete: () => spark.destroy(),
      });
    });

    this.scene.tweens.add({
      targets: g, alpha: 0, duration: 180,
      onComplete: () => g.destroy(),
    });
  }

  disable(duration) {
    if (this.disabled) return;
    this.disabled = true;
    this.body.setFillStyle(0x555566);
    this.scene.time.delayedCall(duration, () => {
      if (!this.destroyed) {
        this.disabled = false;
        this.body.setFillStyle(this.baseConfig.color);
      }
    });
  }

  upgrade(branchKey, cost) {
    if (!this.baseConfig.upgrades?.[branchKey]) return false;

    if (!this.upgradeState.branchKey) {
      this.upgradeState.branchKey = branchKey;
      this.upgradeState.tier = 2;
    } else if (this.upgradeState.branchKey === branchKey && this.upgradeState.tier === 2) {
      this.upgradeState.tier = 3;
    } else {
      return false;
    }

    this.spentGold += cost;
    this.stats = this.buildStats();
    this.refreshVisuals();
    return true;
  }

  getSellValue() {
    return Math.floor(this.spentGold * 0.5);
  }

  getUpgradeOptions() {
    if (!this.baseConfig.upgrades) return [];

    if (!this.upgradeState.branchKey) {
      return Object.entries(this.baseConfig.upgrades).map(([key, data]) => ({
        key,
        name: data.name,
        label: data.tiers[0].label,
        cost: 75,
      }));
    }

    if (this.upgradeState.tier >= 3) return [];

    const branch = this.baseConfig.upgrades[this.upgradeState.branchKey];
    return [{
      key: this.upgradeState.branchKey,
      name: branch.name,
      label: branch.tiers[1].label,
      cost: 150,
    }];
  }

  getInfo() {
    return {
      name: this.baseConfig.name,
      description: this.baseConfig.description,
      tier: this.upgradeState.tier,
      branchName: this.upgradeState.branchKey
        ? this.baseConfig.upgrades?.[this.upgradeState.branchKey]?.name ?? null
        : null,
      damage: this.stats.damage,
      range: this.stats.range,
      fireRate: this.stats.fireRate,
      nextUpgrades: this.getUpgradeOptions(),
      sellPrice: this.getSellValue(),
    };
  }

  destroy() {
    this.destroyed = true;
    this.body.destroy();
    this.label.destroy();
  }
}
