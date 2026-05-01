import Projectile from './Projectile.js';

export default class Tower {
  constructor(scene, x, y, config) {
    this.scene     = scene;
    this.x         = x;
    this.y         = y;
    this.config    = config;
    this.lastFired = 0;
    this.disabled  = false;
    this.destroyed = false;

    this.body = scene.add.circle(x, y, 20, config.color).setDepth(3);
    this.body.setStrokeStyle(3, 0xffffff, 0.85);
    this.label = scene.add.text(x, y, config.name[0], {
      fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(3);
  }

  update(time, enemies) {
    if (this.disabled) return;

    // Barricade : aura de ralentissement passif
    if (this.config.slowFactor && !this.config.fireRate) {
      enemies.forEach(e => {
        if (e.alive && Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= this.config.range) {
          e.applySlowEffect(this.config.slowFactor, 400);
        }
      });
      return;
    }

    if (!this.config.fireRate) return;
    if (time < this.lastFired + this.config.fireRate) return;

    const target = this.getTarget(enemies);
    if (!target) return;

    this.lastFired = time;
    this.fire(target, enemies);
  }

  getTarget(enemies) {
    const inRange = enemies.filter(e =>
      e.alive && Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= this.config.range
    );
    if (!inRange.length) return null;
    return inRange.reduce((best, e) => e.waypointIndex > best.waypointIndex ? e : best);
  }

  fire(target, enemies) {
    if (this.config.chainCount) {
      this.fireLightning(target, enemies);
    } else {
      const getEnemies = () => this.scene.waveManager?.getEnemies() ?? [];
      new Projectile(
        this.scene, this.x, this.y,
        target,
        this.config.damage,
        this.config.splashRadius ?? 0,
        getEnemies,
        this.config.damageType ?? 'physical',
        this.config.slowFactor ?? 0,
        this.config.slowDuration ?? 2000,
      );
    }
  }

  fireLightning(primary, allEnemies) {
    const chainRange = this.config.chainRange ?? 90;
    const hit  = new Set([primary]);
    const path = [{ x: this.x, y: this.y }];
    let current = primary;

    for (let i = 0; i < this.config.chainCount; i++) {
      if (!current.alive) break;
      path.push({ x: current.x, y: current.y });
      current.takeDamage(this.config.damage, this.config.damageType);

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

    // Visuel eclair
    const g = this.scene.add.graphics().setDepth(4);
    g.lineStyle(2, 0xfde68a, 1);
    for (let i = 0; i < path.length - 1; i++) {
      g.beginPath();
      g.moveTo(path[i].x, path[i].y);
      g.lineTo(path[i + 1].x, path[i + 1].y);
      g.strokePath();
    }
    this.scene.tweens.add({
      targets: g, alpha: 0, duration: 200,
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
        this.body.setFillStyle(this.config.color);
      }
    });
  }

  destroy() {
    this.destroyed = true;
    this.body.destroy();
    this.label.destroy();
  }
}
