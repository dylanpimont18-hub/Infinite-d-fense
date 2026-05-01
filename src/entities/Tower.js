import Projectile from './Projectile.js';

export default class Tower {
  constructor(scene, x, y, config) {
    this.scene     = scene;
    this.x         = x;
    this.y         = y;
    this.config    = config;
    this.lastFired = 0;

    this.body = scene.add.circle(x, y, 20, config.color).setDepth(3);
    this.body.setStrokeStyle(3, 0xffffff, 0.85);
    this.label = scene.add.text(x, y, config.name[0], {
      fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(3);
  }

  update(time, enemies) {
    if (!this.config.fireRate) return;
    if (time < this.lastFired + this.config.fireRate) return;
    const target = this.getTarget(enemies);
    if (!target) return;
    this.lastFired = time;
    this.fire(target);
  }

  getTarget(enemies) {
    const inRange = enemies.filter(e =>
      e.alive && Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) <= this.config.range
    );
    if (!inRange.length) return null;
    // Cible l'ennemi le plus avancé sur le chemin
    return inRange.reduce((best, e) => e.waypointIndex > best.waypointIndex ? e : best);
  }

  fire(target) {
    const getEnemies = () => this.scene.waveManager?.getEnemies() ?? [];
    new Projectile(
      this.scene, this.x, this.y,
      target, this.config.damage,
      this.config.splashRadius ?? 0,
      getEnemies,
    );
  }

  destroy() {
    this.body.destroy();
    this.label.destroy();
  }
}
